using Umbraco.Commerce.Core;
using Umbraco.Commerce.Core.Events.Notification;
using Umbraco.Commerce.Extensions;
using Umbraco.VercelCommerce.Demo.EventHandlers;

namespace Umbraco.VercelCommerce.Demo
{
    public static class UmbracoCommerceBuilderExtensions
    {
        public static IUmbracoCommerceBuilder AddVercelCommerce(this IUmbracoCommerceBuilder builder)
        {
            builder.WithNotificationEvent<OrderLineChangingNotification>()
                .RegisterHandler<ChangeOrderLineImageUrlNotificationHandler>();

            builder.WithNotificationEvent<OrderLineAddingNotification>()
                .RegisterHandler<AddOrderLineImageUrlNotificationHandler>();

            return builder;
        }
    }
}