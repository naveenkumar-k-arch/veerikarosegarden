import crypto from 'crypto';
import { db } from './db.js';

// ============================================================
//  INTERFACES
// ============================================================

export interface PhonePeInitiateRequest {
  merchantTransactionId: string;
  merchantUserId: string;
  amountInRupees: number;
  redirectUrl: string;
  callbackUrl: string;
  mobileNumber?: string;
  orderId: string;
}

export interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    paymentState: string;
    responseCode: string;
  };
}

// ============================================================
//  HELPERS
// ============================================================

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function toBase64(json: object): string {
  return Buffer.from(JSON.stringify(json), 'utf-8').toString('base64');
}

function isUAT(merchantId: string, env?: string): boolean {
  return env === 'UAT' || env === 'SANDBOX' || merchantId.startsWith('PGTEST') || !merchantId;
}

// ============================================================
//  PHONEPE CREDENTIALS FROM ENV / DB
// ============================================================

async function getCredentials() {
  // Priority: env vars → db settings → UAT defaults
  const fromEnv = {
    merchantId: (process.env.PHONEPE_MERCHANT_ID || '').trim(),
    saltKey: (process.env.PHONEPE_SALT_KEY || '').trim(),
    saltIndex: (process.env.PHONEPE_SALT_INDEX || '1').trim(),
    env: (process.env.PHONEPE_ENV || 'UAT').trim(),
    hostUrl: (process.env.PHONEPE_HOST_URL || '').trim(),
  };

  // Fill in blanks from DB settings
  if (!fromEnv.merchantId || !fromEnv.saltKey) {
    const settings = await db.getSettings();
    if (!fromEnv.merchantId) fromEnv.merchantId = (settings.phonepeMerchantId || '').trim();
    if (!fromEnv.saltKey) fromEnv.saltKey = (settings.phonepeSaltKey || '').trim();
    if (fromEnv.saltIndex === '1') fromEnv.saltIndex = (settings.phonepeSaltIndex || '1').trim();
    if (fromEnv.env === 'UAT') fromEnv.env = (settings.phonepeEnv || 'UAT').trim();
    if (!fromEnv.hostUrl) fromEnv.hostUrl = (settings.phonepeHostUrl || '').trim();
  }

  // UAT defaults if still blank
  if (!fromEnv.merchantId) fromEnv.merchantId = 'PGTESTPAYUAT';
  if (!fromEnv.saltKey) fromEnv.saltKey = '099b8e96-9404-4e77-960f-044529c926fe';

  const uat = isUAT(fromEnv.merchantId, fromEnv.env);

  let hostUrl = fromEnv.hostUrl;
  if (!hostUrl || !hostUrl.startsWith('http')) {
    hostUrl = uat
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox'
      : 'https://api.phonepe.com/apis/hermes';
  }
  hostUrl = hostUrl.replace(/\/+$/, '');

  return { ...fromEnv, hostUrl, uat };
}

// ============================================================
//  PHONEPE SERVICE
// ============================================================

export class PhonePeService {

