# 1Ecomm React Storefront Starter

Vite + React reference storefront for catalog, token-owned carts, checkout preparation, and idempotent non-hosted order placement, with Tailwind CSS and real Playwright browser tests. It never collects payment.

Set `storeId` in `public/headless-config.json`, then run `npm install && npm run check`. No source edit or publishable-key lookup is required: the app resolves the store's public runtime document and runs catalog, anonymous cart, checkout preparation, and a pending-order journey when the store exposes a non-hosted payment method. `bootstrapUrl` normally remains `https://api.1ecomm.com`.

See [architecture](docs/architecture.md) and [sandbox policy](docs/sandbox.md).
