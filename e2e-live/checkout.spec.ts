import { expect, test } from "@playwright/test";

test("places and renders a real non-hosted order", async ({
  page,
}) => {
  const catalog = page.waitForResponse(
    (response) =>
      response.url().endsWith("/v1/headless/products") &&
      response.status() === 200,
  );
  await page.goto("/");
  await catalog;
  const add = page.locator(
    'button[data-product-id="1f7884bd-759d-4f47-9fdb-c7ea3dd3a9ef"]',
  );
  const added = page.waitForResponse(
    (response) =>
      response.url().endsWith("/v1/headless/carts/current/items") &&
      response.status() === 201,
  );
  await add.click();
  await added;
  await expect(page.getByText("Cart 1")).toBeVisible();
  await page.getByLabel("First name").fill("Headless");
  await page.getByLabel("Last name").fill("Fixture");
  await page.getByLabel("Email").fill("react-live@example.test");
  await page.getByLabel("Address").fill("1 Test Way");
  await page.getByLabel("City").fill("Vancouver");
  await page.getByLabel("State / province").fill("BC");
  await page.getByLabel("Postal code").fill("V6B1A1");
  const prepared = page.waitForResponse(
    (response) =>
      response.url().endsWith("/v1/headless/carts/current/checkout") &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await page.getByRole("button", { name: "Load checkout choices" }).click();
  await prepared;
  const shipping = page.getByLabel("Shipping method");
  const payment = page.getByLabel("Payment method");
  await expect(shipping.locator("option")).toHaveCount(3);
  await expect(payment.locator("option")).toHaveCount(2);
  const shippingSelected = page.waitForResponse(
    (response) =>
      response.url().endsWith("/checkout/shipping-method") &&
      response.status() === 200,
  );
  await shipping.selectOption({ index: 1 });
  await shippingSelected;
  const paymentSelected = page.waitForResponse(
    (response) =>
      response.url().endsWith("/checkout/payment-method") &&
      response.status() === 200,
  );
  await payment.selectOption({ index: 1 });
  await paymentSelected;
  await expect(page.getByText("No preparation gaps")).toBeVisible();
  const placed = page.waitForResponse(
    (response) =>
      response.url().endsWith("/checkout/order") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Place pending order" }).click();
  const response = await placed;
  const body = await response.json();
  expect(response.status(), JSON.stringify(body)).toBe(201);
  expect(body.data.requiresPayment).toBe(false);
  expect(body.data.paymentStatus).toBe("pending");
  console.log(`React live order: ${body.data.orderNumber}`);
  await expect(
    page.getByRole("heading", { name: new RegExp(`Order ${body.data.orderNumber} placed`) }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Order number").fill(body.data.orderNumber);
  await page.getByLabel("Order email").fill("react-live@example.test");
  const lookedUp = page.waitForResponse(
    (lookupResponse) =>
      lookupResponse.url().endsWith("/v1/headless/orders/lookup") &&
      lookupResponse.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Check order status" }).click();
  const lookupResponse = await lookedUp;
  const lookupBody = await lookupResponse.json();
  expect(lookupResponse.status(), JSON.stringify(lookupBody)).toBe(201);
  expect(lookupBody.data.orderNumber).toBe(body.data.orderNumber);
  await expect(page.getByRole("heading", { name: `Order ${body.data.orderNumber}` })).toBeVisible();
});
