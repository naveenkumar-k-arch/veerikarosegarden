import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, CheckCircle2, XCircle, ArrowLeft,
  Loader2, Lock, Smartphone, QrCode, CreditCard, AlertCircle
} from 'lucide-react';

interface PhonePeModalProps {
  merchantTransactionId: string;
  amount: number;
  orderId: string;
  payUrl: string;
  onSuccess: (orderId: string) => void;
  onFailure: (reason: string) => void;
  onCancel: () => void;
}

export const PhonePeModal: React.FC<PhonePeModalProps> = ({
  merchantTransactionId,
  amount,
  orderId,
  payUrl,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const [method, setMethod] = useState<'upi' | 'qr' | 'card'>('upi');
  const [upiId, setUpiId] = useState('9876543210@ybl');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err' | 'warn'; text: string } | null>(null);

  // Is this a real PhonePe pay URL (production) or sandbox?
  const isRealPayUrl = payUrl && payUrl.startsWith('http') && !payUrl.includes('/#/phonepe-gateway');

  // Auto-redirect on mount if we have a real production pay URL
  useEffect(() => {
    if (isRealPayUrl) {
      window.location.href = payUrl;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------
  //  SANDBOX: Simulate payment outcome
  // -----------------------------------------------------------
  const handleSimulate = async (status: 'SUCCESS' | 'FAILED') => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/phonepe/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantTransactionId, status }),
      });
      const data = await res.json();

      if (data.success && status === 'SUCCESS') {
        setStatusMsg({ type: 'ok', text: '✅ Payment successful! Redirecting to your order...' });
        setTimeout(() => {
          setLoading(false);
          onSuccess(data.orderId || orderId);
        }, 1000);
      } else if (data.success && status === 'FAILED') {
        setStatusMsg({ type: 'err', text: '❌ Payment failed. Your order has been cancelled.' });
        setTimeout(() => {
          setLoading(false);
          onFailure('Payment was cancelled or failed.');
        }, 1000);
      } else {
        setStatusMsg({ type: 'err', text: data.message || 'Unexpected response from gateway.' });
        setLoading(false);
      }
    } catch {
      setStatusMsg({ type: 'err', text: '⚠️ Network error. Could not connect to payment gateway.' });
      setLoading(false);
    }
  };

  // -----------------------------------------------------------
  //  PRODUCTION: Check payment status after user returns
  // -----------------------------------------------------------
  const handleVerifyStatus = async () => {
    setVerifying(true);
    setStatusMsg({ type: 'warn', text: 'Verifying payment with PhonePe...' });
    try {
      const res = await fetch(`/api/phonepe/status/${merchantTransactionId}`);
      const data = await res.json();

      if (data.code === 'PAYMENT_SUCCESS') {
        setStatusMsg({ type: 'ok', text: '✅ Payment confirmed! Redirecting...' });
        setTimeout(() => {
          setVerifying(false);
          onSuccess(orderId);
        }, 1000);
      } else if (data.code === 'PAYMENT_ERROR') {
        setStatusMsg({ type: 'err', text: '❌ Payment failed or was cancelled at PhonePe.' });
        setTimeout(() => {
          setVerifying(false);
          onFailure('Payment failed or was cancelled.');
        }, 1000);
      } else {
        setStatusMsg({
          type: 'warn',
          text: '⏳ Payment is still pending. Please complete it on PhonePe and click Verify again.',
        });
        setVerifying(false);
      }
    } catch {
      setStatusMsg({ type: 'err', text: '⚠️ Could not reach status API. Try again.' });
      setVerifying(false);
    }
  };

  const statusColors = {
    ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    err: 'bg-rose-50 text-rose-800 border-rose-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 my-6 overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-[#5f259f] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-black text-[#5f259f] text-sm select-none">
                पे
              </div>
              <div>
                <div className="font-extrabold text-sm leading-none">PhonePe</div>
                <div className="text-purple-300 text-[10px] leading-none mt-0.5">Secure Payment Gateway</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            {!isRealPayUrl && (
              <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full block mb-1 uppercase tracking-wide">
                UAT / Sandbox
              </span>
            )}
            <div className="text-purple-200 text-[10px]">VEERIKA ROSE GARDEN</div>
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-purple-50 border-b border-purple-100 px-5 py-3.5 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Txn Ref</div>
            <div className="font-mono text-xs font-bold text-purple-900 truncate max-w-[200px]">
              {merchantTransactionId}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Order #{orderId}</div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Amount</div>
            <div className="text-2xl font-black text-[#5f259f]">₹{amount.toFixed(2)}</div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4">

          {/* Security badge */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted · PCI-DSS Compliant</span>
          </div>

          {/* Status message */}
          {statusMsg && (
            <div className={`text-xs font-semibold px-4 py-3 rounded-xl text-center border ${statusColors[statusMsg.type]}`}>
              {statusMsg.text}
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              SANDBOX / UAT mode — simulate payment
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {!isRealPayUrl && (
            <>
              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Sandbox / UAT Mode Active
                </div>
                <p>PhonePe is running in test mode. Select a payment method and click the button to simulate the outcome.</p>
              </div>

              {/* Payment method selector */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'upi', label: 'BHIM UPI', Icon: Smartphone },
                    { id: 'qr', label: 'Scan QR', Icon: QrCode },
                    { id: 'card', label: 'Card / Net', Icon: CreditCard },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      method === id
                        ? 'border-[#5f259f] bg-purple-50 text-[#5f259f] ring-2 ring-purple-400/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* UPI ID input */}
              {method === 'upi' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Enter UPI / VPA ID:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@ybl"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-600">Verified</span>
                  </div>
                </div>
              )}

              {/* QR mockup */}
              {method === 'qr' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-28 h-28 bg-slate-900 mx-auto rounded-xl flex flex-col justify-between p-2 text-white text-[8px] font-mono">
                    <div className="flex justify-between"><span>■■■</span><span>■■■</span></div>
                    <div className="text-center text-purple-400 font-bold text-[10px]">PhonePe QR</div>
                    <div className="flex justify-between"><span>■■■</span><span>■■■</span></div>
                  </div>
                  <p className="text-[11px] text-slate-500">Scan with any UPI app to pay</p>
                </div>
              )}

              {/* Cards notice */}
              {method === 'card' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700">
                  <span className="font-semibold">Accepted:</span> RuPay, Visa, Mastercard · HDFC, SBI, ICICI NetBanking
                </div>
              )}

              {/* Simulate buttons */}
              <div className="pt-1 space-y-2">
                <button
                  onClick={() => handleSimulate('SUCCESS')}
                  disabled={loading || verifying}
                  className="w-full py-3.5 bg-[#5f259f] hover:bg-purple-950 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing...</span></>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 text-emerald-300" /><span>PAY ₹{amount.toFixed(2)} — SIMULATE SUCCESS</span></>
                  )}
                </button>

                <button
                  onClick={() => handleSimulate('FAILED')}
                  disabled={loading || verifying}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Simulate Failure / Cancel</span>
                </button>
              </div>
            </>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              PRODUCTION mode — redirect + verify
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {isRealPayUrl && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 space-y-1">
                <div className="font-bold">🔐 Redirecting to PhonePe...</div>
                <p>Complete your payment on the PhonePe page and return here. Then click <strong>Verify Payment</strong>.</p>
              </div>

              <button
                onClick={() => (window.location.href = payUrl)}
                className="w-full py-3.5 bg-[#5f259f] hover:bg-purple-950 text-white rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open PhonePe → PAY ₹{amount.toFixed(2)}</span>
              </button>

              <button
                onClick={handleVerifyStatus}
                disabled={verifying}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {verifying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /><span>Already Paid? Verify Payment Status</span></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            PhonePe Safe Business Guarantee
          </span>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
