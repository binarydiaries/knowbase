/**
 * Standalone mock order-status API for testing the api_trigger action
 * (Actions card → API Call Action) end-to-end without a real customer backend.
 *
 * Run: bun run scripts/mock-order-api.ts
 * Then point the action's URL at: http://localhost:4100/orders/{{orderNumber}}
 *
 * Status is derived deterministically from the order number so you can
 * exercise every branch by typing different numbers:
 *   ends in 0      → not found (404)
 *   ends in 1-3    → processing
 *   ends in 4-6    → shipped
 *   ends in 7-9    → delivered
 */

const PORT = 4100;

function statusFor(orderNumber: string) {
  const lastDigit = Number(orderNumber.match(/\d/g)?.slice(-1)[0] ?? '5');
  if (lastDigit === 0) return null;
  if (lastDigit <= 3) {
    return { status: 'processing', eta: null };
  }
  if (lastDigit <= 6) {
    return { status: 'shipped', eta: '2026-06-26', carrier: 'BlueDart' };
  }
  return { status: 'delivered', eta: '2026-06-23' };
}

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const match = url.pathname.match(/^\/orders\/([\w-]+)$/);

    if (!match) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [, orderNumber] = match;
    const result = statusFor(orderNumber);

    if (!result) {
      return new Response(
        JSON.stringify({ error: `Order ${orderNumber} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return Response.json({ orderNumber, ...result });
  },
});

console.log(`Mock order API running at http://localhost:${PORT}`);
console.log(`Try: http://localhost:${PORT}/orders/ORD-1234 (shipped)`);
console.log(`     http://localhost:${PORT}/orders/ORD-1239 (delivered)`);
console.log(`     http://localhost:${PORT}/orders/ORD-1230 (not found)`);
