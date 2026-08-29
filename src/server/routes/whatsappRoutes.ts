import { Router, Request, Response } from 'express';
import { generateOrderWhatsAppMessage, getOrderStage } from '../../utils/orderStages.js';

export const whatsappRouter = Router();

export interface WhatsAppConfig {
  provider: 'META_CLOUD' | 'DIRECT_LINK';
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  metaBusinessAccountId?: string;
  autoSendConfirmed: boolean;
  autoSendPacking: boolean;
  autoSendDispatched: boolean;
  autoSendDelivered: boolean;
  autoOpenWhatsAppWeb: boolean;
}

let config: WhatsAppConfig = {
  provider: 'META_CLOUD',
  metaPhoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
  metaAccessToken: process.env.META_WA_ACCESS_TOKEN || '',
  metaBusinessAccountId: process.env.META_WA_BUSINESS_ACCOUNT_ID || '',
  autoSendConfirmed: true,
  autoSendPacking: true,
  autoSendDispatched: true,
  autoSendDelivered: true,
  autoOpenWhatsAppWeb: false
};

interface DispatchLog {
  id: string;
  timestamp: string;
  orderId?: string;
  stage: string;
  recipientPhone: string;
  status: 'SUCCESS' | 'FAILED';
  provider: string;
  messageId?: string;
  error?: string;
}

const logs: DispatchLog[] = [];

/**
 * Send WhatsApp message via Official Meta WhatsApp Cloud API
 */
async function sendViaMetaCloudApi(
  recipientPhone: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const phoneNumberId = config.metaPhoneNumberId || process.env.META_WA_PHONE_NUMBER_ID;
    const accessToken = config.metaAccessToken || process.env.META_WA_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        error: 'Meta WhatsApp Cloud API credentials not configured. Please enter Phone Number ID & Access Token in Admin Settings.'
      };
    }

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const to = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: true,
        body: messageText
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));

    if (resp.ok && data.messages?.[0]?.id) {
      return {
        success: true,
        messageId: data.messages[0].id
      };
    }

    const errDetail = data.error?.message || data.error?.error_user_msg || `Meta API Error (${resp.status})`;
    return {
      success: false,
      error: errDetail
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to send WhatsApp message via Meta Cloud API'
    };
  }
}

/**
 * GET /api/whatsapp/status
 * Returns current Meta Cloud API integration status
 */
whatsappRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const isConfigured = Boolean(
      (config.metaPhoneNumberId || process.env.META_WA_PHONE_NUMBER_ID) &&
      (config.metaAccessToken || process.env.META_WA_ACCESS_TOKEN)
    );

    res.json({
      success: true,
      provider: config.provider,
      isConfigured,
      metaPhoneNumberId: config.metaPhoneNumberId || (process.env.META_WA_PHONE_NUMBER_ID ? '••••••••' + process.env.META_WA_PHONE_NUMBER_ID.slice(-4) : ''),
      hasAccessToken: Boolean(config.metaAccessToken || process.env.META_WA_ACCESS_TOKEN),
      autoSendConfirmed: config.autoSendConfirmed,
      autoSendPacking: config.autoSendPacking,
      autoSendDispatched: config.autoSendDispatched,
      autoSendDelivered: config.autoSendDelivered,
      autoOpenWhatsAppWeb: config.autoOpenWhatsAppWeb,
      logsCount: logs.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/settings
 * Save Meta Cloud API credentials & stage toggles
 */
whatsappRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const {
      provider,
      metaPhoneNumberId,
      metaAccessToken,
      metaBusinessAccountId,
      autoSendConfirmed,
      autoSendPacking,
      autoSendDispatched,
      autoSendDelivered,
      autoOpenWhatsAppWeb
    } = req.body;

    if (provider) config.provider = provider;
    if (metaPhoneNumberId !== undefined) config.metaPhoneNumberId = metaPhoneNumberId.trim();
    if (metaAccessToken !== undefined) config.metaAccessToken = metaAccessToken.trim();
    if (metaBusinessAccountId !== undefined) config.metaBusinessAccountId = metaBusinessAccountId.trim();
    if (autoSendConfirmed !== undefined) config.autoSendConfirmed = Boolean(autoSendConfirmed);
    if (autoSendPacking !== undefined) config.autoSendPacking = Boolean(autoSendPacking);
    if (autoSendDispatched !== undefined) config.autoSendDispatched = Boolean(autoSendDispatched);
    if (autoSendDelivered !== undefined) config.autoSendDelivered = Boolean(autoSendDelivered);
    if (autoOpenWhatsAppWeb !== undefined) config.autoOpenWhatsAppWeb = Boolean(autoOpenWhatsAppWeb);

    res.json({
      success: true,
      config: {
        provider: config.provider,
        isConfigured: Boolean(config.metaPhoneNumberId && config.metaAccessToken),
        autoSendConfirmed: config.autoSendConfirmed,
        autoSendPacking: config.autoSendPacking,
        autoSendDispatched: config.autoSendDispatched,
        autoSendDelivered: config.autoSendDelivered
      },
      message: 'Official Meta WhatsApp Cloud API settings saved successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/send
 * Sends a real WhatsApp message using Meta Cloud API
 */
whatsappRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { phone, message, orderId, stage = 'custom' } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone and message are required' });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const directUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`;

    const sendResult = await sendViaMetaCloudApi(targetPhone, message);

    const logEntry: DispatchLog = {
      id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId,
      stage,
      recipientPhone: targetPhone,
      provider: 'META_CLOUD_API',
      messageId: sendResult.messageId,
      status: sendResult.success ? 'SUCCESS' : 'FAILED',
      error: sendResult.error
    };

    logs.unshift(logEntry);
    if (logs.length > 100) logs.pop();

    res.json({
      success: sendResult.success,
      status: sendResult.success ? 'SENT_VIA_META_CLOUD_API' : 'FAILED',
      recipientPhone: targetPhone,
      directUrl,
      messageId: sendResult.messageId,
      logId: logEntry.id,
      timestamp: logEntry.timestamp,
      error: sendResult.error,
      message: sendResult.success
        ? `Message sent automatically to +${targetPhone} via Official Meta WhatsApp Cloud API!`
        : sendResult.error
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whatsapp/logs
 */
whatsappRouter.get('/logs', (_req: Request, res: Response) => {
  res.json({ success: true, logs: logs.slice(0, 50) });
});

/**
 * Trigger order stage WhatsApp notification directly in the background
 */
export async function triggerOrderStageWhatsApp(
  order: any,
  newStageInput: 'confirmed' | 'packing' | 'dispatched' | 'delivered',
  extra?: { courierName?: string; trackingNumber?: string }
) {
  try {
    const stage = newStageInput || getOrderStage(order.orderStatus);

    if (stage === 'confirmed' && !config.autoSendConfirmed) return null;
    if (stage === 'packing' && !config.autoSendPacking) return null;
    if (stage === 'dispatched' && !config.autoSendDispatched) return null;
    if (stage === 'delivered' && !config.autoSendDelivered) return null;

    const rawPhone = order.customerPhone || order.shippingAddress?.phone || '';
    if (!rawPhone) return null;

    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = generateOrderWhatsAppMessage(order, stage, extra);
    const directUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`;

    const sendRes = await sendViaMetaCloudApi(targetPhone, msg);

    const logEntry: DispatchLog = {
      id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId: order.id,
      stage,
      recipientPhone: targetPhone,
      provider: 'META_CLOUD_API',
      messageId: sendRes.messageId,
      status: sendRes.success ? 'SUCCESS' : 'FAILED',
      error: sendRes.error
    };

    logs.unshift(logEntry);
    if (logs.length > 100) logs.pop();

    return {
      success: sendRes.success,
      logId: logEntry.id,
      stage,
      targetPhone,
      messageId: sendRes.messageId,
      directUrl,
      message: msg
    };
  } catch (err: any) {
    console.warn('[Meta WhatsApp AutoSend Error]:', err.message);
    return null;
  }
}
