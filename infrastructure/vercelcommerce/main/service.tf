locals {
  bounded_context = "demos"
  service_name    = "vercelcommerce"
  common_azure_tags = {
    environment = var.environment
    region      = "global"
    source      = "Umbraco.VercelCommerce.Demo/infrastructure/vercelcommerce"
    cost_center = "Development - Integrations"
  }
}

# Resource group
data "azurerm_resource_group" "rg_vercelcommerce" {
  name = "rg-${var.environment}-global-${local.bounded_context}"
}

# App service plan
resource "azurerm_app_service_plan" "asp_vercelcommerce" {
  name                = "asp-${var.environment}-${local.bounded_context}-${local.service_name}"
  location            = data.azurerm_resource_group.rg_vercelcommerce.location
  resource_group_name = data.azurerm_resource_group.rg_vercelcommerce.name
  tags                = local.common_azure_tags
  sku {
    tier = "Standard"
    size = "S1"
  }
}

# App service - Admin Web
resource "azurerm_app_service" "azapp_adminweb_vercelcommerce" {
  name                = "azapp-${var.environment}-${local.bounded_context}-${local.service_name}-adminweb"
  location            = data.azurerm_resource_group.rg_vercelcommerce.location
  resource_group_name = data.azurerm_resource_group.rg_vercelcommerce.name
  app_service_plan_id = azurerm_app_service_plan.asp_vercelcommerce.id
  https_only          = true
  tags                = local.common_azure_tags

  site_config {
    dotnet_framework_version = "v6.0"
    always_on                = var.environment == "live" ? true : false
    http2_enabled            = true
  }
}

# Add CNAME records
resource "cloudflare_record" "adminweb_cname_vercelcommerce" {
  zone_id = var.cf_zone_id
  name    = var.environment == "live" ? "admin.vercelcommercedemo.umbraco.com" : "${var.environment}.admin.vercelcommercedemo.umbraco.com"
  value   = azurerm_app_service.azapp_adminweb_vercelcommerce.default_site_hostname
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "web_cname_vercelcommerce" {
  zone_id = var.cf_zone_id
  name    = var.environment == "live" ?  "vercelcommercedemo.umbraco.com" : "${var.environment}.vercelcommercedemo.umbraco.com"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

# TXT records for domain validation
resource "cloudflare_record" "adminweb_txt_vercelcommerce" {
  zone_id = var.cf_zone_id
  name    = var.environment == "live" ? "asuid.admin.vercelcommercedemo.umbraco.com" : "asuid.${var.environment}.admin.vercelcommercedemo.umbraco.com"
  value   = azurerm_app_service.azapp_adminweb_vercelcommerce.custom_domain_verification_id
  type    = "TXT"
  ttl     = 1
}

# Time delay between the txt records and the hostname binding
resource "time_sleep" "adminweb_txt_wait_vercelcommerce" {
  depends_on      = [cloudflare_record.adminweb_txt_vercelcommerce]
  create_duration = "60s"
}

# Hostname Binding in Azure
resource "azurerm_app_service_custom_hostname_binding" "adminweb_hostname_binding_vercelcommerce" {
  hostname            = var.environment == "live" ? "admin.vercelcommercedemo.umbraco.com" : "${var.environment}.admin.vercelcommercedemo.umbraco.com"
  app_service_name    = azurerm_app_service.azapp_adminweb_vercelcommerce.name
  resource_group_name = data.azurerm_resource_group.rg_vercelcommerce.name
  depends_on = [time_sleep.adminweb_txt_wait_vercelcommerce]
}