# Umbraco Vercel Commerce Demo - Frontend

This branch represents the frontend of the Umbraco Vercel Commerce Demo and consists of the [Vercel Commerce](https://github.com/vercel/commerce) application fully configured with common features, including:

- Next.js App Router
- Optimized for SEO using Next.js's Metadata
- React Server Components (RSCs) and Suspense
- Server Actions for mutations
- Edge Runtime
- New fetching and caching paradigms
- Dynamic OG images
- Styling with Tailwind CSS
- Checkout and payments with Umbraco Commerce
- Automatic light/dark mode based on system settings

## Configuration

Clone or download this branch locally 

````
git clone --branch frontend/main https://github.com/umbraco/Umbraco.VercelCommerce.Demo.git frontend
````

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js Commerce. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control your store.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

## Running locally

```bash
pnpm install
pnpm dev
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

## Deploying

This project is designed to be deployed to [Vercel](https://vercel.com). Checkout the [Deploying to Vercel docs](https://vercel.com/docs/concepts/deployments/overview) for full details on how to do this.

## License

Copyright © 2023 Umbraco A/S & Vercel, Inc.

This demo store is [licensed under MIT](LICENSE.md). The core Umbraco products are licensed under Umbraco's commercial license.