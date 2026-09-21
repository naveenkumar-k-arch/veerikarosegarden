import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Check,
  X,
  Copy,
  Sparkles,
  Eye,
  Activity,
  Globe,
  Key,
  ExternalLink,
  Zap,
  Lock,
  MessageSquare,
  QrCode,
  Unlink,
  Radio,
  FileText
} from 'lucide-react';
import { toast } from '../utils/toast';
import { generateOrderWhatsAppMessage } from '../utils/orderStages';

export interface WhatsAppAutomationHubProps {
  onClose?: () => void;
}

export const WhatsAppAutomationHub: React.FC<WhatsAppAutomationHubProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr_link' | 'meta_setup' | 'triggers' | 'logs'>('meta_setup');
  const [previewStage, setPreviewStage] = useState<'confirmed' | 'packing' | 'dispatched' | 'delivered' | null>(null);

  // Provider & Status State
  const [provider, setProvider] = useState<'AUTO' | 'META_CLOUD' | 'LINKED_DEVICE'>('AUTO');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string | undefined>();
  const [connectedName, setConnectedName] = useState<string | undefined>();

  // Meta Cloud API State
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [templateName, setTemplateName] = useState('order_confirmation');
  const [verifyToken, setVerifyToken] = useState('vrg_meta_wa_secret_2026');

  // Baileys QR Code Session
  const [qrSession, setQrSession] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // 4-Stage Preferences
  const [autoSendConfirmed, setAutoSendConfirmed] = useState(true);
  const [autoSendPacking, setAutoSendPacking] = useState(true);
  const [autoSendDispatched, setAutoSendDispatched] = useState(true);
  const [autoSendDelivered, setAutoSendDelivered] = useState(true);

  // Test Message State
  const [testPhone, setTestPhone] = useState('9361540714');
  const [testMessage, setTestMessage] = useState('🌸 Hello from Veerika Rose Garden! This is a test message from your WhatsApp Automation Engine.');
  const [showTestModal, setShowTestModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const sampleOrder = {
    id: 'ORD-1218',
    customerName: 'Vijay',
    customerPhone: '7708452728',
    shippingAddress: {
      fullName: 'Vijay',
      phone: '7708452728',
      houseNo: 'No 754',
      street: 'Melakulam melur, PALAYAMKOTTAI',
      villageTown: 'Melakulam',
      district: 'TIRUNELVELI',
      state: 'Tamil Nadu',
      pincode: '627351',
      landmark: 'Near melur melakulam water tank'
    },
    items: [
      { name: '🌱🍎 WATER APPLE – 3 VARIETY COMBO', quantity: 1, price: 300 }
    ],
    orderStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    serviceType: 'Full Soil Delivery',
    courierName: 'Professional Courier',
    trackingNumber: 'PC987654321IN'
  };

  const metaTemplateSample = `🌸 *VEERIKA ROSE GARDEN* 🌸
*ORDER CONFIRMATION*

Customer Name: {{1}}
Order Reference: #{{2}}
Address: {{3}}
Plan: {{4}}
Service Type: {{5}}

Please confirm your Address, Plan & Service Type:
👉 Reply *YES* to confirm
👉 Reply *NO* if you need changes

✅ Your order has been confirmed!
📦 Dispatched within 5–7 days. Delivery within 2 days after dispatch.
📍 Tracking ID will be shared once dispatched.

Thank you for your order! ❤️`;

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(data.isConfigured);
        setProvider(data.provider || 'AUTO');
        setIsDeviceConnected(data.isDeviceConnected || false);
        setConnectedPhone(data.connectedPhone);
        setConnectedName(data.connectedName);
        if (data.metaPhoneNumberId) setPhoneNumberId(data.metaPhoneNumberId);
        if (data.metaWaTemplateName) setTemplateName(data.metaWaTemplateName);
        if (data.metaWaVerifyToken) setVerifyToken(data.metaWaVerifyToken);
        setAutoSendConfirmed(data.autoSendConfirmed ?? true);
        setAutoSendPacking(data.autoSendPacking ?? true);
        setAutoSendDispatched(data.autoSendDispatched ?? true);
        setAutoSendDelivered(data.autoSendDelivered ?? true);
      }
    } catch {}
  };

  const fetchQrSession = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      if (res.ok) {
        const data = await res.json();
        setQrSession(data.session);
        if (data.session?.status === 'CONNECTED') {
          setIsDeviceConnected(true);
          setConnectedPhone(data.session.connectedPhone);
          setConnectedName(data.session.connectedName);
        }
      }
    } catch {}
  };

  const handleRefreshQr = async () => {
    setQrLoading(true);
    try {
      const res = await fetch('/api/whatsapp/qr/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.session) setQrSession(data.session);
      toast.success('Generated fresh WhatsApp QR code. Scan with your phone.', 'QR Refreshed');
    } catch {
      toast.error('Failed to refresh QR code', 'Error');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDisconnectDevice = async () => {
    if (!confirm('Are you sure you want to unlink this WhatsApp device?')) return;
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      setQrSession({ status: 'DISCONNECTED' });
      setIsDeviceConnected(false);
      setConnectedPhone(undefined);
      setConnectedName(undefined);
      toast.success('WhatsApp device unlinked successfully', 'Disconnected');
      fetchStatus();
    } catch {
      toast.error('Failed to unlink device', 'Error');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchQrSession();
  }, []);

  // Poll for QR updates while viewing the QR link tab
  useEffect(() => {
    if (activeTab !== 'qr_link' || isDeviceConnected) return;
    const timer = setInterval(() => {
      fetchQrSession();
    }, 4000);
    return () => clearInterval(timer);
  }, [activeTab, isDeviceConnected]);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          metaPhoneNumberId: phoneNumberId,
          metaAccessToken: accessToken,
          metaBusinessAccountId: businessAccountId,
          metaWaTemplateName: templateName,
          metaWaVerifyToken: verifyToken,
          autoSendConfirmed,
          autoSendPacking,
          autoSendDispatched,
          autoSendDelivered
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('WhatsApp automation settings saved permanently!', '✅ Saved');
        fetchStatus();
      } else {
        toast.error(data.error || 'Failed to save settings', 'Error');
      }
    } catch {
      toast.error('Network error saving settings', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error('Please enter recipient phone number', 'Missing Info');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
          stage: 'TEST_ALERT'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowTestModal(false);
        fetchLogs();
        toast.success(`Message sent to +91 ${testPhone} via ${data.provider}!`, '🚀 Delivered');
      } else {
        toast.error(data.error || 'Failed to send test message', 'Dispatch Error');
      }
    } catch {
      toast.error('Failed to dispatch test message', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, title: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(text, title);
  };

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.vrgnursery.in'}/api/whatsapp/webhook`;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Meta WhatsApp Cloud API & Automation</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isConfigured || isDeviceConnected
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {isConfigured ? '🟢 Meta Cloud API Ready' : isDeviceConnected ? '🟢 QR Linked' : '🟡 Setup Required'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Automatic background WhatsApp notification when orders are placed & confirmed</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTestModal(true)}
              className="py-1.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test Send</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('meta_setup')}
            className={`py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'meta_setup' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Meta API Setup</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('qr_link');
              fetchQrSession();
            }}
            className={`py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'qr_link' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#25D366]" />
            <span>QR Device Link</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'triggers' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Stages & Toggles</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            className={`py-2 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'logs' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Logs ({logs.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: META CLOUD API SETUP                                */}
        {/* ========================================================= */}
        {activeTab === 'meta_setup' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Status Hero Card */}
            <div className="p-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white rounded-3xl shadow-md space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Official Meta Engine</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        phoneNumberId && accessToken
                          ? 'bg-emerald-400/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-400/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {phoneNumberId && accessToken ? '🟢 Meta Cloud API Configured' : '🟡 Enter Meta Credentials Below'}
                      </span>
                    </div>
                    <h2 className="text-base font-black text-white mt-0.5">
                      Official Meta WhatsApp Cloud API
                    </h2>
                  </div>
                </div>

                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Meta Portal</span>
                </a>
              </div>

              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Directly hosted by Meta. Automatically delivers Order Confirmation messages to customers on mobile. 1,000 free conversations included every month.
              </p>
            </div>

            {/* Meta Credentials Form */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">1. Meta Cloud API Credentials</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter credentials from your Meta Developer App (WhatsApp → API Setup).</p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number ID (from Meta API Setup)</label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 109876543210987"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Permanent Access Token (System User Token: EAAG...)</label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    placeholder="Paste permanent System User token from Meta Business Manager"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Template Name (Meta Approved)</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                      placeholder="e.g. order_confirmation"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Business Account ID (Optional)</label>
                    <input
                      type="text"
                      value={businessAccountId}
                      onChange={e => setBusinessAccountId(e.target.value)}
                      placeholder="e.g. 102345678901234"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  disabled={loading}
                  onClick={handleSaveSettings}
                  className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{loading ? 'Saving...' : 'Save Meta API Settings'}</span>
                </button>

                <button
                  onClick={() => setShowTestModal(true)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send Test Message</span>
                </button>
              </div>
            </div>

            {/* Meta Webhook Details Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>2. Meta Webhook Configuration</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      Auto-Receives Customer "YES"
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure in Meta App Dashboard → WhatsApp → Configuration → Webhook</p>
                </div>
                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noreferrer"
                  className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Configure in Meta</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Callback URL</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 truncate text-[11px]">{webhookUrl}</span>
                    <button
                      onClick={() => copyToClipboard(webhookUrl, 'Webhook URL Copied')}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Verify Token</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 truncate text-[11px]">{verifyToken}</span>
                    <button
                      onClick={() => copyToClipboard(verifyToken, 'Verify Token Copied')}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                      title="Copy Token"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-blue-900">
                💡 <b>Customer Two-Way Automation</b>: When a customer receives their order confirmation on WhatsApp and replies <b>"YES"</b>, Meta sends a webhook to this URL, and the server automatically marks their address & plant variety as <b>Verified</b> on your Admin Orders screen!
              </p>
            </div>

            {/* Meta Template Guide Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">3. Meta WhatsApp Template Setup Guide</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Create this template once in Meta Business Manager to enable 24/7 automated delivery.</p>
                </div>
                <button
                  onClick={() => copyToClipboard(metaTemplateSample, 'Template Body Copied!')}
                  className="py-1.5 px-3 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Template Body</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-extrabold text-slate-900">UTILITY</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Template Name</span>
                  <span className="font-extrabold font-mono text-emerald-800">order_confirmation</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Language</span>
                  <span className="font-extrabold text-slate-900">English (en)</span>
                </div>
              </div>

              <div className="p-3 bg-[#E7FFDB] rounded-2xl border border-[#bbf0a2] text-xs font-mono text-slate-900 whitespace-pre-wrap leading-relaxed shadow-inner">
                {metaTemplateSample}
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <span className="font-bold block text-slate-700">Template Dynamic Parameters:</span>
                <p>• <b>{'{{1}}'}</b>: Customer Full Name</p>
                <p>• <b>{'{{2}}'}</b>: Order Reference Number (e.g. 1418)</p>
                <p>• <b>{'{{3}}'}</b>: Delivery Address & Pincode</p>
                <p>• <b>{'{{4}}'}</b>: Plant Varieties & Quantities (e.g. Damask Rose x 2)</p>
                <p>• <b>{'{{5}}'}</b>: Service Type (e.g. Full Soil Delivery)</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BAILEYS MULTI-DEVICE QR CODE LINK                   */}
        {/* ========================================================= */}
        {activeTab === 'qr_link' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Status Card */}
            <div className={`p-5 rounded-3xl text-white shadow-md space-y-3 ${
              isDeviceConnected
                ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950'
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Direct WhatsApp Phone Link</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isDeviceConnected
                          ? 'bg-emerald-400/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-400/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isDeviceConnected ? '🟢 Connected & Ready' : '🟡 Scan QR Code Below'}
                      </span>
                    </div>
                    <h2 className="text-base font-black text-white mt-0.5">
                      {isDeviceConnected
                        ? `Linked as +${connectedPhone || 'Nursery WA'} (${connectedName || 'Veerika Rose Garden'})`
                        : 'Link Nursery WhatsApp via QR Code'}
                    </h2>
                  </div>
                </div>

                {isDeviceConnected && (
                  <button
                    onClick={handleDisconnectDevice}
                    className="py-1.5 px-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Link your phone directly. If Meta Cloud API is not yet configured, messages are automatically sent via your scanned phone!
              </p>
            </div>

            {/* QR Code Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 text-center">
              {isDeviceConnected ? (
                <div className="py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">WhatsApp Device Linked Successfully!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your WhatsApp number <b>+{connectedPhone}</b> is actively connected.
                  </p>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      onClick={() => setShowTestModal(true)}
                      className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Message</span>
                    </button>
                    <button
                      onClick={handleDisconnectDevice}
                      className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Unlink Device
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Scan QR Code to Link WhatsApp</h3>
                    <p className="text-xs text-slate-500 mt-1">Open WhatsApp on your phone → Settings / 3-dots → <b>Linked Devices</b> → <b>Link a Device</b></p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block">
                    {qrSession?.qrCodeDataUrl ? (
                      <img
                        src={qrSession.qrCodeDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 mx-auto rounded-xl shadow-sm"
                      />
                    ) : (
                      <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <RefreshCw className={`w-8 h-8 ${qrLoading ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-medium">Generating QR code...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      disabled={qrLoading}
                      onClick={handleRefreshQr}
                      className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                      <span>{qrLoading ? 'Refreshing...' : 'Refresh QR Code'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STAGES & AUTOMATION TOGGLES                         */}
        {/* ========================================================= */}
        {activeTab === 'triggers' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Preferred Provider Selection */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900">Delivery Provider Mode</h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setProvider('AUTO')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    provider === 'AUTO'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className="font-black block text-xs">⚡ AUTO (Recommended)</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Uses Meta Cloud API if available, falls back to Linked Device.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('META_CLOUD')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    provider === 'META_CLOUD'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className="font-black block text-xs">☁️ Meta Cloud API</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Uses Official Meta Cloud API with approved template.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('LINKED_DEVICE')}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    provider === 'LINKED_DEVICE'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className="font-black block text-xs">📲 Linked Device</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Sends directly from your scanned WhatsApp phone number.</span>
                </button>
              </div>
            </div>

            {/* Stages Toggles */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">4-Stage Automated Triggers</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle auto-send on or off for each order stage.</p>
              </div>

              <div className="space-y-3">
                {/* Stage 1: Order Confirmed */}
                <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 shadow-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-200 text-emerald-900 font-black text-xs flex items-center justify-center">1</span>
                      <h4 className="font-extrabold text-xs text-emerald-950">Stage 1: Order Confirmed (New Order)</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">⚡ AUTO-TRIGGER</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80">Dispatches confirmation asking customer to confirm Address, Plant Plan & Service Type immediately when order is placed.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewStage('confirmed')}
                      className="py-1.5 px-2.5 bg-white text-emerald-900 text-[11px] font-bold rounded-xl border border-emerald-300 cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setAutoSendConfirmed(!autoSendConfirmed)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        autoSendConfirmed ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        autoSendConfirmed ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Stage 2: Nursery Packing */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">2</span>
                      <h4 className="font-extrabold text-xs text-slate-900">Stage 2: Nursery Packing</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">Notifies customer when plants are being prepared and packed with soil moisture wrap.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewStage('packing')}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setAutoSendPacking(!autoSendPacking)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        autoSendPacking ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        autoSendPacking ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Stage 3: Courier Dispatched */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">3</span>
                      <h4 className="font-extrabold text-xs text-slate-900">Stage 3: Courier Dispatched</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">Sends live tracking link, AWB number, and delivery partner name.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewStage('dispatched')}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setAutoSendDispatched(!autoSendDispatched)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        autoSendDispatched ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        autoSendDispatched ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Stage 4: Delivered Doorstep */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 font-black text-xs flex items-center justify-center">4</span>
                      <h4 className="font-extrabold text-xs text-slate-900">Stage 4: Delivered Doorstep</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">Sends delivery confirmation along with plant care & watering instructions.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewStage('delivered')}
                      className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setAutoSendDelivered(!autoSendDelivered)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        autoSendDelivered ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        autoSendDelivered ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={loading}
                  onClick={handleSaveSettings}
                  className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: LIVE DISPATCH AUDIT LOGS                            */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live WhatsApp Dispatch Audit Log</h3>
                <p className="text-[11px] text-slate-500">Real-time status of all automated background WhatsApp dispatches</p>
              </div>
              <button
                onClick={fetchLogs}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <Activity className="w-10 h-10 mx-auto stroke-[1.5] text-slate-300" />
                <p className="text-xs font-medium">No messages dispatched yet in this session.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">+{log.recipientPhone}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 uppercase">
                          {log.stage}
                        </span>
                        {log.orderId && (
                          <span className="text-[10px] font-mono text-emerald-800 font-bold">#{log.orderId}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">({log.provider})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} • {new Date(log.timestamp).toLocaleDateString('en-IN')}
                        {log.error && <span className="text-rose-500 block mt-0.5">⚠️ {log.error}</span>}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      log.status === 'SUCCESS'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border-rose-200'
                    }`}>
                      {log.status === 'SUCCESS' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{log.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-xs text-slate-900 uppercase">Stage Template: {previewStage}</h3>
              <button onClick={() => setPreviewStage(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#E7FFDB] p-3 rounded-2xl border border-[#bbf0a2] text-xs font-sans text-slate-900 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed shadow-inner">
              {generateOrderWhatsAppMessage(sampleOrder as any, previewStage)}
            </div>

            <button
              onClick={() => setPreviewStage(null)}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Send Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-xs text-slate-900">Send Test WhatsApp Message</h3>
              <button onClick={() => setShowTestModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block">Recipient Phone Number (10 digits)</label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="e.g. 9361540714"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Message Text</label>
                <textarea
                  rows={4}
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={loading}
                onClick={handleSendTestMessage}
                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send Test'}</span>
              </button>
              <button
                onClick={() => setShowTestModal(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
