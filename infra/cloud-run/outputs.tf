output "service_url" {
  value = google_cloud_run_v2_service.web.uri
}

output "maintenance_job" {
  value = google_cloud_run_v2_job.maintenance.name
}

output "runtime_identity" {
  value = google_service_account.web.email
}

