import { Router, Request, Response } from 'express';
import { generateOrderWhatsAppMessage, getOrderStage } from '../../utils/orderStages.js';
import { db } from '../db.js';
import {
  initWhatsAppSocket,
  getWhatsAppSessionInfo,
  sendWhatsAppFromLinkedDevice,
  disconnectWhatsAppDevice,
  WhatsAppSessionInfo
} from '../whatsappClient.js';

export const whatsappRouter = Router();

export interface WhatsAppConfig {
  provider: 'AUTO' | 'META_CLOUD' | 'LINKED_DEVICE';
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  metaBusinessAccountId?: string;
  metaWaTemplateName?: string;
  metaWaVerifyToken?: string;
  autoSendConfirmed: boolean;
  autoSendPacking: boolean;
  autoSendDispatched: boolean;
  autoSendDelivered: boolean;
  autoOpenWhatsAppWeb: boolean;
}

let memoryConfig: WhatsAppConfig = {
  provider: 'AUTO',
  metaPhoneNumberId: process.env.META_WA_PHONE_NUMBER_ID || '',
  metaAccessToken: process.env.META_WA_ACCESS_TOKEN || '',
  metaBusinessAccountId: process.env.META_WA_BUSINESS_ACCOUNT_ID || '',
  metaWaTemplateName: process.env.META_WA_TEMPLATE_NAME || 'order_confirmation',
  metaWaVerifyToken: process.env.META_WA_VERIFY_TOKEN || 'vrg_meta_wa_secret_2026',
  autoSendConfirmed: true,
  autoSendPacking: true,
  autoSendDispatched: true,
  autoSendDelivered: true,
  autoOpenWhatsAppWeb: false
};

/**
 * Get active configuration merged from Database and environment
 */
async function getEffectiveConfig(): Promise<WhatsAppConfig> {
  try {
    const fetchSettings = db.getSettings();
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const s = await Promise.race([fetchSettings, timeout]);
    if (!s) return memoryConfig;

    return {
      provider: (s.waProvider as any) || memoryConfig.provider || 'AUTO',
      metaPhoneNumberId: s.metaWaPhoneNumberId || memoryConfig.metaPhoneNumberId || process.env.META_WA_PHONE_NUMBER_ID || '',
      metaAccessToken: s.metaWaAccessToken || memoryConfig.metaAccessToken || process.env.META_WA_ACCESS_TOKEN || '',
      metaBusinessAccountId: s.metaWaBusinessAccountId || memoryConfig.metaBusinessAccountId || process.env.META_WA_BUSINESS_ACCOUNT_ID || '',
      metaWaTemplateName: s.metaWaTemplateName || memoryConfig.metaWaTemplateName || process.env.META_WA_TEMPLATE_NAME || 'order_confirmation',
      metaWaVerifyToken: s.metaWaVerifyToken || memoryConfig.metaWaVerifyToken || process.env.META_WA_VERIFY_TOKEN || 'vrg_meta_wa_secret_2026',
      autoSendConfirmed: s.waAutoSendConfirmed !== undefined ? s.waAutoSendConfirmed : memoryConfig.autoSendConfirmed,
      autoSendPacking: s.waAutoSendPacking !== undefined ? s.waAutoSendPacking : memoryConfig.autoSendPacking,
      autoSendDispatched: s.waAutoSendDispatched !== undefined ? s.waAutoSendDispatched : memoryConfig.autoSendDispatched,
      autoSendDelivered: s.waAutoSendDelivered !== undefined ? s.waAutoSendDelivered : memoryConfig.autoSendDelivered,
      autoOpenWhatsAppWeb: memoryConfig.autoOpenWhatsAppWeb
    };
  } catch {
    return memoryConfig;
  }
}

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
 * Supports pre-approved Templates (for business-initiated messages outside 24h)
 * with automatic fallback to text mode
 */