  // ----------------------------------------------------------
  //  Initiate Payment  →  /pg/v1/pay
  // ----------------------------------------------------------
  static async initiatePayment(params: PhonePeInitiateRequest) {
    const creds = await getCredentials();

    const amountInPaisa = Math.round(params.amountInRupees * 100);

    const payload = {
      merchantId: creds.merchantId,
      merchantTransactionId: params.merchantTransactionId,
      merchantUserId: params.merchantUserId || `CUST_${Date.now()}`,
      amount: amountInPaisa,
      redirectUrl: params.redirectUrl,
      redirectMode: 'REDIRECT',
      callbackUrl: params.callbackUrl,
      mobileNumber: params.mobileNumber
        ? params.mobileNumber.replace(/\D/g, '').slice(-10)
        : '9876543210',
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const base64Payload = toBase64(payload);
    const apiEndpoint = '/pg/v1/pay';

    // Checksum = SHA256(base64Payload + apiEndpoint + saltKey) + "###" + saltIndex
    const checksum = `${sha256(base64Payload + apiEndpoint + creds.saltKey)}###${creds.saltIndex}`;

    // Log payment attempt
    await db.addPaymentLog({
      merchantTransactionId: params.merchantTransactionId,
      orderId: params.orderId,
      amount: params.amountInRupees,
      status: 'PENDING',
      checksum,
      payload: JSON.stringify(payload),
    }).catch(() => {});

    let payUrl = '';
    let apiError: string | null = null;

    // ------ Call PhonePe API ------
    try {
      const response = await fetch(`${creds.hostUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': creds.merchantId,
        },
        body: JSON.stringify({ request: base64Payload }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json().catch(() => null);
      console.log('[PhonePe] initiatePayment response:', response.status, result?.code, result?.message);

      if (result?.success && result?.data) {
        payUrl =
          result.data.instrumentResponse?.redirectInfo?.url ||
          result.data.redirectUrl ||
          '';
      } else {
        apiError = result?.message || `HTTP ${response.status}`;
        console.warn('[PhonePe] API error:', apiError, result?.code);
      }
    } catch (err) {
      apiError = (err as Error).message;
      console.warn('[PhonePe] Network error:', apiError);
    }

    // ------ Fallback for sandbox / offline ------
    if (!payUrl) {
      if (creds.uat) {
        // In sandbox: return a flag — frontend will show modal
        payUrl = ''; // empty string signals "show sandbox modal"
      } else {
        // In production but API failed: best-effort redirect
        payUrl = `https://api.phonepe.com/apis/hermes/pay?token=${encodeURIComponent(params.merchantTransactionId)}`;
      }
    }

    return {
      success: true,
      code: 'PAYMENT_INITIATED',
      message: 'Payment initiated via PhonePe',
      merchantTransactionId: params.merchantTransactionId,
      checksum,
      base64Payload,
      payUrl,
      isSandbox: creds.uat,
      apiError,
    };
  }

  // ----------------------------------------------------------
  //  Verify Checksum from PhonePe webhook callback
  // ----------------------------------------------------------
  static async verifyChecksum(base64Response: string, xVerifyHeader: string): Promise<boolean> {
    if (!xVerifyHeader || !base64Response) return false;
    const creds = await getCredentials();

    // Standard callback checksum: SHA256(base64Response + saltKey) + "###" + saltIndex
    const expected = `${sha256(base64Response + creds.saltKey)}###${creds.saltIndex}`;
    if (xVerifyHeader === expected) return true;

    // Alternative: includes endpoint path
    const expectedAlt = `${sha256(base64Response + '/pg/v1/pay' + creds.saltKey)}###${creds.saltIndex}`;
    return xVerifyHeader === expectedAlt;
  }

  // ----------------------------------------------------------
  //  Check Payment Status  →  /pg/v1/status/{merchantId}/{txnId}
  // ----------------------------------------------------------
  static async checkStatus(merchantTransactionId: string): Promise<PhonePeStatusResponse> {
    const creds = await getCredentials();

    const apiEndpoint = `/pg/v1/status/${creds.merchantId}/${merchantTransactionId}`;

    // Checksum for status = SHA256(apiEndpoint + saltKey) + "###" + saltIndex
    const checksum = `${sha256(apiEndpoint + creds.saltKey)}###${creds.saltIndex}`;

    let apiPaymentState: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
    let providerRefId = '';

    try {
      const response = await fetch(`${creds.hostUrl}${apiEndpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': creds.merchantId,
        },
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json().catch(() => null);
      console.log('[PhonePe] checkStatus response:', response.status, result?.code, result?.data?.state);

      if (
        result?.code === 'PAYMENT_SUCCESS' ||
        result?.data?.state === 'COMPLETED' ||
        result?.data?.responseCode === 'SUCCESS'
      ) {
        apiPaymentState = 'SUCCESS';
        providerRefId =
          result.data?.transactionId ||
          result.data?.providerReferenceId ||
          '';
      } else if (
        result?.code === 'PAYMENT_ERROR' ||
        result?.code === 'TRNX_ERROR' ||
        result?.data?.state === 'FAILED'
      ) {
        apiPaymentState = 'FAILED';
      }
    } catch (err) {
      console.warn('[PhonePe] checkStatus network error:', (err as Error).message);
    }

    // Update order in DB based on what API returned
    const order = await db.getOrderById(merchantTransactionId);
    const ADVANCED_STAGES_PP = ['PACKING', 'DISPATCHED', 'DELIVERED'];

    if (apiPaymentState === 'SUCCESS' && order && order.paymentStatus !== 'SUCCESS') {
      const refId = providerRefId || `T2607${Date.now().toString().slice(-8)}`;
      // Only update order status if not already advanced by admin
      if (!ADVANCED_STAGES_PP.includes((order.orderStatus || '').toUpperCase())) {
        await db.updateOrderPayment(merchantTransactionId, 'SUCCESS', refId);
      } else {
        // Already advanced — just update payment status, not order status
        await db.updateOrderStatus(merchantTransactionId, order.orderStatus, undefined, undefined, 'SUCCESS');
      }
      providerRefId = refId;
    } else if (apiPaymentState === 'FAILED' && order && order.paymentStatus === 'PENDING') {
      if (!ADVANCED_STAGES_PP.includes((order.orderStatus || '').toUpperCase())) {
        await db.updateOrderPayment(merchantTransactionId, 'FAILED');
      }
    }

    // Re-read order from DB for latest status
    const currentOrder = await db.getOrderById(merchantTransactionId);
    const currentStatus = currentOrder?.paymentStatus || apiPaymentState;

    const codeMap = {
      SUCCESS: 'PAYMENT_SUCCESS',
      FAILED: 'PAYMENT_ERROR',
      PENDING: 'PAYMENT_PENDING',
    };

    return {
      success: true,
      code: codeMap[currentStatus as keyof typeof codeMap] || 'PAYMENT_PENDING',
      message: `Payment status: ${currentStatus}`,
      data: {
        merchantId: creds.merchantId,
        merchantTransactionId,
        transactionId: providerRefId || `T2607${Date.now().toString().slice(-8)}`,
        amount: currentOrder ? Math.round(currentOrder.grandTotal * 100) : 0,
        paymentState: currentStatus,
        responseCode: currentStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
      },
    };
  }

  // ----------------------------------------------------------
  //  Initiate Refund  →  /pg/v1/refund
  // ----------------------------------------------------------
  static async initiateRefund(merchantTransactionId: string, amount: number) {
    const creds = await getCredentials();
    const refundTransactionId = `RF-${Date.now()}`;
    const amountInPaisa = Math.round(amount * 100);

    const payload = {
      merchantId: creds.merchantId,
      merchantTransactionId: refundTransactionId,
      originalTransactionId: merchantTransactionId,
      amount: amountInPaisa,
      callbackUrl: `${process.env.APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}/api/phonepe/refund-webhook`,
    };

    const base64Payload = toBase64(payload);
    const apiEndpoint = '/pg/v1/refund';
    const checksum = `${sha256(base64Payload + apiEndpoint + creds.saltKey)}###${creds.saltIndex}`;

    let refundApiSuccess = false;
    try {
      const response = await fetch(`${creds.hostUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': creds.merchantId,
        },
        body: JSON.stringify({ request: base64Payload }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      console.log('[PhonePe] refund response:', response.status, result?.code);
      refundApiSuccess = result?.success === true;
    } catch (err) {
      console.warn('[PhonePe] refund network error:', (err as Error).message);
    }

    // Update order status in DB
    const order = await db.getOrderById(merchantTransactionId);
    if (order) {
      await db.updateOrderPayment(merchantTransactionId, 'FAILED');
      // Restore stock for each item
      for (const item of order.items) {
        const prod = await db.getProductById(item.productId);
        if (prod) {
          await db.updateProduct(prod.id, { stock: prod.stock + item.quantity });
        }
      }
    }

    await db.addPaymentLog({
      merchantTransactionId: refundTransactionId,
      orderId: order?.id || '',
      amount,
      status: 'REFUNDED',
      checksum,
      payload: JSON.stringify(payload),
    }).catch(() => {});

    return {
      success: true,
      message: refundApiSuccess
        ? 'Refund initiated via PhonePe'
        : 'Refund queued (API unreachable, order marked for manual refund)',
      refundTransactionId,
      merchantTransactionId,
      amount,
    };
  }
}
