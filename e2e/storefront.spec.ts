import { expect, test } from '@playwright/test';

test('bootstraps one store ID and updates the real UI', async ({ page }) => {
  await page.route('https://api.1ecomm.com/v1/headless/stores/**', (route) => route.fulfill({ json: { data: { storeId: '01f5b02f-d7c0-42cd-b880-59f78ea70aa3', apiUrl: 'https://sandbox.test', publishableKey: 'pk_test_demo', apiVersion: 'v1', capabilities: ['catalog', 'cart', 'checkout-preparation'] } } }));
  await page.route('https://sandbox.test/v1/headless/products', (route) => route.fulfill({ json: { data: [{ id: 'p1', name: 'Camp Lamp', description: 'Light', available: true, price: { amount: '20', currency: 'USD' } }], nextCursor: null, requestId: 'r' } }));
  await page.route('https://sandbox.test/v1/headless/carts', (route) => route.fulfill({ status: 201, json: { data: { items: [] }, cartToken: `hc_${'a'.repeat(43)}`, created: true, requestId: 'r' } }));
  await page.route('https://sandbox.test/v1/headless/carts/current/items', (route) => route.fulfill({ status: 201, json: { data: { items: [{ id: 'line', quantity: 1 }] }, requestId: 'r' } }));
  await page.route('https://sandbox.test/v1/headless/orders/lookup', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ orderNumber: 'ORD123', email: 'buyer@example.test' });
    await route.fulfill({ status: 201, json: { data: { orderNumber: 'ORD123', status: 'pending', paymentStatus: 'pending', items: [], tracking: null }, requestId: 'r' } });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Camp Lamp' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Camp Lamp to cart' }).click();
  await expect(page.getByText('Cart 1')).toBeVisible();
  await page.getByLabel('Order number').fill('ORD123');
  await page.getByLabel('Order email').fill('buyer@example.test');
  await page.getByRole('button', { name: 'Check order status' }).click();
  await expect(page.getByRole('heading', { name: 'Order ORD123' })).toBeVisible();
  await expect(page.getByText('Tracking is not available yet')).toBeVisible();
});
