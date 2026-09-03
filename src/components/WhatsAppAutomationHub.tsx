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
  MessageSquare
} from 'lucide-react';
import { toast } from '../utils/toast';
import { generateOrderWhatsAppMessage } from '../utils/orderStages';

export interface WhatsAppAutomationHubProps {
  onClose?: () => void;
}

export const WhatsAppAutomationHub: React.FC<WhatsAppAutomationHubProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'meta_setup' | 'triggers' | 'logs'>('meta_setup');
  const [previewStage, setPreviewStage] = useState<'confirmed' | 'packing' | 'dispatched' | 'delivered' | null>(null);

  // Meta Cloud API State
  const [isConfigured, setIsConfigured] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');

  // 4-Stage Preferences
  const [autoSendConfirmed, setAutoSendConfirmed] = useState(true);
  const [autoSendPacking, setAutoSendPacking] = useState(true);
  const [autoSendDispatched, setAutoSendDispatched] = useState(true);
  const [autoSendDelivered, setAutoSendDelivered] = useState(true);

  // Test Message State
  const [testPhone, setTestPhone] = useState('9361540714');
  const [testMessage, setTestMessage] = useState('🌸 Hello from Veerika Rose Garden! This is a test message from your Official Meta WhatsApp Cloud API.');
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

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setIsConfigured(data.isConfigured);
        if (data.metaPhoneNumberId) setPhoneNumberId(data.metaPhoneNumberId);
        setAutoSendConfirmed(data.autoSendConfirmed ?? true);
        setAutoSendPacking(data.autoSendPacking ?? true);
        setAutoSendDispatched(data.autoSendDispatched ?? true);
        setAutoSendDelivered(data.autoSendDelivered ?? true);
      }
    } catch {}
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
  }, []);

  const handleSaveMetaSettings = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error('Please enter both Phone Number ID and Access Token', 'Missing Credentials');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'META_CLOUD',
          metaPhoneNumberId: phoneNumberId,
          metaAccessToken: accessToken,
          metaBusinessAccountId: businessAccountId,
          autoSendConfirmed,
          autoSendPacking,
          autoSendDispatched,
          autoSendDelivered
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsConfigured(true);
        toast.success('Meta WhatsApp Cloud API credentials saved!', '✅ Active');
        fetchStatus();
      } else {
        toast.error(data.error || 'Failed to save Meta settings', 'Error');
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
        toast.success(`Message delivered automatically to +91 ${testPhone} via Meta Cloud API!`, '🚀 Message Sent');
      } else {
        toast.error(data.error || 'Failed to send test message via Meta API', 'Meta API Error');
      }
    } catch {
      toast.error('Failed to dispatch test message', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

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
                <span>Official Meta WhatsApp Cloud API</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  1,000 Free Msgs/Mo
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">100% automated background sending for Confirmed, Packing, Dispatched & Delivered</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('meta_setup')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'meta_setup' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Meta API Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'triggers' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>4-Stage Triggers</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('logs');
              fetchLogs();
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Audit Log</span>
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
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Engine Status</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isConfigured
                          ? 'bg-emerald-400/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-400/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isConfigured ? '🟢 Meta Cloud API Configured' : '🟡 Enter Meta Credentials Below'}
                      </span>
                    </div>
                    <h2 className="text-base font-black text-white mt-0.5">
                      100% Automated Background WhatsApp Dispatch
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setShowTestModal(true)}
                  className="py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test</span>
                </button>
              </div>

              <p className="text-xs text-emerald-100/90 leading-relaxed">
                When you click <b>"→ Packing"</b>, <b>"Dispatched"</b>, <b>"Delivered"</b>, or <b>"Confirmed"</b> in Manage Orders, the official Meta API automatically sends the WhatsApp message straight to the customer's phone in the background.
              </p>
            </div>

            {/* Meta Credentials Form */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Meta WhatsApp Cloud API Credentials</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your free Meta Developer credentials.</p>
                </div>
                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Meta Developer Portal</span>
                </a>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Phone Number ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="e.g. 104829102938491"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Found under WhatsApp &gt; API Setup &gt; Phone number ID in Meta Developer Portal.</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    System User / Permanent Access Token <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    placeholder="EAABw..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Permanent access token from Meta Business Manager.</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp Business Account ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={e => setBusinessAccountId(e.target.value)}
                    placeholder="e.g. 192837465019283"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleSaveMetaSettings}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save & Activate Meta WhatsApp Cloud API</span>
              </button>
            </div>

            {/* Quick 3-Step Setup Guide */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs text-emerald-950">
              <h4 className="font-extrabold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>How to Get Free Meta WhatsApp Cloud API in 3 Steps:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] font-medium text-emerald-900 leading-relaxed">
                <li>Go to <b>developers.facebook.com</b> &gt; Log in &gt; Click <b>Create App</b> &gt; Select <b>Other &gt; Business</b>.</li>
                <li>Add the <b>WhatsApp</b> product to your app.</li>
                <li>Go to <b>WhatsApp &gt; API Setup</b>, copy your <b>Phone Number ID</b> and <b>Temporary or Permanent Access Token</b>, and paste them above!</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 4-STAGE TRIGGERS                                    */}
        {/* ========================================================= */}
        {activeTab === 'triggers' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>4-Stage Order Automation Toggles</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Choose which order stage changes trigger automatic WhatsApp messages to customers.
              </p>
            </div>

            {/* Stage 1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 1: Order Confirmed</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">Full Address + Plan</span>
                </div>
                <p className="text-[11px] text-slate-500">Sends 100% exact address verification, plant summary, phone, pincode & dispatch ETA.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewStage('confirmed')}
                  className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl cursor-pointer flex items-center gap-1"
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

            {/* Stage 2 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 2: Nursery Packing</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Packing Notice</span>
                </div>
                <p className="text-[11px] text-slate-500">Notifies customer that plants are being packed in protective moisture soil wrapping.</p>
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

            {/* Stage 3 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 3: Courier Dispatched</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">Tracking + Care Guide</span>
                </div>
                <p className="text-[11px] text-slate-500">Sends live Tracking Link, AWB ID, courier partner name & plant care guides.</p>
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

            {/* Stage 4 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 4: Delivered Doorstep</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">Aftercare Advice</span>
                </div>
                <p className="text-[11px] text-slate-500">Sends delivery confirmation with 7-day watering & shade care tips.</p>
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
        )}

        {/* ========================================================= */}
        {/* TAB 3: LIVE AUDIT LOGS                                     */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Meta API Dispatch Audit Log</h3>
                <p className="text-[11px] text-slate-500">Real-time delivery status of automated Meta Cloud WhatsApp messages</p>
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
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Activity className="w-8 h-8 mx-auto stroke-[1.5]" />
                <p className="text-xs font-medium">No automated messages dispatched yet in this session.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs max-h-96 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">+{log.recipientPhone}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          {log.stage}
                        </span>
                        {log.orderId && (
                          <span className="text-[10px] font-mono text-emerald-800 font-bold">#{log.orderId}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} • {new Date(log.timestamp).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
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

            <div className="bg-[#E7FFDB] p-3 rounded-2xl border border-[#bbf0a2] text-xs font-sans text-slate-900 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed shadow-inner">
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
              <h3 className="font-black text-xs text-slate-900">Send Test WhatsApp Message (Meta API)</h3>
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
                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test</span>
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
