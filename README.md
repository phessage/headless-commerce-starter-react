# 1Ecomm React Storefront Starter

This is a ready-to-run React + Vite shop. It shows products, maintains a shopper cart, collects checkout details, displays 1Ecomm shipping/payment choices, and can create a pending non-hosted order. It never charges a card or wallet.

## Run it

1. Install Node.js 20 or newer.
2. Open `public/headless-config.json`.
3. Replace only `storeId` with your provisioned 1Ecomm store ID. The included ID is a safe test fixture.
4. Run:

```bash
npm ci
npm run check
npm run dev
```

5. Open the local address printed by Vite. You should see real products from the selected store. No API URL, publishable-key lookup, or source-code change is required.

`npm run check` performs a production build and launches the application for a browser smoke test. `npm run test:e2e:live` goes further: it creates an isolated fixture cart and pending bank-transfer test order against the deployed API. It does not move money.

The configuration contains public values only. Never add an administrator password or secret API key. For production limitations and architecture, see [architecture](docs/architecture.md) and [sandbox policy](docs/sandbox.md).