async function sendViaMetaCloudApi(
  recipientPhone: string,
  messageText: string,
  cfg: WhatsAppConfig,
  templatePayloadDetails?: {
    templateName?: string;
    templateLanguage?: string;
    params?: string[];
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const phoneNumberId = cfg.metaPhoneNumberId || process.env.META_WA_PHONE_NUMBER_ID;
    const accessToken = cfg.metaAccessToken || process.env.META_WA_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        error: 'Meta WhatsApp Cloud API credentials not configured.'
      };
    }

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const to = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    // 1. Try Meta Template Message if templateName is available
    const templateName = templatePayloadDetails?.templateName || cfg.metaWaTemplateName;
    const params = templatePayloadDetails?.params;

    if (templateName && params && params.length > 0) {
      try {
        const templatePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templatePayloadDetails?.templateLanguage || 'en' },
            components: [
              {
                type: 'body',
                parameters: params.map(val => ({ type: 'text', text: String(val || '') }))
              }
            ]
          }
        };

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(templatePayload)
        });

        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data.messages?.[0]?.id) {
          console.log(`[Meta Cloud API] Message delivered via template '${templateName}' to +${to}`);
          return {
            success: true,
            messageId: data.messages[0].id
          };
        }
        console.warn(`[Meta Template Warning]: Template '${templateName}' rejected (${data.error?.message || resp.status}). Falling back to text mode.`);
      } catch (tmplErr: any) {
        console.warn('[Meta Template Send Catch]:', tmplErr?.message);
      }
    }

    // 2. Text Message Mode (Fallback or inside 24-hr window)
    const textPayload = {
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
      body: JSON.stringify(textPayload)
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
 * Extract 5 dynamic parameters for Meta Template 'order_confirmation'
 */
function extractOrderTemplateParams(order: any): string[] {
  const customerName = order.customerName || (order.shippingAddress as any)?.fullName || 'Valued Customer';
  const orderId = String(order.id || '').replace(/^ORD-/i, '');
  const address = (order.shippingAddress as any)?.fullAddressString ||
    `${(order.shippingAddress as any)?.street || ''}, ${(order.shippingAddress as any)?.district || ''} ${(order.shippingAddress as any)?.pincode || ''}`.trim() || 'Tamil Nadu';
  const items = order.items && order.items.length > 0
    ? order.items.map((i: any) => `${i.name || i.title || 'Plant'} (Qty: ${i.quantity || 1})`).join(', ')
    : 'Live Plants & Saplings';
  const service = (order.serviceType || order.deliveryOption || 'Full Soil / Ready Soil Delivery').toString();
  return [customerName, orderId, address, items, service];
}

/**
 * Unified WhatsApp dispatcher: Supports Meta Cloud API, Baileys Linked Device, and Auto Fallback
 */
async function sendUnifiedWhatsApp(
  recipientPhone: string,
  messageText: string,
  orderId?: string,
  stage: string = 'custom',
  orderObj?: any
): Promise<{
  success: boolean;
  provider: string;
  messageId?: string;
  directUrl: string;
  error?: string;
  logId: string;
}> {
  const cfg = await getEffectiveConfig();
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const directUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(messageText)}`;

  let finalSuccess = false;
  let finalProvider = 'NONE';
  let finalMessageId: string | undefined;
  let finalError: string | undefined;

  const sessionInfo = getWhatsAppSessionInfo();
  const isMetaConfigured = Boolean(cfg.metaPhoneNumberId && cfg.metaAccessToken);
  const isDeviceConnected = sessionInfo.status === 'CONNECTED';

  // Prepare template parameters if order object exists
  const templateParams = orderObj ? extractOrderTemplateParams(orderObj) : undefined;
  const templatePayloadDetails = templateParams ? {
    templateName: cfg.metaWaTemplateName || 'order_confirmation',
    templateLanguage: 'en',
    params: templateParams
  } : undefined;

  // Dispatch Strategy
  if (cfg.provider === 'META_CLOUD') {
    finalProvider = 'META_CLOUD_API';
    const res = await sendViaMetaCloudApi(targetPhone, messageText, cfg, templatePayloadDetails);
    finalSuccess = res.success;
    finalMessageId = res.messageId;
    finalError = res.error;
  } else if (cfg.provider === 'LINKED_DEVICE') {
    finalProvider = 'LINKED_DEVICE';
    const res = await sendWhatsAppFromLinkedDevice(targetPhone, messageText);
    finalSuccess = res.success;
    finalMessageId = res.messageId;
    finalError = res.error;
  } else {
    // AUTO: Prefer Meta Cloud API if configured; fallback to Linked Device; or vice versa
    if (isMetaConfigured) {
      const metaRes = await sendViaMetaCloudApi(targetPhone, messageText, cfg, templatePayloadDetails);
      if (metaRes.success) {
        finalSuccess = true;
        finalProvider = 'META_CLOUD_API';
        finalMessageId = metaRes.messageId;
      } else {
        // Fallback to linked device if connected
        if (isDeviceConnected) {
          const deviceRes = await sendWhatsAppFromLinkedDevice(targetPhone, messageText);
          if (deviceRes.success) {
            finalSuccess = true;
            finalProvider = 'LINKED_DEVICE';
            finalMessageId = deviceRes.messageId;
          } else {
            finalSuccess = false;
            finalProvider = 'AUTO_FALLBACK_FAILED';
            finalError = `Meta: ${metaRes.error}; LinkedDevice: ${deviceRes.error}`;
          }
        } else {
          finalSuccess = false;
          finalProvider = 'META_CLOUD_API';
          finalError = metaRes.error;
        }
      }
    } else if (isDeviceConnected) {
      finalProvider = 'LINKED_DEVICE';
      const deviceRes = await sendWhatsAppFromLinkedDevice(targetPhone, messageText);
      finalSuccess = deviceRes.success;
      finalMessageId = deviceRes.messageId;
      finalError = deviceRes.error;
    } else {
      finalSuccess = false;
      finalProvider = 'UNCONFIGURED';
      finalError = 'Neither Meta Cloud API credentials nor Linked WhatsApp Device are connected. Please configure in Admin Settings.';
    }
  }

  const logEntry: DispatchLog = {
    id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    orderId,
    stage,
    recipientPhone: targetPhone,
    provider: finalProvider,
    messageId: finalMessageId,
    status: finalSuccess ? 'SUCCESS' : 'FAILED',
    error: finalError
  };

  logs.unshift(logEntry);
  if (logs.length > 150) logs.pop();

  return {
    success: finalSuccess,
    provider: finalProvider,
    messageId: finalMessageId,
    directUrl,
    error: finalError,
    logId: logEntry.id
  };
}

/**
 * GET /api/whatsapp/status
 * Returns current integration status across Meta API and Linked Device
 */
whatsappRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const cfg = await getEffectiveConfig();
    const session = getWhatsAppSessionInfo();
    const isMetaConfigured = Boolean(cfg.metaPhoneNumberId && cfg.metaAccessToken);

    res.json({
      success: true,
      provider: cfg.provider,
      isConfigured: isMetaConfigured || session.status === 'CONNECTED',
      isMetaConfigured,
      isDeviceConnected: session.status === 'CONNECTED',
      connectedPhone: session.connectedPhone,
      connectedName: session.connectedName,
      deviceStatus: session.status,
      metaPhoneNumberId: cfg.metaPhoneNumberId ? '••••••••' + cfg.metaPhoneNumberId.slice(-4) : '',
      metaWaTemplateName: cfg.metaWaTemplateName || 'order_confirmation',
      metaWaVerifyToken: cfg.metaWaVerifyToken || 'vrg_meta_wa_secret_2026',
      hasAccessToken: Boolean(cfg.metaAccessToken),
      autoSendConfirmed: cfg.autoSendConfirmed,
      autoSendPacking: cfg.autoSendPacking,
      autoSendDispatched: cfg.autoSendDispatched,
      autoSendDelivered: cfg.autoSendDelivered,
      autoOpenWhatsAppWeb: cfg.autoOpenWhatsAppWeb,
      logsCount: logs.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/whatsapp/webhook
 * Verification endpoint for Meta Webhook setup (hub.challenge handshake)
 */
whatsappRouter.get('/webhook', async (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const cfg = await getEffectiveConfig();
    const expectedToken = cfg.metaWaVerifyToken || process.env.META_WA_VERIFY_TOKEN || 'vrg_meta_wa_secret_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[Meta WhatsApp Webhook] Challenge verified successfully!');
      return res.status(200).send(challenge);
    }
    console.warn('[Meta WhatsApp Webhook] Verification failed:', { mode, token, expectedToken });
    return res.status(403).send('Forbidden: Invalid Verify Token');
  } catch (err: any) {
    return res.status(500).send('Error');
  }
});

/**
 * POST /api/whatsapp/webhook
 * Inbound webhook for customer messages and delivery receipts
 */
whatsappRouter.post('/webhook', async (req: Request, res: Response) => {
  // Always respond 200 immediately to Meta
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return;
    }

    for (const msg of messages) {
      const fromPhone = String(msg.from || '').replace(/\D/g, ''); // e.g. 919361540714
      const clean10 = fromPhone.slice(-10);
      const textBody = (msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || '').trim().toLowerCase();

      console.log(`[Meta WhatsApp Inbound]: From +${fromPhone}: "${textBody}"`);

      if (!clean10 || clean10.length < 10) continue;

      // Find user's active/recent orders
      const allOrders = await db.getOrders();
      const userOrders = allOrders
        .filter(o => {
          const ph = (o.customerPhone || (o.shippingAddress as any)?.phone || '').replace(/\D/g, '').slice(-10);
          return ph === clean10 && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'DELIVERED';
        })
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const latestOrder = userOrders[0];
      if (!latestOrder) continue;

      const isAffirmative = ['yes', 'y', 'correct', 'ok', 'okay', 'confirmed', 'confirm', '1', 'yes correct', 'all correct'].includes(textBody);
      const isNegative = ['no', 'n', 'change', 'wrong', 'update', 'edit', 'not correct'].some(w => textBody.includes(w));

      const replySummary = isAffirmative ? 'YES' : isNegative ? 'NO' : (textBody.length > 60 ? textBody.slice(0, 60) + '...' : textBody);

      if (isAffirmative) {
        console.log(`[Meta WhatsApp Webhook] Order #${latestOrder.id}: Customer replied YES. Awaiting manual owner verification.`);
        await db.updateOrderFull(latestOrder.id, {
          customerAddressConfirmed: true,
          customerAddressConfirmedAt: new Date().toISOString(),
          customerWhatsAppReply: 'YES',
          customerWhatsAppReplyAt: new Date().toISOString()
        }).catch(() => {});

        // Send simple receipt acknowledgement - order approval remains manual by owner
        const replyText = `🌸 *VEERIKA ROSE GARDEN*\n\n✅ Thank you, *${latestOrder.customerName || 'Valued Customer'}*! We have received your confirmation reply.\n\nOur nursery owner will review your order details (#${latestOrder.id}) before packing.\n\nThank you for choosing Veerika Rose Garden! ❤️🌿`;
        await sendUnifiedWhatsApp(fromPhone, replyText, latestOrder.id, 'CUSTOMER_REPLY_ACK').catch(() => {});
      } else if (isNegative) {
        console.log(`[Meta WhatsApp Webhook] Order #${latestOrder.id}: Customer requested changes. Flagged for nursery owner.`);
        await db.updateOrderFull(latestOrder.id, {
          customerAddressChangeRequested: true,
          customerWhatsAppReply: 'NO',
          customerWhatsAppReplyAt: new Date().toISOString(),
          deliveryNotes: `[Customer WhatsApp Request]: ${textBody}`
        }).catch(() => {});

        const replyText = `🌸 *VEERIKA ROSE GARDEN*\n\n⚠️ Thank you for letting us know! We have noted that you requested updates for order #${latestOrder.id}.\n\nOur nursery owner (+91 93615 40714) will review your request and contact you shortly.\n\nThank you! ❤️`;
        await sendUnifiedWhatsApp(fromPhone, replyText, latestOrder.id, 'CUSTOMER_REPLY_CHANGE').catch(() => {});
      } else {
        console.log(`[Meta WhatsApp Webhook] Order #${latestOrder.id}: Customer sent custom reply: "${replySummary}"`);
        await db.updateOrderFull(latestOrder.id, {
          customerWhatsAppReply: replySummary,
          customerWhatsAppReplyAt: new Date().toISOString(),
          deliveryNotes: `[Customer WhatsApp Message]: ${textBody}`
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    console.error('[Meta WhatsApp Webhook Processing Error]:', err?.message);
  }
});

