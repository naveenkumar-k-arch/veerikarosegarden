/**
 * WhatsApp Cloud API Client — Official Meta Business API
 *
 * All credentials are read from environment variables at call-time.
 * NEVER hardcode tokens, phone IDs, or secrets here.
 *
 * Required env vars (set in Vercel dashboard → Settings → Environment Variables):
 *   WHATSAPP_ACCESS_TOKEN          — Permanent system user token from Meta Business Manager
 *   WHATSAPP_PHONE_NUMBER_ID       — Phone Number ID from WhatsApp Business → API Setup
 *   WHATSAPP_BUSINESS_ACCOUNT_ID   — WABA ID from WhatsApp Business Manager
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN  — A random string you create, used to verify webhook
 */

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ─── Config helpers ───────────────────────────────────────────────────────────

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      '[WhatsApp Cloud API] Missing required env vars: ' +
      'WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set.'
    );
  }

  return { accessToken, phoneNumberId, wabaId, webhookVerifyToken };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppTextPayload {
  to: string;          // E.164 format e.g. "919361540714"
  body: string;        // Plain text message
  previewUrl?: boolean;
}

export interface WhatsAppTemplatePayload {
  to: string;
  templateName: string;
  languageCode?: string; // default: 'en'
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url' | 'phone_number';
  index?: number;
  parameters: WhatsAppTemplateParameter[];
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  image?: { link: string };
  document?: { link: string; filename?: string };
  currency?: { fallback_value: string; code: string; amount_1000: number };
}

export interface WhatsAppImagePayload {
  to: string;
  imageUrl: string;
  caption?: string;
}

export interface WhatsAppDocumentPayload {
  to: string;
  documentUrl: string;
  filename: string;
  caption?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a phone number to E.164 without "+" prefix for WhatsApp API.
 * Adds Indian country code (91) if number is 10 digits.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/**
 * Core POST to WhatsApp Cloud API messages endpoint.
 */
async function postToWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  body: object
): Promise<WhatsAppSendResult> {
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    console.error('[WhatsApp Cloud API] Network error:', networkErr.message);
    return { success: false, error: `Network error: ${networkErr.message}` };
  }

  const data = await res.json().catch(() => ({})) as any;

  if (!res.ok) {
    const errMsg = data?.error?.message || `HTTP ${res.status}`;
    console.error('[WhatsApp Cloud API] API error:', data?.error);
    return { success: false, error: errMsg, statusCode: res.status };
  }

  const messageId = data?.messages?.[0]?.id;
  return { success: true, messageId };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a plain text message via WhatsApp Cloud API.
 *
 * @example
 * await sendWhatsAppText({ to: '919361540714', body: 'Your order has been placed!' });
 */
export async function sendWhatsAppText(payload: WhatsAppTextPayload): Promise<WhatsAppSendResult> {
  const { accessToken, phoneNumberId } = getConfig();
  const to = normalizePhone(payload.to);

  return postToWhatsApp(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      body: payload.body,
      preview_url: payload.previewUrl ?? false,
    },
  });
}

/**
 * Send a pre-approved template message (required for first-time outbound messages).
 *
 * @example
 * await sendWhatsAppTemplate({
 *   to: '919361540714',
 *   templateName: 'order_confirmation',
 *   languageCode: 'en',
 *   components: [{ type: 'body', parameters: [{ type: 'text', text: '#VRG1234' }] }]
 * });
 */
export async function sendWhatsAppTemplate(payload: WhatsAppTemplatePayload): Promise<WhatsAppSendResult> {
  const { accessToken, phoneNumberId } = getConfig();
  const to = normalizePhone(payload.to);

  return postToWhatsApp(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: payload.templateName,
      language: { code: payload.languageCode ?? 'en' },
      ...(payload.components ? { components: payload.components } : {}),
    },
  });
}

/**
 * Send an image message via public URL.
 */
export async function sendWhatsAppImage(payload: WhatsAppImagePayload): Promise<WhatsAppSendResult> {
  const { accessToken, phoneNumberId } = getConfig();
  const to = normalizePhone(payload.to);

  return postToWhatsApp(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'image',
    image: {
      link: payload.imageUrl,
      ...(payload.caption ? { caption: payload.caption } : {}),
    },
  });
}

/**
 * Send a document (PDF, etc.) via public URL.
 */
export async function sendWhatsAppDocument(payload: WhatsAppDocumentPayload): Promise<WhatsAppSendResult> {
  const { accessToken, phoneNumberId } = getConfig();
  const to = normalizePhone(payload.to);

  return postToWhatsApp(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'document',
    document: {
      link: payload.documentUrl,
      filename: payload.filename,
      ...(payload.caption ? { caption: payload.caption } : {}),
    },
  });
}

/**
 * Mark a received message as "read" (shows blue double-tick to the sender).
 */
export async function markWhatsAppMessageRead(messageId: string): Promise<boolean> {
  const { accessToken, phoneNumberId } = getConfig();
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Webhook Verification ─────────────────────────────────────────────────────

/**
 * Verify a WhatsApp webhook GET challenge from Meta.
 * Returns the hub.challenge string if valid, or null if invalid.
 */
export function verifyWhatsAppWebhook(query: {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
}): string | null {
  const { webhookVerifyToken } = getConfig();

  if (
    query['hub.mode'] === 'subscribe' &&
    query['hub.verify_token'] === webhookVerifyToken &&
    query['hub.challenge']
  ) {
    return query['hub.challenge'];
  }
  return null;
}

// ─── Webhook Message Parsing ──────────────────────────────────────────────────

export interface IncomingWhatsAppMessage {
  from: string;      // sender phone in E.164 (no +)
  messageId: string;
  timestamp: string;
  type:
    | 'text'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'interactive'
    | 'unknown';
  text?: string;
  mediaId?: string;
  caption?: string;
  interactive?: {
    type: 'button_reply' | 'list_reply';
    id: string;
    title: string;
  };
}

/**
 * Parse incoming webhook POST body and extract message objects.
 * Always returns an array (empty if no messages in payload).
 */
export function parseIncomingWebhookMessages(body: any): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = [];

  try {
    const entries: any[] = body?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value;
        if (!value?.messages) continue;

        for (const msg of value.messages) {
          const type = msg.type ?? 'unknown';
          const parsed: IncomingWhatsAppMessage = {
            from: msg.from,
            messageId: msg.id,
            timestamp: msg.timestamp,
            type,
          };

          if (type === 'text') {
            parsed.text = msg.text?.body;
          } else if (['image', 'document', 'audio', 'video', 'sticker'].includes(type)) {
            parsed.mediaId = msg[type]?.id;
            parsed.caption = msg[type]?.caption;
          } else if (type === 'interactive') {
            const interactiveType = msg.interactive?.type;
            parsed.interactive = {
              type: interactiveType,
              id: msg.interactive?.[interactiveType]?.id,
              title: msg.interactive?.[interactiveType]?.title,
            };
          }

          messages.push(parsed);
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp Cloud API] Failed to parse webhook body:', err);
  }

  return messages;
}
