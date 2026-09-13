# AI engineering guide

Read this file, `README.md`, `docs/architecture.md`, `docs/sandbox.md`, `src/main.tsx`, and both Playwright suites before editing.

## Product boundary

This React 19 + Vite 8 + Tailwind CSS 4 project is a runnable reference for the 1Ecomm headless preview, not a complete production store. `public/headless-config.json` contains one `storeId`; runtime bootstrap discovers publishable connection values and fails closed. Never add synthetic fallback commerce data or embed an administrative secret.

The canonical API is `https://www.1ecomm.com/headless-commerce/openapi.yaml`. Preserve key-derived tenant scope, bearer cart-token secrecy, server-computed totals/options, capability-gated non-hosted orders, stable idempotency keys, and neutral guest lookup. Do not invent response fields; order line count is `items.length`.

## React/Vite/Tailwind rules

- Use functional components, hooks and explicit TypeScript types. Keep effects cancellable and dependency lists correct.
- Separate network/runtime state, shopper form state and rendered derived state. Do not duplicate server totals or eligibility rules.
- Treat async states explicitly: loading, empty, error, success and uncertain mutation result.
- Use semantic HTML, associated labels, keyboard focus, live error announcements and visible focus. Preserve responsive and reduced-motion behavior.
- Tailwind is an implementation tool, not a substitute for reusable semantic components. Keep global tokens in the existing stylesheet.
- Vite 8 requires Node 20.19+ or a supported newer line. Stable dependency upgrades must update the lockfile.

## License boundary

`LICENSE.md` allows authorized 1Ecomm customer projects and deployed shopper applications, but prohibits redistribution of this reusable starter or its derivatives. Preserve the notice in clones, generated projects and documentation. Do not describe this repository as open source or grant broader rights in examples.

## Security and completion

The current browser token storage is reference-only. Production work should prefer a BFF/HttpOnly session or document the XSS threat. Never log tokens, order proof or addresses. Allow only HTTPS production API origins.

Run `rm -rf node_modules && npm ci`, `npm run check`, and the sandbox `npm run test:e2e:live` when authorized. Playwright must assert requests and rendered business results, including line count and persistence—not just page visibility. Missing CI prerequisites must fail, not skip.
