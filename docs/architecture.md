# Architecture

The browser bootstraps a public runtime from the single configured `storeId`, then calls the public catalog, cart, checkout-preparation, selection, and non-hosted order contracts with the returned publishable key. The cart token remains in session storage. Order placement is enabled only when the selected server option explicitly reports `requiresHostedCheckout: false` and `canPlaceOrder: true`; one browser-generated intent key is retained across uncertain retries. Hosted payment and payment collection are outside this starter.
