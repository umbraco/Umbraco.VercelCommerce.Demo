using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Web;
using Umbraco.Cms.Web.Common.Controllers;
using Umbraco.Commerce.Core.Api;
using Umbraco.Extensions;

namespace Umbraco.VercelCommerce.Demo.Web.Controllers
{
    // This controller takes the Guid ID passed from Vercel Commerce and loads that order into the .NET session
    // I wouldn't really recommend this for product as it is because we don't want to allow just any old
    // random Guid to be loaded into session. If we had full control over the front end markup, I'd probably send
    // some extra validation token we can use to ensure the order loading into session, is the one we expect.
    public class CheckoutPageController : RenderController
    {
        private IUmbracoCommerceApi _commerceApi;

        public CheckoutPageController(ILogger<RenderController> logger, ICompositeViewEngine compositeViewEngine, IUmbracoContextAccessor umbracoContextAccessor,
            IUmbracoCommerceApi commerceApi) 
            : base(logger, compositeViewEngine, umbracoContextAccessor)
        {
            _commerceApi = commerceApi;
        }

        public override IActionResult Index()
        {
            if (Guid.TryParse(Request.Query["id"], out Guid orderId))
            {
                var order = _commerceApi.GetOrder(orderId);
                if (order != null && !order.IsFinalized)
                {
                    _commerceApi.SetCurrentOrder(order.StoreId, order.Id);

                    var firstChild = CurrentPage?.Children.FirstOrDefault();
                    if (firstChild != null)
                    {
                        return Redirect(firstChild.Url());
                    }
                }
            }

            return BadRequest();
        }
    }
}
