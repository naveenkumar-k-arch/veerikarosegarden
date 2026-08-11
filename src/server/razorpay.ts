import crypto from 'crypto';

export interface RazorpayOrderParams {
  amount: number; // in Rupees
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  /**
   * Create Razorpay Order via REST API
   */
  static async createOrder(
    params: RazorpayOrderParams,
    keyId: string,
    keySecret: string
  ): Promise<{ success: boolean; razorpayOrderId?: string; message?: string; raw?: any }> {
    try {
      if (!keyId || !keySecret) {
        return { success: false, message: 'Razorpay API Key ID or Secret is missing in site settings.' };
      }

      // Amount in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(params.amount * 100);
      const authHeader = 'Basic ' + Buffer.from(`${keyId.trim()}:${keySecret.trim()}`).toString('base64');

      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: params.currency || 'INR',
          receipt: params.receipt,
          notes: params.notes || {}
        })
      });

      const data = await response.json();

      if (!response.ok || !data.id) {
        console.error('[RazorpayService] Failed to create order:', data);
        return {
          success: false,
          message: data.error?.description || 'Failed to create Razorpay Order'
        };
      }

      return {
        success: true,
        razorpayOrderId: data.id,
        raw: data
      };
    } catch (err: any) {
      console.error('[RazorpayService] Order Creation Exception:', err);
      return {
        success: false,
        message: err.message || 'Razorpay order creation error'
      };
    }
  }

  /**
   * Verify Razorpay Payment Signature (HMAC-SHA256)
   */
  static verifySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    keySecret: string
  ): boolean {
    try {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !keySecret) {
        return false;
      }
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret.trim())
        .update(payload)
        .digest('hex');

      return expectedSignature === razorpaySignature.trim();
    } catch (err) {
      console.error('[RazorpayService] Signature Verification Exception:', err);
      return false;
    }
  }
}
