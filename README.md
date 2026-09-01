# 1Ecomm React Storefront Starter

Vite + React reference storefront for catalog, token-owned carts and checkout preparation, with Tailwind CSS, deterministic synthetic fixtures, and real Playwright browser tests. Checkout preparation never places an order or collects payment.

Set `storeId` in `public/headless-config.json`, then run `npm install && npm run check`. No source edit or publishable-key lookup is required: the app resolves the store's public runtime document and runs catalog, anonymous cart and checkout preparation. `bootstrapUrl` normally remains `https://api.1ecomm.com`.

See [architecture](docs/architecture.md) and [sandbox policy](docs/sandbox.md).
