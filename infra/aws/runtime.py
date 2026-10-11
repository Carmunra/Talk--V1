#!/usr/bin/env python3
"""Host-only release controller. Never include secrets in command output or receipts."""
import contextlib
import fcntl
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASE = Path("/var/lib/talke")
RUN = Path("/run/talke")
CONFIG_PATH = Path("/opt/talke/config.json")
ENV_KEYS = set("""APP_ORIGIN FIREBASE_PROJECT_ID FIRESTORE_DATABASE_ID LEGAL_NAME LEGAL_CNPJ
PRIVACY_EMAIL SUPPORT_EMAIL SUPPORT_EMAIL_SECONDARY LEGAL_APPROVED TERMS_VERSION MINIMUM_AGE
MINORS_ENABLED MINORS_SAFEGUARDS_APPROVED PAYMENTS_ENABLED PAYMENTS_HOMOLOGATED MP_ENVIRONMENT
MP_CLIENT_ID MP_CLIENT_SECRET MP_WEBHOOK_SECRET TOKEN_ENCRYPTION_KEY DAILY_API_KEY DAILY_DOMAIN""".split())

def command(args, *, stdin=None, timeout=120):
    # Caller never forwards subprocess stderr, stdout, environment or exception details.
    return subprocess.run(args, input=stdin, text=True, capture_output=True,
                          check=True, timeout=timeout).stdout.strip()

def config():
    return json.loads(CONFIG_PATH.read_text())

def aws(*args):
    return command(["aws", "--region", config()["region"], "--no-cli-pager", *args])

def docker(*args, **kwargs):
    return command(["docker", *args], **kwargs)

def read(path):
    return json.loads(path.read_text()) if path.exists() else None

def write(path, value, mode=0o600):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temp = path.with_suffix(".tmp")
    temp.write_text(value if isinstance(value, str) else json.dumps(value))
    temp.chmod(mode)
    os.replace(temp, path)

def validate_release(release):
    cfg = config()
    if not re.fullmatch(re.escape(cfg["repository"]) + r"@sha256:[a-f0-9]{64}", release["image"]):
        raise ValueError("Image must be an immutable digest from this environment")
    if not re.fullmatch(r"[a-fA-F0-9-]{32,64}", release["secret_version"]):
        raise ValueError("Pin the immutable secret version ID")
    if release["slot"] not in ("blue", "green"):
        raise ValueError("Invalid slot")
    return release

def secret_files(release):
    cfg = config()
    data = json.loads(aws("secretsmanager", "get-secret-value", "--secret-id", cfg["secret_arn"],
                          "--version-id", release["secret_version"], "--query", "SecretString", "--output", "text"))
    env, credential = data["environment"], data["firebaseServiceAccount"]
    if not isinstance(env, dict) or set(env) - ENV_KEYS:
        raise ValueError("Unknown runtime variables")
    if any(not isinstance(value, str) or any(c in value for c in ("\n", "\r", "\x00"))
           for value in env.values()):
        raise ValueError("Runtime values must be single-line strings")
    if env.get("APP_ORIGIN") != cfg["origin"] or not env.get("FIREBASE_PROJECT_ID"):
        raise ValueError("Wrong origin or missing Firebase project")
    if (credential.get("type") != "service_account"
        or credential.get("project_id") != env["FIREBASE_PROJECT_ID"]
        or credential.get("token_uri") != "https://oauth2.googleapis.com/token"
        or not str(credential.get("client_email", "")).endswith(".iam.gserviceaccount.com")
        or not str(credential.get("private_key", "")).startswith("-----BEGIN PRIVATE KEY-----\n")):
        raise ValueError("A dedicated Firebase service account is required")
    folder = RUN / release["slot"]
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Parent /run/talke remains root-only. Bind-mounted folder must be traversable by node.
    folder.chmod(0o755)
    write(folder / "firebase.json", credential, 0o400)
    os.chown(folder / "firebase.json", 1000, 1000)
    env.update(NODE_ENV="production", PORT="3000", TRUST_PROXY_HOPS="1",
               GOOGLE_APPLICATION_CREDENTIALS="/credentials/firebase.json")
    write(folder / "runtime.env", "\n".join(k + "=" + v for k, v in env.items()) + "\n")
    return folder

def login():
    cfg = config()
    docker("login", "--username", "AWS", "--password-stdin",
           cfg["repository"].split("/")[0], stdin=aws("ecr", "get-login-password"))

def remove(name):
    with contextlib.suppress(Exception):
        docker("rm", "-f", name)