/**
 * GET /api/whatsapp/qr
 * Returns the current Baileys socket state and QR code data URL
 */
whatsappRouter.get('/qr', async (_req: Request, res: Response) => {
  try {
    let session = getWhatsAppSessionInfo();
    if (session.status === 'DISCONNECTED') {
      initWhatsAppSocket().catch(e => console.warn('[WhatsApp Socket Init Error]:', e?.message));
    }
    session = getWhatsAppSessionInfo();
    res.json({
      success: true,
      session
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/qr/refresh
 */
whatsappRouter.post('/qr/refresh', async (_req: Request, res: Response) => {
  try {
    const session = await initWhatsAppSocket(true);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/disconnect
 */
whatsappRouter.post('/disconnect', async (_req: Request, res: Response) => {
  try {
    await disconnectWhatsAppDevice();
    res.json({ success: true, message: 'WhatsApp device unlinked successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/settings
 * Save WhatsApp configuration into memory & PostgreSQL SiteSettings
 */
whatsappRouter.post('/settings', async (req: Request, res: Response) => {
  try {
    const {
      provider,
      metaPhoneNumberId,
      metaAccessToken,
      metaBusinessAccountId,
      metaWaTemplateName,
      metaWaVerifyToken,
      autoSendConfirmed,
      autoSendPacking,
      autoSendDispatched,
      autoSendDelivered,
      autoOpenWhatsAppWeb
    } = req.body;

    if (provider) memoryConfig.provider = provider;
    if (metaPhoneNumberId !== undefined) memoryConfig.metaPhoneNumberId = metaPhoneNumberId.trim();
    if (metaAccessToken !== undefined) memoryConfig.metaAccessToken = metaAccessToken.trim();
    if (metaBusinessAccountId !== undefined) memoryConfig.metaBusinessAccountId = metaBusinessAccountId.trim();
    if (metaWaTemplateName !== undefined) memoryConfig.metaWaTemplateName = metaWaTemplateName.trim();
    if (metaWaVerifyToken !== undefined) memoryConfig.metaWaVerifyToken = metaWaVerifyToken.trim();
    if (autoSendConfirmed !== undefined) memoryConfig.autoSendConfirmed = Boolean(autoSendConfirmed);
    if (autoSendPacking !== undefined) memoryConfig.autoSendPacking = Boolean(autoSendPacking);
    if (autoSendDispatched !== undefined) memoryConfig.autoSendDispatched = Boolean(autoSendDispatched);
    if (autoSendDelivered !== undefined) memoryConfig.autoSendDelivered = Boolean(autoSendDelivered);
    if (autoOpenWhatsAppWeb !== undefined) memoryConfig.autoOpenWhatsAppWeb = Boolean(autoOpenWhatsAppWeb);

    // Persist permanently in Database SiteSettings
    await db.updateSettings({
      waProvider: memoryConfig.provider,
      metaWaPhoneNumberId: memoryConfig.metaPhoneNumberId,
      metaWaAccessToken: memoryConfig.metaAccessToken,
      metaWaBusinessAccountId: memoryConfig.metaBusinessAccountId,
      metaWaTemplateName: memoryConfig.metaWaTemplateName,
      metaWaVerifyToken: memoryConfig.metaWaVerifyToken,
      waAutoSendConfirmed: memoryConfig.autoSendConfirmed,
      waAutoSendPacking: memoryConfig.autoSendPacking,
      waAutoSendDispatched: memoryConfig.autoSendDispatched,
      waAutoSendDelivered: memoryConfig.autoSendDelivered
    }).catch(err => console.warn('Could not persist WhatsApp settings in database:', err?.message));

    res.json({
      success: true,
      config: memoryConfig,
      message: 'WhatsApp automation settings saved permanently!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/send
 * Sends a WhatsApp message using active provider
 */
whatsappRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const { phone, message, orderId, stage = 'custom', templateName, params } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Recipient phone and message are required' });
    }

    const cfg = await getEffectiveConfig();
    const result = await sendUnifiedWhatsApp(
      phone,
      message,
      orderId,
      stage,
      params ? { items: [{ name: params[3] }], customerName: params[0], id: params[1], shippingAddress: { fullAddressString: params[2] } } : undefined
    );

    res.json({
      success: result.success,
      provider: result.provider,
      recipientPhone: phone,
      directUrl: result.directUrl,
      messageId: result.messageId,
      logId: result.logId,
      error: result.error,
      message: result.success
        ? `Message delivered automatically via ${result.provider}!`
        : result.error
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/whatsapp/logs
 */
whatsappRouter.get('/logs', (_req: Request, res: Response) => {
  res.json({ success: true, logs: logs.slice(0, 60) });
});

// In-memory sliding set to deduplicate automated confirmations
const sentConfirmations = new Set<string>();

/**
 * Automated Order Confirmation notification trigger
 */
export async function notifyOrderConfirmed(
  order: any,
  extra?: { origin?: string; courierName?: string; trackingNumber?: string }
) {
  try {
    if (!order) return null;
    const orderId = order.id || order.merchantTransactionId;
    if (!orderId) return null;

    const dedupeKey = `${orderId}_confirmed`;
    if (sentConfirmations.has(dedupeKey)) {
      console.log(`[WhatsApp AutoSend] Order #${orderId} confirmation already sent. Skipping duplicate.`);
      return null;
    }
    sentConfirmations.add(dedupeKey);
    if (sentConfirmations.size > 2000) {
      const first = sentConfirmations.values().next().value;
      if (first) sentConfirmations.delete(first);
    }

    console.log(`[WhatsApp AutoSend] Triggering automated Order Confirmation for #${orderId}...`);
    return await triggerOrderStageWhatsApp(order, 'confirmed', extra);
  } catch (err: any) {
    console.warn('[WhatsApp notifyOrderConfirmed Error]:', err?.message);
    return null;
  }
}

/**
 * Trigger order stage WhatsApp notification directly in the background
 */
export async function triggerOrderStageWhatsApp(
  order: any,
  newStageInput: 'confirmed' | 'packing' | 'dispatched' | 'delivered',
  extra?: { courierName?: string; trackingNumber?: string; origin?: string }
) {
  try {
    const cfg = await getEffectiveConfig();
    const stage = newStageInput || getOrderStage(order.orderStatus);

    if (stage === 'confirmed' && !cfg.autoSendConfirmed) return null;
    if (stage === 'packing' && !cfg.autoSendPacking) return null;
    if (stage === 'dispatched' && !cfg.autoSendDispatched) return null;
    if (stage === 'delivered' && !cfg.autoSendDelivered) return null;

    const rawPhone = order.customerPhone || order.shippingAddress?.phone || (order.phone || '');
    if (!rawPhone) {
      console.warn(`[WhatsApp AutoSend] Order #${order.id} has no phone number. Skipping.`);
      return null;
    }

    const msg = generateOrderWhatsAppMessage(order, stage, extra);
    const result = await sendUnifiedWhatsApp(rawPhone, msg, order.id, stage, order);

    console.log(`[WhatsApp AutoSend] Order #${order.id} stage '${stage}' sent via ${result.provider}. Success: ${result.success}`);

    return {
      success: result.success,
      provider: result.provider,
      logId: result.logId,
      stage,
      targetPhone: rawPhone,
      messageId: result.messageId,
      directUrl: result.directUrl,
      message: msg,
      error: result.error
    };
  } catch (err: any) {
    console.warn('[WhatsApp AutoSend Error]:', err?.message);
    return null;
  }
}
