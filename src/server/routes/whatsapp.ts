/**
 * WhatsApp Cloud API Routes
 *
 * GET  /api/whatsapp/webhook  — Webhook verification (Meta challenge)
 * POST /api/whatsapp/webhook  — Incoming messages from Meta
 * POST /api/whatsapp/send     — Send a text message (admin only)
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  verifyWhatsAppWebhook,
  parseIncomingWebhookMessages,
  sendWhatsAppText,
  sendWhatsAppTemplate,
} from '../whatsappCloudApi.js';

export const whatsappRouter = Router();

// ─── GET /api/whatsapp/webhook ─────────────────────────────────────────────
// Meta calls this to verify the webhook endpoint when you register it.
whatsappRouter.get('/webhook', (req: Request, res: Response) => {
  const challenge = verifyWhatsAppWebhook(req.query as any);
  if (challenge) {
    console.log('[WhatsApp Webhook] ✅ Verified successfully');
    res.status(200).send(challenge);
  } else {
    console.warn('[WhatsApp Webhook] ❌ Verification failed — wrong verify token?');
    res.status(403).json({ success: false, message: 'Webhook verification failed' });
  }
});

// ─── POST /api/whatsapp/webhook ────────────────────────────────────────────
// Meta sends incoming messages and status updates here.
whatsappRouter.post('/webhook', async (req: Request, res: Response) => {
  // IMPORTANT: Always return 200 immediately so Meta does not retry.
  res.status(200).send('EVENT_RECEIVED');

  try {
    const messages = parseIncomingWebhookMessages(req.body);
    for (const msg of messages) {
      console.log(`[WhatsApp Webhook] Incoming ${msg.type} from ${msg.from}: ${msg.text ?? msg.mediaId ?? ''}`);
      // TODO: Add your own business logic here — e.g., auto-reply to "hi", log to DB, etc.
    }

    // Handle status updates (delivered, read, failed, etc.)
    const statuses = req.body?.entry?.[0]?.changes?.[0]?.value?.statuses ?? [];
    for (const status of statuses) {
      console.log(`[WhatsApp Webhook] Status update — msgId: ${status.id}, status: ${status.status}`);
    }
  } catch (err) {
    console.error('[WhatsApp Webhook] Error processing event:', err);
  }
});

// ─── POST /api/whatsapp/send ────────────────────────────────────────────────
// Internal admin endpoint to send text messages.
// Protect this behind your existing admin auth middleware when integrating into routes.ts
whatsappRouter.post('/send', async (req: Request, res: Response) => {
  const { to, body: msgBody, templateName, languageCode, components } = req.body;

  if (!to) {
    res.status(400).json({ success: false, message: '"to" phone number is required' });
    return;
  }

  try {
    let result;
    if (templateName) {
      result = await sendWhatsAppTemplate({ to, templateName, languageCode, components });
    } else {
      if (!msgBody) {
        res.status(400).json({ success: false, message: '"body" is required when not using a template' });
        return;
      }
      result = await sendWhatsAppText({ to, body: msgBody });
    }

    if (result.success) {
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(502).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