def prepare(release):
    validate_release(release)
    folder = secret_files(release)
    login()
    docker("pull", release["image"])
    project = docker("image", "inspect", release["image"], "--format", '{{index .Config.Labels "com.talke.firebase.project"}}')
    env = dict(line.split("=", 1) for line in (folder / "runtime.env").read_text().splitlines())
    if project != env["FIREBASE_PROJECT_ID"]:
        raise ValueError("Client and server Firebase projects must match")
    with contextlib.suppress(Exception):
        docker("network", "create", "talke-edge")
    name = "talke-" + release["slot"]
    remove(name)
    cfg = config()
    port = "3001" if release["slot"] == "blue" else "3002"
    docker("run", "-d", "--name", name, "--restart", "unless-stopped",
           "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges",
           "--memory=512m", "--cpus=1", "--pids-limit=200",
           "--tmpfs", "/tmp:rw,noexec,nosuid,size=32m",
           "--network", "talke-edge", "-p", "127.0.0.1:" + port + ":3000",
           "--env-file", str(folder / "runtime.env"),
           "-v", str(folder / "firebase.json") + ":/credentials/firebase.json:ro",
           "--log-driver", "awslogs", "--log-opt", "awslogs-region=" + cfg["region"],
           "--log-opt", "awslogs-group=" + cfg["log_group"],
           "--log-opt", "awslogs-stream=" + name,
           "--log-opt", "mode=non-blocking", "--log-opt", "max-buffer-size=4m",
           release["image"])
    return "http://127.0.0.1:" + port

def probe(origin):
    for path, expected in (("/api/ready", 200), ("/api/me", 401), ("/", 200)):
        try:
            response = urllib.request.urlopen(origin + path, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            if response.code != expected:
                raise RuntimeError("Release probe failed")
            if path == "/" and "frame-ancestors 'none'" not in response.headers.get("Content-Security-Policy", ""):
                raise RuntimeError("CSP missing")
            if path == "/api/me" and "no-store" not in response.headers.get("Cache-Control", ""):
                raise RuntimeError("Private cache header missing")

def await_ready(origin, attempts=30):
    for attempt in range(attempts):
        try:
            probe(origin)
            return
        except Exception:
            if attempt == attempts - 1:
                raise
            time.sleep(2)

def proxy_text(release):
    domain = config()["origin"].removeprefix("https://")
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]+\.[a-z]{2,}", domain):
        raise ValueError("Invalid domain")
    # No access logging: URLs, session tokens and identifiers are not collected here.
    return """{
  http_port 8080
  https_port 8443
  admin localhost:2019
}
""" + domain + """ {
  reverse_proxy talke-""" + release["slot"] + """:3000
}
"""

def proxy_runtime_image(base_image):
    if not re.fullmatch(r"caddy@sha256:[a-f0-9]{64}", base_image):
        raise ValueError("Proxy base must be an immutable official Caddy digest")
    image = "talke-proxy:" + base_image.split(":")[-1]
    docker("pull", base_image)
    # A fresh inode preserves binary contents without the upstream file capability.
    # This permits cap-drop=ALL and nonroot ports, without granting NET_BIND_SERVICE.
    recipe = ("FROM " + base_image + "\nUSER root\n"
              "RUN cat /usr/bin/caddy > /usr/bin/caddy-unprivileged && "
              "chmod 0755 /usr/bin/caddy-unprivileged && "
              "mv /usr/bin/caddy-unprivileged /usr/bin/caddy\nUSER 1000:1000\n")
    docker("build", "--network=none", "--tag", image, "-", stdin=recipe, timeout=300)
    return image


def switch_proxy(release):
    cfg = config()
    folder = BASE / "caddy"
    folder.mkdir(parents=True, exist_ok=True, mode=0o755)
    folder.chmod(0o755)
    data = BASE / "caddy-data"
    data.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chown(data, 1000, 1000)
    write(folder / "Caddyfile", proxy_text(release), 0o644)
    if not docker("ps", "-q", "--filter", "name=^talke-proxy$"):
        proxy_image = proxy_runtime_image(cfg["proxy_image"])
        remove("talke-proxy")
        docker("run", "-d", "--name", "talke-proxy", "--user", "1000:1000",
               "--restart", "unless-stopped", "--read-only", "--cap-drop=ALL",
               "--security-opt=no-new-privileges", "--network", "talke-edge",
               "--memory=128m", "--cpus=0.25", "--pids-limit=100",
               "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
               "-p", "80:8080", "-p", "443:8443",
               "-v", str(folder) + ":/etc/caddy:ro",
               "-v", str(data) + ":/data",
               "--log-driver", "local", "--log-opt", "max-size=5m",
               "--log-opt", "max-file=2",
               proxy_image, "caddy", "run", "--config", "/etc/caddy/Caddyfile")
    else:
        docker("exec", "talke-proxy", "caddy", "reload", "--config", "/etc/caddy/Caddyfile")

