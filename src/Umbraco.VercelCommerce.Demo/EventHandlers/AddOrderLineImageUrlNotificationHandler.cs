using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Commerce.Common.Events;
using Umbraco.Commerce.Core.Events.Notification;
using Umbraco.Commerce.Core.Models;
using Umbraco.Extensions;

namespace Umbraco.VercelCommerce.Demo.EventHandlers
{
    internal static class OrderLineImageUrlNotificationHandlerHelper
    {
        internal static void DoSetImageUrl(
            Order order,
            OrderLineReadOnly orderLine,
            IUmbracoContextFactory umbracoContextFactory,
            IPublishedValueFallback valueFallback,
            IPublishedUrlProvider urlProvider)
        {
            if (Guid.TryParse(orderLine.ProductReference, out var productReference)
                && !orderLine.Properties.ContainsKey("imageUrl"))
            {
                using (var ctx = umbracoContextFactory.EnsureUmbracoContext())
                {
                    if (ctx.UmbracoContext.Content != null)
                    {
                        var node = ctx.UmbracoContext.Content.GetById(productReference);
                        if (node != null)
                        {
                            var image = node.Value<IEnumerable<IPublishedContent>>(valueFallback, "images")?.FirstOrDefault();
                            if (image != null)
                            {
                                order.WithOrderLine(orderLine.Id)
                                    .SetProperty("imageUrl", image.Url(urlProvider));
                            }
                        }
                    }
                }
            }
        }
    }

    public class ChangeOrderLineImageUrlNotificationHandler : NotificationEventHandlerBase<OrderLineChangingNotification>
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IPublishedValueFallback _valueFallback;
        private readonly IPublishedUrlProvider _urlProvider;

        public ChangeOrderLineImageUrlNotificationHandler(IUmbracoContextFactory umbracoContextFactory,
            IPublishedValueFallback valueFallback,
            IPublishedUrlProvider urlProvider)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _valueFallback = valueFallback;
            _urlProvider = urlProvider;
        }

        public override void Handle(OrderLineChangingNotification evt)
        {
            OrderLineImageUrlNotificationHandlerHelper.DoSetImageUrl(evt.Order, evt.OrderLine, _umbracoContextFactory, _valueFallback, _urlProvider);
        }
    }

    public class AddOrderLineImageUrlNotificationHandler : NotificationEventHandlerBase<OrderLineAddingNotification>
    {
        private readonly IUmbracoContextFactory _umbracoContextFactory;
        private readonly IPublishedValueFallback _valueFallback;
        private readonly IPublishedUrlProvider _urlProvider;

        public AddOrderLineImageUrlNotificationHandler(IUmbracoContextFactory umbracoContextFactory,
            IPublishedValueFallback valueFallback,
            IPublishedUrlProvider urlProvider)
        {
            _umbracoContextFactory = umbracoContextFactory;
            _valueFallback = valueFallback;
            _urlProvider = urlProvider;
        }

        public override void Handle(OrderLineAddingNotification evt)
        {
            OrderLineImageUrlNotificationHandlerHelper.DoSetImageUrl(evt.Order, evt.OrderLine, _umbracoContextFactory, _valueFallback, _urlProvider);
        }
    }
}
