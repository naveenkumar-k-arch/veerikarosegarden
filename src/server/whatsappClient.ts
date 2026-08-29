import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  WASocket
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

export interface WhatsAppSessionInfo {
  status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';
  connectedPhone?: string;
  connectedName?: string;
  qrCodeDataUrl?: string;
  qrExpiresAt?: string;
  lastConnectedAt?: string;
  lastError?: string;
}

let sock: WASocket | null = null;
let currentStatus: WhatsAppSessionInfo = {
  status: 'DISCONNECTED'
};

const AUTH_DIR = path.join(process.cwd(), '.whatsapp_auth');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const logger = pino({ level: 'silent' });

/**
 * Initialize WhatsApp Multi-Device Socket connection
 */
export async function initWhatsAppSocket(forceNew: boolean = false): Promise<WhatsAppSessionInfo> {
  if (forceNew && fs.existsSync(AUTH_DIR)) {
    try {
      if (sock) {
        sock.end(undefined);
        sock = null;
      }
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch (e) {
      console.warn('Error clearing auth directory:', e);
    }
  }

  if (sock && currentStatus.status === 'CONNECTED') {
    return currentStatus;
  }

  try {
    currentStatus.status = 'CONNECTING';
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1043857760] as [number, number, number] }));

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: ['Veerika Rose Garden', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 8,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          currentStatus.status = 'QR_READY';
          currentStatus.qrCodeDataUrl = qrDataUrl;
          currentStatus.qrExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();
        } catch (qrErr: any) {
          console.error('Failed to generate QR code data URL:', qrErr);
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Socket] Connection closed due to: ${lastDisconnect?.error}, should reconnect: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          currentStatus.status = 'DISCONNECTED';
          currentStatus.connectedPhone = undefined;
          currentStatus.connectedName = undefined;
          currentStatus.qrCodeDataUrl = undefined;
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            fs.mkdirSync(AUTH_DIR, { recursive: true });
          } catch {}
        } else if (shouldReconnect) {
          currentStatus.status = 'CONNECTING';
          setTimeout(() => {
            initWhatsAppSocket().catch(e => console.error('Reconnect failed:', e));
          }, 3000);
        } else {
          currentStatus.status = 'DISCONNECTED';
        }
      } else if (connection === 'open') {
        const userJid = sock?.user?.id || '';
        const rawPhone = userJid.split(':')[0] || userJid.split('@')[0] || '';
        const userName = sock?.user?.name || 'Veerika Rose Garden';

        currentStatus = {
          status: 'CONNECTED',
          connectedPhone: rawPhone,
          connectedName: userName,
          lastConnectedAt: new Date().toISOString(),
          qrCodeDataUrl: undefined,
          qrExpiresAt: undefined
        };

        console.log(`[WhatsApp Socket] ✅ Successfully connected as +${rawPhone} (${userName})`);
      }
    });

    return currentStatus;
  } catch (error: any) {
    currentStatus.status = 'DISCONNECTED';
    currentStatus.lastError = error.message;
    console.error('Failed to initialize WhatsApp socket:', error);
    return currentStatus;
  }
}

/**
 * Get current session info
 */
export function getWhatsAppSessionInfo(): WhatsAppSessionInfo {
  return currentStatus;
}

/**
 * Send WhatsApp text message directly from the linked WhatsApp device
 */
export async function sendWhatsAppFromLinkedDevice(
  recipientPhone: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!sock || currentStatus.status !== 'CONNECTED') {
      // If not connected yet, try initializing
      await initWhatsAppSocket();
      if (!sock || currentStatus.status !== 'CONNECTED') {
        return {
          success: false,
          error: 'WhatsApp device is not linked. Please scan QR in Admin > WhatsApp Automation.'
        };
      }
    }

    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const jid = `${formattedPhone}@s.whatsapp.net`;

    const result = await sock.sendMessage(jid, { text: messageText });
    return {
      success: true,
      messageId: result?.key?.id || undefined
    };
  } catch (err: any) {
    console.error(`Failed to send WhatsApp message to ${recipientPhone}:`, err);
    return {
      success: false,
      error: err.message || 'Failed to send message via linked WhatsApp device'
    };
  }
}

/**
 * Disconnect and unlink the device
 */
export async function disconnectWhatsAppDevice(): Promise<void> {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
      sock.end(undefined);
      sock = null;
    }
    currentStatus = {
      status: 'DISCONNECTED'
    };
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Error disconnecting WhatsApp:', e);
  }
}
