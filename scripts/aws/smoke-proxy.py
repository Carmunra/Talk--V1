#!/usr/bin/env python3
"""Linux-only offline smoke test of the production Caddy container and app network."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
spec = importlib.util.spec_from_file_location("runtime", Path(__file__).parents[2] / "infra/aws/runtime.py")
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
image = "talke-ci:local"
proxy_image = "caddy@sha256:f2a1290d0463aad60660d4ec134943f183ee2a5f6c3eb7bf32dd984f2f020772"
env = {
    "NODE_ENV": "production", "APP_ORIGIN": "https://staging.example.test",
    "FIREBASE_PROJECT_ID": "demo-talke", "LEGAL_NAME": "Smoke fixture",
    "LEGAL_CNPJ": "12345678000190", "PRIVACY_EMAIL": "privacy@example.test",
    "SUPPORT_EMAIL": "support@example.test", "LEGAL_APPROVED": "true",
    "PAYMENTS_ENABLED": "false", "MINORS_ENABLED": "false", "TRUST_PROXY_HOPS": "1",
    "GCE_METADATA_HOST": "127.0.0.1:9",
}
def get(path):
    try:
        return urllib.request.urlopen("http://127.0.0.1" + path, timeout=2)
    except urllib.error.HTTPError as error:
        return error
try:
    with tempfile.TemporaryDirectory() as directory:
        runtime.BASE = Path(directory)
        runtime.config = lambda: {"origin": "https://staging.example.test", "proxy_image": proxy_image}
        # Only this isolated fixture uses plain HTTP. Production uses automatic public TLS.
        production_text = runtime.proxy_text({"slot": "blue"})
        assert "https_port 8443" in production_text
        runtime.proxy_text = lambda release: "{\n http_port 8080\n admin localhost:2019\n}\nhttp://127.0.0.1:8080 {\n reverse_proxy talke-" + release["slot"] + ":3000\n}\n"
        runtime.docker("network", "create", "talke-edge")
        args = ["run", "-d", "--name", "talke-blue", "--network", "talke-edge",
                "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges"]
        for key, value in env.items():
            args += ["-e", key + "=" + value]
        runtime.docker(*args, image)
        runtime.switch_proxy({"slot": "blue"})
        for attempt in range(40):
            try:
                with get("/api/health") as response:
                    if response.code == 200:
                        break
            except Exception:
                pass
            time.sleep(0.5)
        else:
            raise RuntimeError("Caddy/app did not become healthy")
        with get("/api/me") as response:
            assert response.code == 401
            assert "no-store" in response.headers.get("Cache-Control", "")
        with get("/") as response:
            assert response.code == 200
            assert "frame-ancestors 'none'" in response.headers.get("Content-Security-Policy", "")
        inspected = json.loads(runtime.docker("inspect", "talke-proxy"))[0]
        assert inspected["Config"]["User"] == "1000:1000"
        assert inspected["HostConfig"]["ReadonlyRootfs"] is True
        assert "ALL" in inspected["HostConfig"]["CapDrop"]
        assert not inspected["HostConfig"]["CapAdd"]
        assert "2019/tcp" not in inspected["HostConfig"]["PortBindings"]
        # Exercise real Caddy reload. It must use the currently mounted directory and node alias.
        runtime.switch_proxy({"slot": "blue"})
        with get("/api/health") as response:
            assert response.code == 200
        print("AWS proxy: nonroot, read-only, isolated admin port, protected API, CSP and reload verified")
except Exception:
    # Only these isolated fixture containers exist here; no credentials are supplied.
    for name in ("talke-proxy", "talke-blue"):
        try:
            result = subprocess.run(["docker", "logs", "--tail", "40", name],
                                    capture_output=True, text=True, timeout=10)
            print(name + " fixture logs:", result.stdout, result.stderr)
        except Exception:
            pass
    raise
finally:
    for name in ("talke-proxy", "talke-blue"):
        runtime.remove(name)
    try:
        runtime.docker("network", "rm", "talke-edge")
    except Exception:
        pass
