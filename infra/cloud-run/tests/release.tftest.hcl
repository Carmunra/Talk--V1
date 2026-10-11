mock_provider "google" {}
variables {
  project_id            = "fixture-project"
  image_digest          = "southamerica-east1-docker.pkg.dev/fixture-project/talke/app@sha256:0000000000000000000000000000000000000000000000000000000000000000"
  alert_email           = "ops@example.test"
  backup_retention_days = 7
  deployment_confirmed  = true
  runtime_env           = { APP_ORIGIN = "https://fixture.example.test", LEGAL_APPROVED = "true", PAYMENTS_ENABLED = "false" }
  secret_versions       = { DAILY_API_KEY = { secret_id = "daily-fixture", version = "1" } }
}
run "safe_defaults" {
  command = plan
  assert {
    condition     = google_cloud_run_v2_service.web.template[0].scaling[0].max_instance_count == 1
    error_message = "Não ampliar instâncias sem proteção de borda e validação de capacidade."
  }
  assert {
    condition     = google_cloud_run_v2_job.maintenance.template[0].parallelism == 1 && google_cloud_run_v2_job.maintenance.template[0].template[0].max_retries == 0
    error_message = "A manutenção deve ter uma tarefa por execução e repetição controlada pelo agendamento."
  }
  assert {
    condition     = google_cloud_run_v2_service.web.deletion_protection && google_cloud_run_v2_job.maintenance.deletion_protection
    error_message = "Proteção contra exclusão obrigatória."
  }
}
run "unapproved_release_blocked" {
  command = plan
  variables { deployment_confirmed = false }
  expect_failures = [google_cloud_run_v2_service.web]
}
run "payment_secrets_required" {
  command = plan
  variables {
    runtime_env = { APP_ORIGIN = "https://fixture.example.test", LEGAL_APPROVED = "true", PAYMENTS_ENABLED = "true" }
  }
  expect_failures = [google_cloud_run_v2_service.web]
}
