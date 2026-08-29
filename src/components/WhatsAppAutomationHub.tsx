import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Unlink,
  Settings,
  ShieldCheck,
  Smartphone,
  Check,
  X,
  Copy,
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  Activity,
  ArrowRight,
  Info
} from 'lucide-react';
import { toast } from '../utils/toast';
import { generateOrderWhatsAppMessage } from '../utils/orderStages';

export interface WhatsAppAutomationHubProps {
  onClose?: () => void;
}

interface WhatsAppStatus {
  status: 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';
  connectedPhone?: string;
  connectedName?: string;
  qrCodeDataUrl?: string;
  qrExpiresAt?: string;
  lastConnectedAt?: string;
  autoSendConfirmed: boolean;
  autoSendPacking: boolean;
  autoSendDispatched: boolean;
  autoSendDelivered: boolean;
  provider: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  orderId?: string;
  stage: string;
  recipientPhone: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

export const WhatsAppAutomationHub: React.FC<WhatsAppAutomationHubProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'DISCONNECTED',
    connectedPhone: '917200826129',
    connectedName: 'Veerika Rose Garden Official',
    autoSendConfirmed: true,
    autoSendPacking: true,
    autoSendDispatched: true,
    autoSendDelivered: true,
    provider: 'BUILTIN'
  });

  const [qrRemainingSec, setQrRemainingSec] = useState<number>(0);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('7200826129');
  const [testMessage, setTestMessage] = useState('🌸 Hello from Veerika Rose Garden! Your automated WhatsApp service is connected and active.');
  const [previewStage, setPreviewStage] = useState<'confirmed' | 'packing' | 'dispatched' | 'delivered' | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'connection' | 'triggers' | 'logs'>('connection');

  // Sample order for live template preview
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

  // Fetch live WhatsApp status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(prev => ({ ...prev, ...data }));
        if (data.qrExpiresAt) {
          const sec = Math.max(0, Math.round((new Date(data.qrExpiresAt).getTime() - Date.now()) / 1000));
          setQrRemainingSec(sec);
        }
      }
    } catch {
      // Local fallback in case of offline dev
    }
  };

  // Fetch logs
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
    const interval = setInterval(() => {
      fetchStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // QR Countdown timer
  useEffect(() => {
    if (qrRemainingSec <= 0) return;
    const t = setInterval(() => {
      setQrRemainingSec(prev => {
        if (prev <= 1) {
          setStatus(s => ({ ...s, status: 'DISCONNECTED', qrCodeDataUrl: undefined }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [qrRemainingSec]);

  // Request new QR code
  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/qr', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(prev => ({
          ...prev,
          status: 'QR_READY',
          qrCodeDataUrl: data.qrCodeDataUrl,
          qrExpiresAt: data.qrExpiresAt
        }));
        setQrRemainingSec(60);
        toast.success('Scan QR code with your WhatsApp app!', 'QR Code Ready');
      } else {
        toast.error('Failed to generate QR code. Please retry.', 'QR Error');
      }
    } catch {
      toast.error('Network error requesting QR code.', 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  // Confirm scan & link
  const handleConfirmPairing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/confirm-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: status.connectedPhone || '917200826129',
          name: 'Veerika Rose Garden Official'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(prev => ({
          ...prev,
          status: 'CONNECTED',
          connectedPhone: data.connectedPhone,
          connectedName: data.connectedName,
          qrCodeDataUrl: undefined
        }));
        toast.success('WhatsApp connected and active for all 4 stages!', '🟢 Connection Successful');
      }
    } catch {
      toast.error('Could not complete WhatsApp connection.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect session
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      if (res.ok) {
        setStatus(prev => ({
          ...prev,
          status: 'DISCONNECTED',
          qrCodeDataUrl: undefined
        }));
        setShowDisconnectModal(false);
        toast.success('WhatsApp session disconnected safely.', 'Disconnected');
      }
    } catch {
      toast.error('Failed to disconnect WhatsApp session.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle stage triggers
  const handleToggleStage = async (stageKey: keyof WhatsAppStatus) => {
    const updated = !status[stageKey];
    const newStatus = { ...status, [stageKey]: updated };
    setStatus(newStatus);

    try {
      await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoSendConfirmed: newStatus.autoSendConfirmed,
          autoSendPacking: newStatus.autoSendPacking,
          autoSendDispatched: newStatus.autoSendDispatched,
          autoSendDelivered: newStatus.autoSendDelivered
        })
      });
      toast.success('WhatsApp automation preference updated!', 'Saved');
    } catch {}
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
      if (res.ok) {
        setShowTestModal(false);
        fetchLogs();
        toast.success(`Test WhatsApp message sent to +91 ${testPhone}!`, '🚀 Delivered');
      } else {
        toast.error('Failed to dispatch test message.', 'Send Failed');
      }
    } catch {
      toast.error('Network error dispatching test message.', 'Error');
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
                <span>WhatsApp 4-Stage Automation</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  v2.4 Pro
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Automatic customer alerts for Confirmed, Packing, Dispatched & Delivered</p>
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
            onClick={() => setActiveTab('connection')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'connection'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>QR & Connection</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'triggers'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
              activeTab === 'logs'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Audit Log</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: QR CODE & CONNECTION                               */}
        {/* ========================================================= */}
        {activeTab === 'connection' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Live Connection Banner */}
            <div className={`p-4 rounded-3xl border-2 shadow-xs transition-all ${
              status.status === 'CONNECTED'
                ? 'bg-emerald-50/80 border-emerald-400'
                : status.status === 'QR_READY'
                ? 'bg-amber-50/80 border-amber-300'
                : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                    status.status === 'CONNECTED' ? 'bg-[#25D366]' : status.status === 'QR_READY' ? 'bg-amber-500' : 'bg-slate-500'
                  }`}>
                    {status.status === 'CONNECTED' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : status.status === 'QR_READY' ? (
                      <QrCode className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Unlink className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Link Status</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        status.status === 'CONNECTED'
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                          : status.status === 'QR_READY'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          status.status === 'CONNECTED' ? 'bg-emerald-600 animate-ping' : status.status === 'QR_READY' ? 'bg-amber-600' : 'bg-slate-400'
                        }`} />
                        {status.status === 'CONNECTED' ? '🟢 CONNECTED & ACTIVE' : status.status === 'QR_READY' ? '🟡 QR SCAN READY' : '🔴 DISCONNECTED'}
                      </span>
                    </div>
                    <h2 className="text-sm font-black text-slate-900 mt-0.5">
                      {status.status === 'CONNECTED'
                        ? `+${status.connectedPhone || '917200826129'} (${status.connectedName || 'Nursery Support'})`
                        : status.status === 'QR_READY'
                        ? 'Point phone camera to scan QR below'
                        : 'No WhatsApp account currently linked'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {status.status === 'CONNECTED' ? (
                    <>
                      <button
                        onClick={() => setShowTestModal(true)}
                        className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test</span>
                      </button>
                      <button
                        onClick={() => setShowDisconnectModal(true)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={loading}
                      onClick={handleGenerateQR}
                      className="py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>{status.status === 'QR_READY' ? 'Refresh QR Code' : 'Generate QR Code'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* QR Pairing Area (When QR is generated) */}
            {status.status === 'QR_READY' && status.qrCodeDataUrl && (
              <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-md space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900">Scan QR Code to Link WhatsApp</h3>
                  <p className="text-xs text-slate-500">
                    Open WhatsApp on your phone $\rightarrow$ Settings $\rightarrow$ Linked Devices $\rightarrow$ Link a Device
                  </p>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3" />
                    <span>QR expires in {qrRemainingSec} seconds</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 max-w-xs mx-auto">
                  <div className="p-3 bg-white rounded-2xl shadow-inner border border-emerald-200 relative group">
                    <img
                      src={status.qrCodeDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl pointer-events-none animate-pulse" />
                  </div>

                  <div className="w-full mt-4 space-y-2">
                    <button
                      onClick={handleConfirmPairing}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>I Scanned the QR Code (Verify & Connect)</span>
                    </button>

                    <button
                      onClick={handleGenerateQR}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate Fresh QR</span>
                    </button>
                  </div>
                </div>

                {/* 3 Step Instruction Guide */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center">1</span>
                    <h4 className="font-bold text-slate-900">Open WhatsApp</h4>
                    <p className="text-[11px] text-slate-500">Open WhatsApp on the device you want customer messages to be sent from.</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center">2</span>
                    <h4 className="font-bold text-slate-900">Go to Linked Devices</h4>
                    <p className="text-[11px] text-slate-500">Tap Settings (iOS) or 3 Dots ⋮ (Android) and choose <b>Linked Devices</b>.</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center">3</span>
                    <h4 className="font-bold text-slate-900">Scan & Connect</h4>
                    <p className="text-[11px] text-slate-500">Point your camera at this QR code. Once paired, click "I Scanned the QR Code".</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Setup Card if Disconnected */}
            {status.status === 'DISCONNECTED' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-center">
                <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-extrabold text-sm text-slate-900">Automate Customer WhatsApp Updates</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Link your nursery's WhatsApp number to instantly dispatch order confirmations, packing notices, tracking IDs, and delivery care advice without pressing send manually each time.
                  </p>
                </div>
                <button
                  disabled={loading}
                  onClick={handleGenerateQR}
                  className="py-3 px-6 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs rounded-2xl shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Generate QR Code to Link WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 4-STAGE AUTOMATION TRIGGERS                         */}
        {/* ========================================================= */}
        {activeTab === 'triggers' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>4-Stage Order Automation Toggles</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Choose which order stage transitions will automatically dispatch WhatsApp messages to the customer's phone number.
              </p>
            </div>

            {/* Stage 1: Confirmed */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 1: Order Confirmed</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                    Full Address + Plan
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sends full 100% address verification, ordered plants summary, phone, pincode & dispatch ETA.
                </p>
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
                  onClick={() => handleToggleStage('autoSendConfirmed')}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    status.autoSendConfirmed ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    status.autoSendConfirmed ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Stage 2: Packing */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 2: Nursery Packing Started</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    Packing Notice
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Notifies customer that live plants are being packed in protective moisture soil wrapping.
                </p>
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
                  onClick={() => handleToggleStage('autoSendPacking')}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    status.autoSendPacking ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    status.autoSendPacking ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Stage 3: Dispatched */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 3: Dispatched with Courier</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                    Tracking ID + Care Guide
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sends live Tracking Link, AWB ID, courier partner name & bilingual Tamil/English plant care guides.
                </p>
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
                  onClick={() => handleToggleStage('autoSendDispatched')}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    status.autoSendDispatched ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    status.autoSendDispatched ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Stage 4: Delivered */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 font-black text-xs flex items-center justify-center">4</span>
                  <h4 className="font-extrabold text-xs text-slate-900">Stage 4: Delivered to Doorstep</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                    Aftercare Tips
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sends delivery confirmation with 7-day mild shade care advice & helpline contact.
                </p>
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
                  onClick={() => handleToggleStage('autoSendDelivered')}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    status.autoSendDelivered ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    status.autoSendDelivered ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LIVE AUDIT LOG                                      */}
        {/* ========================================================= */}
        {activeTab === 'logs' && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Automated Dispatch Audit Log</h3>
                <p className="text-[11px] text-slate-500">Real-time record of all WhatsApp alerts triggered by order stage changes</p>
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
                          <span className="text-[10px] font-mono text-emerald-800 font-bold">
                            #{log.orderId}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} • {new Date(log.timestamp).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3" />
                      <span>Delivered</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: MESSAGE TEMPLATE PREVIEW                           */}
      {/* ========================================================= */}
      {previewStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-xs text-slate-900 uppercase">
                Stage Template: {previewStage}
              </h3>
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

      {/* ========================================================= */}
      {/* MODAL: SEND TEST MESSAGE                                  */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* MODAL: CONFIRM DISCONNECT                                 */}
      {/* ========================================================= */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900">Disconnect WhatsApp?</h3>
              <p className="text-xs text-slate-500">
                Automated messages will be paused until you scan and reconnect again. You can still use manual WhatsApp links.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={loading}
                onClick={handleDisconnect}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Disconnect
              </button>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Keep Connected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
