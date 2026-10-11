import importlib.util
import base64
import gzip
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch, Mock
if os.name == "nt":
    sys.modules.setdefault("fcntl", Mock())
spec = importlib.util.spec_from_file_location("runtime", Path(__file__).parents[1] / "runtime.py")
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)

class ReleaseTests(unittest.TestCase):
    def test_proxy_base_rejects_mutable_or_untrusted_image_before_docker(self):
        for image in ("caddy:latest", "untrusted@sha256:" + "a" * 64, "caddy@sha256:" + "a" * 64 + "\nRUN echo unsafe"):
            with patch.object(runtime, "docker") as docker:
                with self.assertRaises(ValueError):
                    runtime.proxy_runtime_image(image)
                docker.assert_not_called()

    def test_bootstrap_payload_has_space_for_config_under_ec2_limit(self):
        module = Path(__file__).parents[1]
        template = (module / "bootstrap.sh.tftpl").read_text()
        packed = base64.b64encode(gzip.compress((module / "runtime.py").read_bytes())).decode()
        payload = template.replace("${runtime_b64}", packed).replace("${config_b64}", "x" * 4096)
        self.assertLess(len(payload.encode()), 16384)

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name) / "state"
        self.base.mkdir()
        self.cfg = {"repository": "123456789012.dkr.ecr.sa-east-1.amazonaws.com/talke-staging",
                    "origin": "https://staging.example.test", "region": "sa-east-1",
                    "secret_arn": "fixture-secret", "environment": "staging"}
        self.prior = {"image": self.cfg["repository"] + "@sha256:" + "a" * 64,
                      "secret_version": "b" * 32, "slot": "blue"}
        self.image = self.cfg["repository"] + "@sha256:" + "c" * 64
        self.version = "d" * 32
        for target, value in [("BASE", self.base), ("RUN", Path(self.tmp.name) / "run")]:
            p = patch.object(runtime, target, value)
            p.start()
            self.addCleanup(p.stop)
        p = patch.object(runtime, "config", return_value=self.cfg)
        p.start()
        self.addCleanup(p.stop)
        runtime.write(self.base / "current.json", self.prior)

    def test_candidate_readiness_failure_preserves_prior_and_never_switches_traffic(self):
        with patch.object(runtime, "prepare", return_value="candidate"), patch.object(runtime, "await_ready", side_effect=RuntimeError()), patch.object(runtime, "switch_proxy") as switch, patch.object(runtime, "remove"):
            with self.assertRaises(RuntimeError):
                runtime.release(self.image, self.version)
            switch.assert_not_called()
            self.assertEqual(runtime.read(self.base / "current.json"), self.prior)
            self.assertFalse((self.base / "pending.json").exists())

    def test_public_probe_failure_rolls_back_and_clears_journal(self):
        with patch.object(runtime, "prepare", return_value="candidate"), patch.object(runtime, "await_ready", side_effect=[None, RuntimeError(), None]), patch.object(runtime, "switch_proxy") as switch, patch.object(runtime, "remove"):
            with self.assertRaises(RuntimeError):
                runtime.release(self.image, self.version)
            self.assertEqual(switch.call_args_list[-1].args[0], self.prior)
            self.assertEqual(runtime.read(self.base / "current.json"), self.prior)
            self.assertFalse((self.base / "pending.json").exists())

    def test_failed_rollback_keeps_journal_and_blocks_maintenance(self):
        with patch.object(runtime, "prepare", return_value="candidate"), patch.object(runtime, "await_ready", side_effect=[None, RuntimeError()]), patch.object(runtime, "switch_proxy", side_effect=[None, RuntimeError()]), patch.object(runtime, "remove"), patch("builtins.print") as output:
            with self.assertRaises(RuntimeError):
                runtime.release(self.image, self.version)
            self.assertTrue((self.base / "pending.json").exists())
            self.assertIn("RECOVERY_REQUIRED", output.call_args.args[0])
        with patch.object(runtime, "secret_files") as secrets:
            runtime.maintenance()
            secrets.assert_not_called()

    def test_success_commits_same_image_and_secret_and_retains_rollback_record(self):
        with patch.object(runtime, "prepare", return_value="candidate"), patch.object(runtime, "await_ready"), patch.object(runtime, "switch_proxy"), patch("builtins.print"):
            runtime.release(self.image, self.version)
        self.assertEqual(runtime.read(self.base / "current.json"), {"image": self.image, "secret_version": self.version, "slot": "green"})
        self.assertEqual(runtime.read(self.base / "previous.json"), self.prior)
        self.assertFalse((self.base / "pending.json").exists())

    def test_interrupted_release_restores_committed_version_on_reboot(self):
        runtime.write(self.base / "pending.json", {"candidate": {"image": "wrong"}})
        with patch.object(runtime, "prepare", return_value="prior") as prepare, patch.object(runtime, "await_ready"), patch.object(runtime, "switch_proxy") as switch:
            runtime.restore()
            prepare.assert_called_once_with(self.prior)
            switch.assert_called_once_with(self.prior)
        self.assertFalse((self.base / "pending.json").exists())

    def test_first_uncommitted_release_is_removed_on_reboot(self):
        (self.base / "current.json").unlink()
        runtime.write(self.base / "pending.json", {"candidate": "fixture"})
        with patch.object(runtime, "remove") as remove, patch.object(runtime, "prepare") as prepare:
            runtime.restore()
            prepare.assert_not_called()
            self.assertEqual(remove.call_count, 3)

    def test_reboot_journal_takes_precedence_over_an_incomplete_commit(self):
        runtime.write(self.base / "pending.json", {"prior": self.prior})
        runtime.write(self.base / "current.json", {"image": "uncommitted"})
        with patch.object(runtime, "prepare", return_value="prior") as prepare, patch.object(runtime, "await_ready"), patch.object(runtime, "switch_proxy"):
            runtime.restore()
            prepare.assert_called_once_with(self.prior)
        self.assertEqual(runtime.read(self.base / "current.json"), self.prior)

    def test_rejects_mutable_and_other_environment_images(self):
        for image in ("app:latest", self.image.replace("staging", "production"), self.image + ";evil"):
            with self.assertRaises(ValueError):
                runtime.validate_release({"image": image, "secret_version": self.version, "slot": "blue"})
        with self.assertRaises(ValueError):
            runtime.validate_release({**self.prior, "secret_version": "AWSCURRENT"})

    def test_secret_rejects_arbitrary_env_injection_and_wrong_firebase_project(self):
        credential = {"type": "service_account", "project_id": "talke-staging",
                      "client_email": "runtime@talke-staging.iam.gserviceaccount.com",
                      "token_uri": "https://oauth2.googleapis.com/token", "private_key": "-----BEGIN PRIVATE KEY-----\nfixture"}
        env = {"APP_ORIGIN": self.cfg["origin"], "FIREBASE_PROJECT_ID": "talke-staging"}
        variants = [
            {"environment": {**env, "NODE_OPTIONS": "--import evil"}, "firebaseServiceAccount": credential},
            {"environment": {**env, "LEGAL_NAME": "fixture\nINJECTION=true"}, "firebaseServiceAccount": credential},
            {"environment": {**env, "APP_ORIGIN": "https://other.example.test"}, "firebaseServiceAccount": credential},
            {"environment": env, "firebaseServiceAccount": {**credential, "project_id": "other"}},
            {"environment": env, "firebaseServiceAccount": {**credential, "token_uri": "https://evil.example.test"}},
        ]
        for value in variants:
            with patch.object(runtime, "aws", return_value=json.dumps(value)), self.assertRaises(ValueError):
                runtime.secret_files(self.prior)

    def test_failed_or_stale_maintenance_is_unhealthy(self):
        for last in ({"success": False, "time": runtime.time.time()}, {"success": True, "time": 0}):
            runtime.write(self.base / "maintenance.json", last)
            with patch.object(runtime, "aws") as aws, patch.object(runtime, "probe") as probe:
                runtime.health()
                self.assertEqual(json.loads(aws.call_args.args[-1])[0]["Value"], 0)
                probe.assert_not_called()

    def test_healthy_requires_database_probe_and_recent_successful_maintenance(self):
        runtime.write(self.base / "maintenance.json", {"success": True, "time": runtime.time.time()})
        with patch.object(runtime, "aws") as aws, patch.object(runtime, "probe") as probe:
            runtime.health()
            probe.assert_called_once_with(self.cfg["origin"])
            self.assertEqual(json.loads(aws.call_args.args[-1])[0]["Value"], 1)
