resource_group_name  = "rg-#{environment}#-global-demos-vercelcommerce"
storage_account_name = "tf#{environment}#globaldemosvercelcommerce"
container_name       = "terraform-context-#{environment}#-global-demos-vercelcommerce"
key                  = "azure/terraform-demos-vercelcommerce.tfstate"
access_key           = "#{terraform_access_key}#"