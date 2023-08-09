using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Commerce.Cms.Web.Api.Storefront;
using Umbraco.Commerce.Extensions;
using Umbraco.VercelCommerce.Demo.EventHandlers;

namespace Umbraco.VercelCommerce.Demo
{
    public static class UmbracoBuilderExtensions
    {
        public static IUmbracoBuilder AddVercelCommerceDemo(this IUmbracoBuilder builder)
        {
            builder.AddNotificationAsyncHandler<ContentPublishedNotification, RevalidateOnPublishNotificationHandler>();

            builder.AddUmbracoCommerce(builder =>
            {
                builder.AddSQLite();
                builder.AddStorefrontApi();
                builder.AddVercelCommerce();
            });

            return builder;
        }
    }
}
