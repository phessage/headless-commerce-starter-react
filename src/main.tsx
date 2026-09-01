import React, { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Product = {
  id: string;
  name: string;
  description: string;
  available: boolean;
  price: { amount: string; currency: string };
};
type Cart = { items: Array<{ id: string; quantity: number }> };
type Checkout = {
  shippingOptions: Array<{
    id: string;
    name: string;
    amount: string;
    currency: string;
  }>;
  paymentMethods: Array<{
    id: string;
    name: string;
    capabilities?: {
      requiresHostedCheckout?: boolean;
      canPlaceOrder?: boolean;
    };
  }>;
  selectedShippingMethodId: string | null;
  selectedPaymentMethodId: string | null;
  ready: boolean;
  missing: string[];
};
type Runtime = { storeId: string; apiUrl: string; publishableKey: string };
type Order = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  requiresPayment: false;
};
const apiHeaders = (runtime: Runtime, token?: string, json = false) => ({
  "x-publishable-key": runtime.publishableKey,
  ...(token ? { "x-cart-token": token } : {}),
  ...(json ? { "content-type": "application/json" } : {}),
});

function App() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [token, setToken] = useState(
    () => sessionStorage.getItem("headless-cart-token") ?? "",
  );
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderIntent, setOrderIntent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/headless-config.json", { cache: "no-store" })
      .then((r) => r.json())
      .then(async (config: { storeId: string; bootstrapUrl?: string }) => {
        const bootstrapUrl = (config.bootstrapUrl ?? "https://api.1ecomm.com").replace(/\/$/, "");
        const response = await fetch(`${bootstrapUrl}/v1/headless/stores/${encodeURIComponent(config.storeId)}/config`);
        if (!response.ok) throw new Error("Store is not configured for headless commerce");
        const value = (await response.json()).data as Runtime;
        if (value.storeId !== config.storeId || !value.publishableKey.startsWith("pk_")) throw new Error("Invalid store bootstrap response");
        setRuntime(value);
        return value;
      })
      .then((value) => fetch(`${value.apiUrl}/v1/headless/products`, { headers: apiHeaders(value) }))
      .then((r) => {
        if (!r.ok) throw new Error("Catalog unavailable");
        return r.json();
      })
      .then((v) => setProducts(v.data))
      .catch((e) => setError(e.message));
  }, []);
  async function cartToken() {
    if (!runtime) throw new Error("Store configuration is not ready");
    if (token) return token;
    const response = await fetch(`${runtime.apiUrl}/v1/headless/carts`, {
      method: "POST",
      headers: apiHeaders(runtime),
    });
    if (!response.ok) throw new Error("Cart unavailable");
    const value = await response.json();
    setToken(value.cartToken);
    sessionStorage.setItem("headless-cart-token", value.cartToken);
    return value.cartToken as string;
  }
  async function add(product: Product) {
    if (!runtime) return setError("Store configuration is not ready");
    setBusy(true);
    setError("");
    try {
      const current = await cartToken();
      const response = await fetch(`${runtime.apiUrl}/v1/headless/carts/current/items`, {
        method: "POST",
        headers: apiHeaders(runtime, current, true),
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (!response.ok) throw new Error("Item could not be added");
      setCart((await response.json()).data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!runtime) return setError("Store configuration is not ready");
    setBusy(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      const current = await cartToken();
      const address = {
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        email: String(data.get("email")),
        address1: String(data.get("address1")),
        city: String(data.get("city")),
        state: String(data.get("state")),
        postalCode: String(data.get("postalCode")),
        country: String(data.get("country")),
      };
      const response = await fetch(
        `${runtime.apiUrl}/v1/headless/carts/current/checkout`,
        {
          method: "PATCH",
          headers: apiHeaders(runtime, current, true),
          body: JSON.stringify({
            customerInfo: {
              firstName: address.firstName,
              lastName: address.lastName,
              email: address.email,
            },
            billingAddress: address,
            shippingAddress: { sameAsBilling: true },
          }),
        },
      );
      if (!response.ok) throw new Error("Checkout preparation failed");
      setCheckout((await response.json()).data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function select(
    kind: "shipping-method" | "payment-method",
    id: string,
  ) {
    if (!runtime) return setError("Store configuration is not ready");
    const response = await fetch(
      `${runtime.apiUrl}/v1/headless/carts/current/checkout/${kind}`,
      {
        method: "PUT",
        headers: apiHeaders(runtime, token, true),
        body: JSON.stringify({ id }),
      },
    );
    if (!response.ok) {
      setError("Selection failed");
      return;
    }
    setCheckout((await response.json()).data);
  }
  async function placeOrder() {
    if (!runtime || !checkout?.ready) return setError("Checkout is not ready");
    const selected = checkout.paymentMethods.find(
      (method) => method.id === checkout.selectedPaymentMethodId,
    );
    if (
      selected?.capabilities?.requiresHostedCheckout !== false ||
      selected.capabilities.canPlaceOrder !== true
    ) return setError("Choose a supported non-hosted payment method");
    setBusy(true);
    setError("");
    const intent = orderIntent || crypto.randomUUID();
    setOrderIntent(intent);
    try {
      const response = await fetch(
        `${runtime.apiUrl}/v1/headless/carts/current/checkout/order`,
        {
          method: "POST",
          headers: {
            ...apiHeaders(runtime, token),
            "Idempotency-Key": intent,
          },
        },
      );
      if (!response.ok) {
        const problem = await response.json().catch(() => null) as
          | { detail?: string; title?: string }
          | null;
        throw new Error(
          problem?.detail ?? problem?.title ?? `Order placement failed (${response.status})`,
        );
      }
      setOrder((await response.json()).data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header>
        <b>TRAIL/REACT</b>
        <span aria-live="polite">Cart {cart.items.length}</span>
      </header>
      <main>
        <section>
          <p className="eyebrow">HEADLESS BY DESIGN</p>
          <h1>
            Pack smart.
            <br />
            Move freely.
          </h1>
        </section>
        {error && <p role="alert">{error}</p>}
        <div className="grid" aria-label="Products">
          {products.map((p) => (
            <article key={p.id}>
              <div className="art">◆</div>
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <strong>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: p.price.currency,
                }).format(Number(p.price.amount))}
              </strong>
              <button data-product-id={p.id} disabled={!p.available || busy} onClick={() => add(p)}>
                Add {p.name} to cart
              </button>
            </article>
          ))}
        </div>
        {cart.items.length > 0 && (
          <section className="checkout">
            <h2>Prepare checkout</h2>
            <p>
              Prepare checkout and place an order with a server-approved
              non-hosted payment method. This starter never collects payment.
            </p>
            <form onSubmit={prepare}>
              {[
                ["firstName", "First name"],
                ["lastName", "Last name"],
                ["email", "Email"],
                ["address1", "Address"],
                ["city", "City"],
                ["state", "State / province"],
                ["postalCode", "Postal code"],
                ["country", "Country code"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input
                    name={name}
                    type={name === "email" ? "email" : "text"}
                    defaultValue={name === "country" ? "CA" : ""}
                    required
                  />
                </label>
              ))}
              <button disabled={busy}>Load checkout choices</button>
            </form>
            {checkout && (
              <div aria-label="Checkout preparation">
                <h3>{checkout.ready ? "Ready for handoff" : "Still needed"}</h3>
                <p>{checkout.missing.join(", ") || "No preparation gaps"}</p>
                <label>
                  Shipping
                  <select
                    aria-label="Shipping method"
                    value={checkout.selectedShippingMethodId ?? ""}
                    onChange={(e) => select("shipping-method", e.target.value)}
                  >
                    <option value="">Choose shipping</option>
                    {checkout.shippingOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} — {option.amount} {option.currency}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Payment
                  <select
                    aria-label="Payment method"
                    value={checkout.selectedPaymentMethodId ?? ""}
                    onChange={(e) => select("payment-method", e.target.value)}
                  >
                    <option value="">Choose payment</option>
                    {checkout.paymentMethods.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!order && (
                  <button disabled={!checkout.ready || busy} onClick={placeOrder}>
                    Place pending order
                  </button>
                )}
                {order && (
                  <section aria-label="Order confirmation">
                    <h3>Order {order.orderNumber} placed</h3>
                    <p>Status: {order.status}</p>
                    <p>Payment: {order.paymentStatus}</p>
                  </section>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
