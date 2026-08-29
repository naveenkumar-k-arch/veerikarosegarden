import { Router, Request, Response } from 'express';
import { generateOrderWhatsAppMessage, getOrderStage } from '../../utils/orderStages.js';

export const whatsappRouter = Router();

export interface WhatsAppConfig {
  provider: 'DIRECT_LINK' | 'ULTRAMSG' | 'EVOLUTION' | 'GREEN_API' | 'META_CLOUD';
  instanceId?: string;
  apiToken?: string;
  apiEndpoint?: string;
  senderPhone?: string;
  autoSendConfirmed: boolean;
  autoSendPacking: boolean;
  autoSendDispatched: boolean;
  autoSendDelivered: boolean;
  autoOpenWhatsAppWeb: boolean;
}

let config: WhatsAppConfig = {
  provider: 'DIRECT_LINK',
  senderPhone: '917200826129',
  autoSendConfirmed: true,
  autoSendPacking: true,
  autoSendDispatched: true,
  autoSendDelivered: true,
  autoOpenWhatsAppWeb: true
};

interface DispatchLog {
  id: string;
  timestamp: string;
  orderId?: string;
  stage: string;
  recipientPhone: string;
  status: 'SUCCESS' | 'FAILED';
  provider: string;
  error?: string;
}

const logs: DispatchLog[] = [];

/**
 * Dispatch message via connected Gateway API
 */
async function dispatchViaGateway(phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const to = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (config.provider === 'ULTRAMSG' && config.instanceId && config.apiToken) {
      const url = `https://api.ultramsg.com/${config.instanceId}/messages/chat`;
      const params = new URLSearchParams();
      params.append('token', config.apiToken);
      params.append('to', to);
      params.append('body', text);

      const resp = await fetch(url, { method: 'POST', body: params });
      const resData = await resp.json().catch(() => ({}));
      if (resData.sent === 'true' || resData.id) return { success: true };
      return { success: false, error: resData.error || resData.message || 'UltraMsg delivery failed' };
    }

    if (config.provider === 'EVOLUTION' && config.apiEndpoint && config.instanceId && config.apiToken) {
      const endpoint = `${config.apiEndpoint.replace(/\/+$/, '')}/message/sendText/${config.instanceId}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.apiToken
        },
        body: JSON.stringify({
          number: to,
          text: text,
          options: { delay: 1200, presence: 'composing' }
        })
      });
      if (resp.ok) return { success: true };
      return { success: false, error: `Evolution API returned ${resp.status}` };
    }

    if (config.provider === 'GREEN_API' && config.instanceId && config.apiToken) {
      const endpoint = `https://api.green-api.com/waInstance${config.instanceId}/sendMessage/${config.apiToken}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${to}@c.us`,
          message: text
        })
      });
      if (resp.ok) return { success: true };
      return { success: false, error: `Green API returned ${resp.status}` };
    }

    // Default Direct Link provider
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * GET /api/whatsapp/status
 */
whatsappRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    provider: config.provider,
    senderPhone: config.senderPhone,
    instanceId: config.instanceId,
    autoSendConfirmed: config.autoSendConfirmed,
    autoSendPacking: config.autoSendPacking,
    autoSendDispatched: config.autoSendDispatched,
    autoSendDelivered: config.autoSendDelivered,
    autoOpenWhatsAppWeb: config.autoOpenWhatsAppWeb,
    isGatewayConfigured: Boolean(config.instanceId && config.apiToken),
    logsCount: logs.length
  });
});

/**
 * POST /api/whatsapp/settings
 */
whatsappRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const {
      provider,
      instanceId,
      apiToken,
      apiEndpoint,
      senderPhone,
      autoSendConfirmed,
      autoSendPacking,
      autoSendDispatched,
      autoSendDelivered,
      autoOpenWhatsAppWeb
    } = req.body;

    if (provider) config.provider = provider;
    if (instanceId !== undefined) config.instanceId = instanceId;
    if (apiToken !== undefined) config.apiToken = apiToken;
    if (apiEndpoint !== undefined) config.apiEndpoint = apiEndpoint;
    if (senderPhone !== undefined) config.senderPhone = senderPhone;
    if (autoSendConfirmed !== undefined) config.autoSendConfirmed = Boolean(autoSendConfirmed);
    if (autoSendPacking !== undefined) config.autoSendPacking = Boolean(autoSendPacking);
    if (autoSendDispatched !== undefined) config.autoSendDispatched = Boolean(autoSendDispatched);
    if (autoSendDelivered !== undefined) config.autoSendDelivered = Boolean(autoSendDelivered);
    if (autoOpenWhatsAppWeb !== undefined) config.autoOpenWhatsAppWeb = Boolean(autoOpenWhatsAppWeb);

    res.json({
      success: true,
      config,
      message: 'WhatsApp settings saved successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/send
 */
whatsappRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { phone, message, orderId, stage = 'custom' } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone and message are required' });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const directUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

    const dispatchResult = await dispatchViaGateway(targetPhone, message);

    const logEntry: DispatchLog = {
      id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId,
      stage,
      recipientPhone: targetPhone,
      provider: config.provider,
      status: dispatchResult.success ? 'SUCCESS' : 'FAILED',
      error: dispatchResult.error
    };

    logs.unshift(logEntry);
    if (logs.length > 100) logs.pop();

    res.json({
      success: true,
      status: dispatchResult.success ? 'SENT' : 'DISPATCH_QUEUED',
      recipientPhone: targetPhone,
      directUrl,
      logId: logEntry.id,
      timestamp: logEntry.timestamp,
      error: dispatchResult.error,
      message: 'WhatsApp notification processed successfully'
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
 * Trigger order stage WhatsApp notification
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
    const directUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;

    const dispatchRes = await dispatchViaGateway(targetPhone, msg);

    const logEntry: DispatchLog = {
      id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId: order.id,
      stage,
      recipientPhone: targetPhone,
      provider: config.provider,
      status: dispatchRes.success ? 'SUCCESS' : 'FAILED',
      error: dispatchRes.error
    };

    logs.unshift(logEntry);
    if (logs.length > 100) logs.pop();

    return {
      success: true,
      logId: logEntry.id,
      stage,
      targetPhone,
      directUrl,
      message: msg
    };
  } catch (err: any) {
    console.warn('[WhatsApp AutoSend Error]:', err.message);
    return null;
  }
}
