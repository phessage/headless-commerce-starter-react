import { expect, test } from "@playwright/test";

test("prepares a real fixture cart and selects server choices", async ({
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
      response.request().method() === "POST" &&
      response.status() === 201,
  );
  await page.getByRole("button", { name: "Place pending order" }).click();
  const response = await placed;
  const body = await response.json();
  expect(body.data.requiresPayment).toBe(false);
  expect(body.data.paymentStatus).toBe("pending");
  await expect(
    page.getByRole("heading", { name: new RegExp(`Order ${body.data.orderNumber} placed`) }),
  ).toBeVisible();
});
