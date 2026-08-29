import { Router, Request, Response } from 'express';
import { generateOrderWhatsAppMessage, getOrderStage } from '../../utils/orderStages.js';
import {
  initWhatsAppSocket,
  getWhatsAppSessionInfo,
  sendWhatsAppFromLinkedDevice,
  disconnectWhatsAppDevice
} from '../whatsappClient.js';

export const whatsappRouter = Router();

export interface WhatsAppConfig {
  autoSendConfirmed: boolean;
  autoSendPacking: boolean;
  autoSendDispatched: boolean;
  autoSendDelivered: boolean;
  autoOpenWhatsAppWeb: boolean;
}

let config: WhatsAppConfig = {
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
  senderPhone?: string;
  error?: string;
}

const logs: DispatchLog[] = [];

/**
 * GET /api/whatsapp/status
 * Returns real live multi-device session status, linked phone, and QR code
 */
whatsappRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const session = getWhatsAppSessionInfo();

    res.json({
      success: true,
      status: session.status,
      connectedPhone: session.connectedPhone,
      connectedName: session.connectedName,
      qrCodeDataUrl: session.qrCodeDataUrl,
      qrExpiresAt: session.qrExpiresAt,
      lastConnectedAt: session.lastConnectedAt,
      lastError: session.lastError,
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
 * POST /api/whatsapp/qr
 * Requests a real multi-device pairing QR code from WhatsApp servers
 */
whatsappRouter.post('/qr', async (_req: Request, res: Response) => {
  try {
    const session = await initWhatsAppSocket(true);

    // Wait a brief moment for QR code event to fire if connecting
    if (session.status === 'CONNECTING' && !session.qrCodeDataUrl) {
      await new Promise(r => setTimeout(r, 1500));
    }

    const updatedSession = getWhatsAppSessionInfo();

    res.json({
      success: true,
      status: updatedSession.status,
      qrCodeDataUrl: updatedSession.qrCodeDataUrl,
      qrExpiresAt: updatedSession.qrExpiresAt,
      connectedPhone: updatedSession.connectedPhone,
      message: 'Scan the QR code with WhatsApp > Linked Devices > Link a Device'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Unlinks the connected WhatsApp device and clears credentials
 */
whatsappRouter.post('/disconnect', async (_req: Request, res: Response) => {
  try {
    await disconnectWhatsAppDevice();
    res.json({
      success: true,
      status: 'DISCONNECTED',
      message: 'WhatsApp device unlinked successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/whatsapp/settings
 * Updates automation stage toggles
 */
whatsappRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const {
      autoSendConfirmed,
      autoSendPacking,
      autoSendDispatched,
      autoSendDelivered,
      autoOpenWhatsAppWeb
    } = req.body;

    if (autoSendConfirmed !== undefined) config.autoSendConfirmed = Boolean(autoSendConfirmed);
    if (autoSendPacking !== undefined) config.autoSendPacking = Boolean(autoSendPacking);
    if (autoSendDispatched !== undefined) config.autoSendDispatched = Boolean(autoSendDispatched);
    if (autoSendDelivered !== undefined) config.autoSendDelivered = Boolean(autoSendDelivered);
    if (autoOpenWhatsAppWeb !== undefined) config.autoOpenWhatsAppWeb = Boolean(autoOpenWhatsAppWeb);

    res.json({
      success: true,
      config,
      message: 'WhatsApp automation preferences saved successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/send
 * Sends a real WhatsApp message from the linked device
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

    const session = getWhatsAppSessionInfo();
    const sendResult = await sendWhatsAppFromLinkedDevice(targetPhone, message);

    const logEntry: DispatchLog = {
      id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId,
      stage,
      recipientPhone: targetPhone,
      senderPhone: session.connectedPhone,
      status: sendResult.success ? 'SUCCESS' : 'FAILED',
      error: sendResult.error
    };

    logs.unshift(logEntry);
    if (logs.length > 100) logs.pop();

    res.json({
      success: sendResult.success,
      status: sendResult.success ? 'SENT_VIA_LINKED_DEVICE' : 'DISPATCH_PENDING',
      recipientPhone: targetPhone,
      directUrl,
      senderPhone: session.connectedPhone,
      logId: logEntry.id,
      timestamp: logEntry.timestamp,
      error: sendResult.error,
      message: sendResult.success
        ? `Message sent directly from linked WhatsApp (+${session.connectedPhone || 'Admin'})`
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
 * Trigger order stage WhatsApp notification directly from linked device
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

    const session = getWhatsAppSessionInfo();
    const sendRes = await sendWhatsAppFromLinkedDevice(targetPhone, msg);

    const logEntry: DispatchLog = {
      id: `WAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId: order.id,
      stage,
      recipientPhone: targetPhone,
      senderPhone: session.connectedPhone,
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
      senderPhone: session.connectedPhone,
      directUrl,
      message: msg
    };
  } catch (err: any) {
    console.warn('[WhatsApp AutoSend Error]:', err.message);
    return null;
  }
}
