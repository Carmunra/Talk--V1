locals {
  env = merge(var.runtime_env, {
    NODE_ENV = "production", FIREBASE_PROJECT_ID = var.project_id, FIRESTORE_DATABASE_ID = var.database_id
    }
  )
  api_services = toset(["run.googleapis.com", "firestore.googleapis.com", "identitytoolkit.googleapis.com", "secretmanager.googleapis.com", "cloudscheduler.googleapis.com", "monitoring.googleapis.com", "logging.googleapis.com", "iam.googleapis.com", "cloudresourcemanager.googleapis.com"])
}

resource "google_project_service" "apis" {
  for_each           = local.api_services
  service            = each.key
  disable_on_destroy = false
}

resource "google_service_account" "web" {
  account_id = "${var.service_name}-web"
  depends_on = [google_project_service.apis]
}

resource "google_service_account" "maintenance" {
  account_id = "${var.service_name}-maintenance"
  depends_on = [google_project_service.apis]
}

resource "google_service_account" "scheduler" {
  account_id = "${var.service_name}-scheduler"
  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "database" {
  project = var.project_id

  for_each = {
    web = google_service_account.web.email, maintenance = google_service_account.maintenance.email
  }

  role   = "roles/datastore.user"
  member = "serviceAccount:${each.value}"
}

resource "google_project_iam_custom_role" "auth" {
  role_id     = "${replace(var.service_name, "-", "_")}_auth_runtime"
  title       = "Talkê runtime auth"
  permissions = ["firebaseauth.users.get", "firebaseauth.users.update"]
  depends_on  = [google_project_service.apis]
}

resource "google_project_iam_member" "auth" {
  project = var.project_id

  role   = google_project_iam_custom_role.auth.name
  member = "serviceAccount:${google_service_account.web.email}"
}

resource "google_secret_manager_secret_iam_member" "web" {
  for_each  = var.secret_versions
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.web.email}"
}

resource "google_secret_manager_secret_iam_member" "maintenance" {
  for_each  = var.secret_versions
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.maintenance.email}"
}

resource "google_cloud_run_v2_service" "web" {
  name                = var.service_name
  location            = var.region
  deletion_protection = true
  ingress             = "INGRESS_TRAFFIC_ALL"
  template {
    service_account                  = google_service_account.web.email
    max_instance_request_concurrency = 32
    timeout                          = "60s"
    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    containers {
      image = var.image_digest
      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu = "1", memory = "512Mi"
        }

        cpu_idle = true
      }

      dynamic "env" {
        for_each = local.env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_versions
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value.secret_id
              version = env.value.version
            }
          }

        }

      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = 3000
        }

        period_seconds    = 5
        failure_threshold = 12
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 3000
        }

        period_seconds    = 30
        failure_threshold = 3
      }

    }

  }

  lifecycle {
    precondition {
      condition     = var.deployment_confirmed && lookup(local.env, "LEGAL_APPROVED", "false") == "true" && can(regex("^https://[^/]+$", lookup(local.env, "APP_ORIGIN", "")))
      error_message = "Revise plano, projeto, origem HTTPS e aprovação jurídica antes de confirmar a implantação."
    }

    precondition {
      condition     = lookup(local.env, "PAYMENTS_ENABLED", "false") != "true" || alltrue([for key in ["MP_CLIENT_SECRET", "MP_WEBHOOK_SECRET", "TOKEN_ENCRYPTION_KEY"] : contains(keys(var.secret_versions), key)])
      error_message = "Pagamentos habilitados exigem referências dos três segredos Mercado Pago."
    }

  }

  depends_on = [google_project_service.apis, google_project_iam_member.database, google_project_iam_member.auth, google_secret_manager_secret_iam_member.web]
}

resource "google_cloud_run_v2_service_iam_member" "public_site" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_job" "maintenance" {
  name                = "${var.service_name}-maintenance"
  location            = var.region
  deletion_protection = true
  template {
    task_count  = 1
    parallelism = 1
    template {
      service_account = google_service_account.maintenance.email
      max_retries     = 0
      timeout         = "1800s"
      containers {
        image   = var.image_digest
        command = ["node"]
        args    = ["dist/scripts/reconcile.js"]
        resources {
          limits = {
            cpu = "1", memory = "512Mi"
          }
        }

        dynamic "env" {
          for_each = local.env
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = var.secret_versions
          content {
            name = env.key
            value_source {
              secret_key_ref {
                secret  = env.value.secret_id
                version = env.value.version
              }
            }
          }

        }

      }

    }

  }

  depends_on = [google_project_service.apis, google_project_iam_member.database, google_secret_manager_secret_iam_member.maintenance]
}

resource "google_cloud_run_v2_job_iam_member" "scheduler" {
  name     = google_cloud_run_v2_job.maintenance.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

resource "google_cloud_scheduler_job" "maintenance" {
  name             = "${var.service_name}-maintenance"
  region           = var.region
  schedule         = "*/5 * * * *"
  time_zone        = "America/Sao_Paulo"
  attempt_deadline = "60s"
  retry_config {
    retry_count = 0
  }

  http_target {
    http_method = "POST"
    uri         = "https://run.googleapis.com/v2/projects/${var.project_id}/locations/${var.region}/jobs/${google_cloud_run_v2_job.maintenance.name}:run"
    body        = base64encode("{}")
    headers = {
      "Content-Type" = "application/json"
    }

    oauth_token {
      service_account_email = google_service_account.scheduler.email
    }

  }

  depends_on = [google_cloud_run_v2_job_iam_member.scheduler]
}

resource "google_firestore_backup_schedule" "daily" {
  project   = var.project_id
  database  = var.database_id
  retention = "${var.backup_retention_days * 86400}s"
  daily_recurrence {
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.apis]
}

resource "google_monitoring_notification_channel" "operations" {
  display_name = "Talkê operação"
  type         = "email"
  depends_on   = [google_project_service.apis]
  labels = {
    email_address = var.alert_email
  }

}

resource "google_monitoring_uptime_check_config" "ready" {
  display_name = "Talkê banco e servidor"
  timeout      = "10s"
  period       = "60s"
  http_check {
    path         = "/api/ready"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id, host = trimprefix(google_cloud_run_v2_service.web.uri, "https://")
    }

  }

}

resource "google_monitoring_alert_policy" "ready" {
  display_name          = "Talkê indisponibilidade"
  combiner              = "OR"
  notification_channels = [google_monitoring_notification_channel.operations.name]
  conditions {
    display_name = "Falhas por cinco minutos"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${google_monitoring_uptime_check_config.ready.uptime_check_id}\""
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_FRACTION_TRUE"
      }

    }

  }

}

resource "google_monitoring_alert_policy" "maintenance" {
  display_name          = "Talkê falha financeira ou sala pendente"
  combiner              = "OR"
  notification_channels = [google_monitoring_notification_channel.operations.name]
  conditions {
    display_name = "Falha no job de manutenção"
    condition_matched_log {
      filter = "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"${google_cloud_run_v2_job.maintenance.name}\" AND (jsonPayload.event=\"maintenance_failed\" OR jsonPayload.event=\"reconciliation_failed\" OR jsonPayload.event=\"room_closure_failed\" OR severity>=ERROR)"
    }

  }

  alert_strategy {
    notification_rate_limit {
      period = "300s"
    }

    auto_close = "1800s"
  }

}