def restore():
    current = read(BASE / "current.json")
    pending = read(BASE / "pending.json")
    if pending and "prior" in pending:
        current = pending["prior"]
    if current:
        origin = prepare(current)
        await_ready(origin)
        switch_proxy(current)
        await_ready(config()["origin"])
        write(BASE / "current.json", current)
        (BASE / "pending.json").unlink(missing_ok=True)
    else:
        # Incomplete first publication must not resume an unapproved candidate after reboot.
        remove("talke-proxy")
        for slot in ("blue", "green"):
            remove("talke-" + slot)
        (BASE / "current.json").unlink(missing_ok=True)
        (BASE / "pending.json").unlink(missing_ok=True)

def release(image, version):
    if (BASE / "pending.json").exists():
        raise RuntimeError("Recover interrupted release before a new deployment")
    prior = read(BASE / "current.json")
    candidate = validate_release({"image": image, "secret_version": version,
                                  "slot": "green" if prior and prior["slot"] == "blue" else "blue"})
    # Validate credentials and readiness before changing traffic.
    try:
        await_ready(prepare(candidate))
    except Exception:
        remove("talke-" + candidate["slot"])
        raise
    write(BASE / "pending.json", {"prior": prior, "candidate": candidate})
    try:
        switch_proxy(candidate)
        await_ready(config()["origin"], attempts=60)  # Includes real TLS and Firestore access.
        if prior:
            write(BASE / "previous.json", prior)
        write(BASE / "current.json", candidate)
        (BASE / "pending.json").unlink()
    except Exception:
        try:
            if prior:
                switch_proxy(prior)
                await_ready(config()["origin"])
                write(BASE / "current.json", prior)
            else:
                remove("talke-proxy")
                (BASE / "current.json").unlink(missing_ok=True)
            (BASE / "pending.json").unlink(missing_ok=True)
            remove("talke-" + candidate["slot"])
        except Exception:
            print(json.dumps({"event": "release", "status": "RECOVERY_REQUIRED"}))
            # Journal retained; maintenance stays blocked until recovery.
        raise
    print(json.dumps({"event": "release", "status": "published", **candidate}))

def maintenance():
    current = read(BASE / "current.json")
    if not current or (BASE / "pending.json").exists():
        return
    cfg = config()
    folder = secret_files(current)
    name = "talke-maintenance"
    remove(name)
    try:
        # Output retained in CloudWatch, never returned through the release channel.
        docker("run", "--name", name, "--rm", "--read-only", "--cap-drop=ALL",
               "--security-opt=no-new-privileges", "--memory=256m", "--cpus=0.5",
               "--pids-limit=100", "--network", "talke-edge",
               "--env-file", str(folder / "runtime.env"),
               "-v", str(folder / "firebase.json") + ":/credentials/firebase.json:ro",
               "--log-driver", "awslogs", "--log-opt", "awslogs-region=" + cfg["region"],
               "--log-opt", "awslogs-group=" + cfg["log_group"],
               "--log-opt", "awslogs-stream=maintenance",
               current["image"], "node", "dist/scripts/reconcile.js", timeout=1830)
        write(BASE / "maintenance.json", {"success": True, "time": time.time()})
    except Exception:
        remove(name)
        write(BASE / "maintenance.json", {"success": False, "time": time.time()})
        raise

def health():
    current = read(BASE / "current.json")
    last = read(BASE / "maintenance.json") or {}
    healthy = 0
    try:
        if current and not (BASE / "pending.json").exists() and last.get("success") and time.time() - last.get("time", 0) < 2400:
            probe(config()["origin"])
            healthy = 1
    finally:
        aws("cloudwatch", "put-metric-data", "--namespace", "Talke", "--metric-data", json.dumps([{
            "MetricName": "Healthy", "Value": healthy, "Unit": "Count",
            "Dimensions": [{"Name": "Environment", "Value": config()["environment"]}]
        }]))

def main():
    os.umask(0o077)
    RUN.mkdir(parents=True, exist_ok=True, mode=0o700)
    if sys.argv[1] == "health":
        health()  # Does not wait on the long maintenance operation.
        return
    with (RUN / "operation.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            if sys.argv[1] == "maintenance":
                return
            raise RuntimeError("Another operation is running")
        action = sys.argv[1]
        if action == "release" and len(sys.argv) == 4:
            release(sys.argv[2], sys.argv[3])
        elif action == "restore":
            restore()
        elif action == "maintenance":
            maintenance()
        else:
            raise ValueError("Unknown operation")

if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Errors can contain secrets or provider responses; expose only the operation status.
        print(json.dumps({"event": "host_operation", "status": "failed"}))
        sys.exit(1)
