locals {
  name = "talke-${var.environment}"
  runtime_config = jsonencode({
    region      = var.region
    secret_arn  = aws_secretsmanager_secret.runtime.arn
    repository  = aws_ecr_repository.app.repository_url
    origin      = "https://${var.domain}"
    proxy_image = var.proxy_image
    log_group   = aws_cloudwatch_log_group.runtime.name
    environment = var.environment
  })
}
resource "aws_vpc" "app" {
  cidr_block           = "10.72.0.0/24"
  enable_dns_support   = true
  enable_dns_hostnames = true
}
resource "aws_subnet" "app" {
  vpc_id                  = aws_vpc.app.id
  cidr_block              = "10.72.0.0/26"
  availability_zone       = "${var.region}a"
  map_public_ip_on_launch = false
}
resource "aws_internet_gateway" "app" { vpc_id = aws_vpc.app.id }
resource "aws_route_table" "app" {
  vpc_id = aws_vpc.app.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.app.id
  }

}
resource "aws_route_table_association" "app" {
  subnet_id      = aws_subnet.app.id
  route_table_id = aws_route_table.app.id
}
resource "aws_security_group" "app" {
  name        = local.name
  vpc_id      = aws_vpc.app.id
  description = "HTTPS e desafio ACME; sem SSH ou porta da aplicacao."
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["10.72.0.0/24"]
  }
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["10.72.0.0/24"]
  }





}
resource "aws_ecr_repository" "app" {
  name                 = local.name
  image_tag_mutability = "IMMUTABLE"
  force_delete         = false
  encryption_configuration { encryption_type = "AES256" }
  image_scanning_configuration { scan_on_push = true }
  lifecycle { prevent_destroy = true }
}
resource "aws_secretsmanager_secret" "runtime" {
  name                    = "${local.name}/runtime"
  recovery_window_in_days = 30
  description             = "JSON runtime + credencial Firebase; valores inseridos fora do Terraform."
  lifecycle { prevent_destroy = true }
}
resource "aws_cloudwatch_log_group" "runtime" {
  name              = "/talke/${var.environment}"
  retention_in_days = 30
}
resource "aws_iam_role" "instance" {
  name = "${local.name}-runtime"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "ec2.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_role_policy" "runtime" {
  role = aws_iam_role.instance.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = aws_secretsmanager_secret.runtime.arn },
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"], Resource = aws_ecr_repository.app.arn },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.runtime.arn}:*" },
    { Effect = "Allow", Action = ["cloudwatch:PutMetricData"], Resource = "*", Condition = { StringEquals = { "cloudwatch:namespace" = "Talke" } } }
  ] })
}
resource "aws_iam_instance_profile" "app" { role = aws_iam_role.instance.name }
data "aws_ami" "official" {
  owners = ["amazon"]
  filter {
    name   = "image-id"
    values = [var.ami_id]
  }
}
resource "aws_instance" "app" {
  ami                         = var.ami_id
  instance_type               = "t3.small"
  subnet_id                   = aws_subnet.app.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.app.name
  associate_public_ip_address = false
  disable_api_termination     = true
  user_data_replace_on_change = true
  user_data = templatefile("${path.module}/bootstrap.sh.tftpl", {
    config_b64  = base64encode(local.runtime_config)
    runtime_b64 = base64gzip(file("${path.module}/runtime.py"))
  })
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }
  root_block_device {
    encrypted             = true
    volume_type           = "gp3"
    volume_size           = 20
    delete_on_termination = false
  }
  credit_specification { cpu_credits = "standard" }
  lifecycle {
    prevent_destroy = true
    precondition {
      condition     = var.deployment_confirmed && split(":", var.github_oidc_provider_arn)[4] == var.account_id
      error_message = "Aprovação do plano/custos obrigatória e OIDC deve pertencer à conta verificada."
    }
    precondition {
      condition     = data.aws_ami.official.architecture == "x86_64" && startswith(data.aws_ami.official.name, "al2023-ami-")
      error_message = "Exigir AMI Amazon Linux 2023 oficial x86_64."
    }
  }
  tags = { Name = local.name }
}
resource "aws_eip" "app" {
  domain = "vpc"
  lifecycle { prevent_destroy = true }
}
resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
resource "aws_iam_role" "deploy" {
  name                 = "${local.name}-github-deploy"
  max_session_duration = 3600
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect    = "Allow"
    Principal = { Federated = var.github_oidc_provider_arn }
    Action    = "sts:AssumeRoleWithWebIdentity"
    Condition = { StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
      "token.actions.githubusercontent.com:sub" = "repo:Carmunra/Talk--V1:ref:refs/heads/main"
    } }
  }] })
}
resource "aws_iam_role_policy" "deploy" {
  role = aws_iam_role.deploy.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:DescribeImages", "ecr:DescribeImageScanFindings"], Resource = aws_ecr_repository.app.arn },
    { Effect = "Allow", Action = ["ssm:SendCommand"], Resource = ["arn:aws:ssm:${var.region}::document/AWS-RunShellScript", aws_instance.app.arn] },
    { Effect = "Allow", Action = ["ssm:GetCommandInvocation", "ec2:DescribeInstances"], Resource = "*" }
  ] })
}
resource "aws_sns_topic" "alerts" { name = "${local.name}-alerts" }
resource "aws_sns_topic_policy" "alarms" {
  arn = aws_sns_topic.alerts.arn
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Principal = { AWS = "arn:aws:iam::${var.account_id}:root" }, Action = "SNS:*", Resource = aws_sns_topic.alerts.arn },
    { Effect = "Allow", Principal = { Service = "cloudwatch.amazonaws.com" }, Action = "sns:Publish", Resource = aws_sns_topic.alerts.arn,
    Condition = { StringEquals = { "aws:SourceAccount" = var.account_id }, ArnLike = { "aws:SourceArn" = "arn:aws:cloudwatch:${var.region}:${var.account_id}:alarm:${local.name}-*" } } }
  ] })
}
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
resource "aws_cloudwatch_metric_alarm" "health" {
  alarm_name          = "${local.name}-unhealthy"
  namespace           = "Talke"
  metric_name         = "Healthy"
  dimensions          = { Environment = var.environment }
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  evaluation_periods  = 3
  period              = 60
  statistic           = "Minimum"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}
resource "aws_cloudwatch_metric_alarm" "ec2" {
  alarm_name          = "${local.name}-instance-status"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  dimensions          = { InstanceId = aws_instance.app.id }
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  evaluation_periods  = 2
  period              = 60
  statistic           = "Maximum"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
resource "aws_budgets_budget" "monthly" {
  name         = "${local.name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  cost_types {
    include_credit = false
    include_refund = false
  }


  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
