variable "project_id" {
  type = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id)) && !startswith(var.project_id, "demo-")
    error_message = "Informe o identificador de um projeto real, sem prefixo demo-."
  }
}

variable "region" {
  type    = string
  default = "southamerica-east1"
}

variable "database_id" {
  type    = string
  default = "(default)"
}

variable "service_name" {
  type    = string
  default = "talke"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,17}$", var.service_name))
    error_message = "Nome de serviço inválido."
  }

}

variable "image_digest" {
  type = string
  validation {
    condition     = can(regex("@sha256:[a-f0-9]{64}$", var.image_digest))
    error_message = "Use a imagem imutável pelo digest, após os testes do container."
  }

}

variable "runtime_env" {
  type = map(string)
  validation {
    condition     = length(setintersection(toset(keys(var.runtime_env)), toset(["MP_CLIENT_SECRET", "MP_WEBHOOK_SECRET", "TOKEN_ENCRYPTION_KEY", "DAILY_API_KEY", "GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST"]))) == 0
    error_message = "Segredos e emuladores não podem constar no mapa público de configuração."
  }

}

variable "secret_versions" {
  type = map(object({
    secret_id = string, version = string
    }
  ))
  description = "Referências de segredos já provisionados; nunca valores dos segredos."
  validation {
    condition     = contains(keys(var.secret_versions), "DAILY_API_KEY") && alltrue([for secret in values(var.secret_versions) : can(regex("^[1-9][0-9]*$", secret.version))])
    error_message = "Informe DAILY_API_KEY e versões numéricas imutáveis de todos os segredos."
  }

}

variable "backup_retention_days" {
  type = number
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 98 && floor(var.backup_retention_days) == var.backup_retention_days
    error_message = "Defina o prazo de backup aprovado entre 1 e 98 dias."
  }

}

variable "alert_email" {
  type = string
  validation {
    condition     = can(regex("^[^@ ]+@[^@ ]+\\.[^@ ]+$", var.alert_email))
    error_message = "Informe o contato operacional que receberá e acompanhará os alertas."
  }

}

variable "deployment_confirmed" {
  type    = bool
  default = false
}

