/**
 * Cashfree Payment Gateway Integration
 * 
 * Setup:
 * 1. Install the Cashfree JS SDK:
 *    npm install @cashfreepayments/cashfree-js
 * 
 * 2. Add to your .env.local:
 *    NEXT_PUBLIC_CASHFREE_ENV=sandbox   # or "production"
 * 
 * 3. Your BACKEND must:
 *    a) Create an order via Cashfree API → returns { order_id, payment_session_id }
 *    b) Expose POST /api/payments/create-order  → { order_id, payment_session_id }
 *    c) Expose POST /api/payments/verify         → verify signature & update DB
 * 
 * Flow:
 *   Frontend calls createCashfreeOrder() → backend creates Cashfree order
 *   Frontend calls openCashfreeCheckout() → Cashfree SDK opens payment UI
 *   On success → backend webhook + frontend redirect verify payment
 */

export interface CashfreeOrderRequest {
  courseId: string
  batchId: string
  amount: number          // in INR (e.g. 4999)
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  discountCode?: string
  discountAmount?: number
  reference?: string
}

export interface CashfreeOrderResponse {
  order_id: string
  payment_session_id: string
  order_status: string
}

/**
 * Step 1: Create a Cashfree order via YOUR backend.
 * Your backend will call Cashfree's REST API and return the session id.
 */
export async function createCashfreeOrder(
  payload: CashfreeOrderRequest
): Promise<CashfreeOrderResponse> {
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create payment order')
  }

  return res.json()
}

/**
 * Step 2: Open the Cashfree checkout UI.
 * Dynamically loads the Cashfree JS SDK, then invokes the checkout.
 *
 * @param paymentSessionId  - from createCashfreeOrder()
 * @param orderId           - from createCashfreeOrder()
 * @param redirectUrl       - where to send user after payment (e.g. /checkout/success?orderId=...)
 */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  orderId: string,
  redirectUrl: string
): Promise<void> {
  // Dynamically import Cashfree SDK
  const { load } = await import('@cashfreepayments/cashfree-js')

  const cashfree = await load({
    mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV as 'sandbox' | 'production') ?? 'sandbox',
  })

  const checkoutOptions = {
    paymentSessionId,
    redirectTarget: '_self', // '_self' | '_blank' | '_top'
    returnUrl: redirectUrl + `?order_id=${orderId}`,
  }

  cashfree.checkout(checkoutOptions)
}

/**
 * Step 3: Verify the payment after redirect.
 * Call this on your success/callback page.
 *
 * @param orderId - from URL params after redirect
 */
export async function verifyCashfreePayment(orderId: string): Promise<{
  success: boolean
  order_status: string
  message: string
}> {
  const res = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId }),
  })

  if (!res.ok) {
    throw new Error('Payment verification failed')
  }

  return res.json()
}

/**
 * ─── BACKEND REFERENCE (Django / Node) ────────────────────────────────────
 *
 * DJANGO example (views.py):
 *
 * import requests, uuid
 * 
 * CASHFREE_APP_ID  = os.environ['CASHFREE_APP_ID']
 * CASHFREE_SECRET  = os.environ['CASHFREE_SECRET_KEY']
 * CASHFREE_BASE    = 'https://sandbox.cashfree.com/pg'  # prod: api.cashfree.com/pg
 * 
 * def create_order(request):
 *     data = json.loads(request.body)
 *     order_id = f"order_{uuid.uuid4().hex[:12]}"
 *
 *     resp = requests.post(
 *         f'{CASHFREE_BASE}/orders',
 *         headers={
 *             'x-api-version': '2023-08-01',
 *             'x-client-id': CASHFREE_APP_ID,
 *             'x-client-secret': CASHFREE_SECRET,
 *             'Content-Type': 'application/json',
 *         },
 *         json={
 *             'order_id': order_id,
 *             'order_amount': data['amount'],
 *             'order_currency': 'INR',
 *             'customer_details': {
 *                 'customer_id': data['userId'],
 *                 'customer_name': data['userName'],
 *                 'customer_email': data['userEmail'],
 *                 'customer_phone': data.get('userPhone', '9999999999'),
 *             },
 *             'order_meta': {
 *                 'return_url': f"{settings.FRONTEND_URL}/checkout/success?order_id={{order_id}}",
 *             },
 *         }
 *     )
 *     cf_data = resp.json()
 *     # Save order to DB here
 *     return JsonResponse({
 *         'order_id': cf_data['order_id'],
 *         'payment_session_id': cf_data['payment_session_id'],
 *         'order_status': cf_data['order_status'],
 *     })
 *
 *
 * NODE/EXPRESS example:
 *
 * const { Cashfree } = require('cashfree-pg');
 * Cashfree.XClientId = process.env.CASHFREE_APP_ID;
 * Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
 * Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; // or PRODUCTION
 *
 * app.post('/api/payments/create-order', async (req, res) => {
 *   const { amount, userId, userName, userEmail } = req.body;
 *   const orderId = `order_${Date.now()}`;
 *   const { data } = await Cashfree.PGCreateOrder('2023-08-01', {
 *     order_id: orderId,
 *     order_amount: amount,
 *     order_currency: 'INR',
 *     customer_details: {
 *       customer_id: userId,
 *       customer_name: userName,
 *       customer_email: userEmail,
 *       customer_phone: '9999999999',
 *     },
 *   });
 *   res.json(data);
 * });
 */
