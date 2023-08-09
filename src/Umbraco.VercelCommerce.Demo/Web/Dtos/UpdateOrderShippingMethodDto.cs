namespace Umbraco.VercelCommerce.Demo.Web.Dtos
{
    public class UpdateOrderShippingMethodDto
    {
        public Guid ShippingMethod { get; set; }

        public Guid? NextStep { get; set; }
    }
}
