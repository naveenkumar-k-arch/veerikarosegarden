import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
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
  LogOut,
  Zap,
  Radio
} from 'lucide-react';
import { toast } from '../utils/toast';
import { generateOrderWhatsAppMessage } from '../utils/orderStages';

export interface WhatsAppAutomationHubProps {
  onClose?: () => void;
}

export const WhatsAppAutomationHub: React.FC<WhatsAppAutomationHubProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr_pair' | 'triggers' | 'logs'>('qr_pair');
  const [previewStage, setPreviewStage] = useState<'confirmed' | 'packing' | 'dispatched' | 'delivered' | null>(null);

  // Connection State
  const [status, setStatus] = useState<'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  // Preferences
  const [autoSendConfirmed, setAutoSendConfirmed] = useState(true);
  const [autoSendPacking, setAutoSendPacking] = useState(true);
  const [autoSendDispatched, setAutoSendDispatched] = useState(true);
  const [autoSendDelivered, setAutoSendDelivered] = useState(true);
  const [autoOpenWhatsAppWeb, setAutoOpenWhatsAppWeb] = useState(false);

  // Test Message
  const [testPhone, setTestPhone] = useState('7200826129');
  const [testMessage, setTestMessage] = useState('🌸 Hello from Veerika Rose Garden! This is a real test message sent directly from our linked WhatsApp account.');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const pollTimerRef = useRef<any>(null);

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
        setStatus(data.status);
        setConnectedPhone(data.connectedPhone || null);
        setConnectedName(data.connectedName || null);
        if (data.qrCodeDataUrl) {
          setQrCodeDataUrl(data.qrCodeDataUrl);
        }
        if (data.autoSendConfirmed !== undefined) setAutoSendConfirmed(data.autoSendConfirmed);
        if (data.autoSendPacking !== undefined) setAutoSendPacking(data.autoSendPacking);
        if (data.autoSendDispatched !== undefined) setAutoSendDispatched(data.autoSendDispatched);
        if (data.autoSendDelivered !== undefined) setAutoSendDelivered(data.autoSendDelivered);
        if (data.autoOpenWhatsAppWeb !== undefined) setAutoOpenWhatsAppWeb(data.autoOpenWhatsAppWeb);
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

  // Poll status while connecting or waiting for scan
  useEffect(() => {
    fetchStatus();
    fetchLogs();

    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Request fresh real QR Code
  const handleGenerateQr = async () => {
    setLoading(true);
    setCountdown(60);
    try {
      const res = await fetch('/api/whatsapp/qr', { method: 'POST' });
      const data = await res.json();
      if (data.qrCodeDataUrl) {
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setStatus('QR_READY');
        toast.success('Live WhatsApp Web QR code generated! Scan in WhatsApp app.', 'QR Code Ready');
      } else {
        toast.info('Connecting to WhatsApp socket... please wait 2 seconds and refresh.', 'Connecting');
      }
    } catch (e) {
      toast.error('Failed to generate WhatsApp QR code', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect & Unlink
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      if (res.ok) {
        setStatus('DISCONNECTED');
        setConnectedPhone(null);
        setConnectedName(null);
        setQrCodeDataUrl(null);
        setShowDisconnectModal(false);
        toast.success('WhatsApp device unlinked successfully!', 'Unlinked');
      }
    } catch {
      toast.error('Failed to unlink WhatsApp device', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoSendConfirmed,
          autoSendPacking,
          autoSendDispatched,
          autoSendDelivered,
          autoOpenWhatsAppWeb
        })
      });
      if (res.ok) {
        toast.success('WhatsApp automation preferences saved!', 'Saved');
      }
    } catch {
      toast.error('Network error saving settings', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Send Test Message
  const handleSendTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error('Please enter phone and message text', 'Missing Info');
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
        toast.success(`Message sent directly from your linked WhatsApp to +91 ${testPhone}!`, '✅ Message Sent');
      } else {
        toast.error(data.error || 'Failed to send message via linked WhatsApp', 'Delivery Failed');
      }
    } catch {
      toast.error('Failed to dispatch message', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>WhatsApp Multi-Device Link</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  status === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : status === 'QR_READY'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {status === 'CONNECTED' ? '🟢 Linked & Ready' : status === 'QR_READY' ? '🟡 QR Ready to Scan' : '⚪ Not Linked'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Link your phone's WhatsApp to send automated order stage messages</p>
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
        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('qr_pair')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'qr_pair' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Device Link (QR)</span>
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
        {/* TAB 1: DEVICE LINK (QR CODE)                              */}
        {/* ========================================================= */}
        {activeTab === 'qr_pair' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Status Card */}
            {status === 'CONNECTED' ? (
              <div className="p-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white rounded-3xl shadow-md space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Device Status</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-500/40">
                          Active Companion Device
                        </span>
                      </div>
                      <h2 className="text-base font-black text-white mt-0.5">
                        +{connectedPhone || 'Linked WhatsApp'}
                      </h2>
                      <p className="text-xs text-emerald-200/80">{connectedName || 'Veerika Rose Garden Support'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDisconnectModal(true)}
                    className="py-2 px-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Unlink Device</span>
                  </button>
                </div>

                <div className="p-3 bg-emerald-900/60 rounded-2xl border border-emerald-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-emerald-100">
                    <Radio className="w-4 h-4 text-[#25D366] animate-pulse" />
                    <span>All order stage updates are sent directly from this phone number in the background!</span>
                  </div>

                  <button
                    onClick={() => setShowTestModal(true)}
                    className="py-1.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-slate-900">Link WhatsApp Account</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Scan this QR code using your WhatsApp mobile app to link your WhatsApp number as a companion device.
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  {qrCodeDataUrl ? (
                    <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                      <img
                        src={qrCodeDataUrl}
                        alt="WhatsApp Pairing QR Code"
                        className="w-64 h-64 object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <QrCode className="w-12 h-12 text-slate-400 stroke-[1.5]" />
                      <p className="text-xs text-slate-500 font-medium">
                        Click the button below to generate a live WhatsApp pairing QR code.
                      </p>
                    </div>
                  )}

                  <button
                    disabled={loading}
                    onClick={handleGenerateQr}
                    className="py-3 px-6 bg-[#25D366] hover:bg-[#1EBE5D] disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    <span>{qrCodeDataUrl ? 'Regenerate Live QR Code' : 'Generate WhatsApp QR Code'}</span>
                  </button>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs text-emerald-950">
                  <h4 className="font-extrabold flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>How to Link in 3 Steps:</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] font-medium text-emerald-900 leading-relaxed">
                    <li>Open <b>WhatsApp</b> on your phone.</li>
                    <li>Tap <b>Settings (or 3 dots Menu) &gt; Linked Devices &gt; Link a Device</b>.</li>
                    <li>Point your phone's camera at the QR code above. It will link instantly!</li>
                  </ol>
                </div>
              </div>
            )}
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
                When you move an order between stages in <b>Manage Orders</b>, WhatsApp messages will be sent automatically from your linked device.
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

            <button
              disabled={loading}
              onClick={handleSaveSettings}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Trigger Preferences</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LIVE AUDIT LOGS                                     */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Automated Dispatch Audit Log</h3>
                <p className="text-[11px] text-slate-500">Real-time record of messages sent from your linked WhatsApp</p>
              </div>
              <button
                onClick={fetchLogs}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Log</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Activity className="w-8 h-8 mx-auto stroke-[1.5]" />
                <p className="text-xs font-medium">No automated WhatsApp messages dispatched yet in this session.</p>
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

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-3">
            <h3 className="font-black text-sm text-slate-900">Unlink WhatsApp Account?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to unlink +{connectedPhone}? Automated order stage messages will stop sending until you scan a new QR code.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={loading}
                onClick={handleDisconnect}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Yes, Unlink
              </button>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
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
              <h3 className="font-black text-xs text-slate-900">Send Test via Linked WhatsApp</h3>
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
                  placeholder="e.g. 7200826129"
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
