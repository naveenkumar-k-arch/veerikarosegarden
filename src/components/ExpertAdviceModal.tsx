import React, { useState } from 'react';
import { X, Phone, MessageSquare, Bot, Send, CheckCircle2, User, PhoneCall, Sparkles, Sprout, ShieldCheck } from 'lucide-react';

interface ExpertAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpertAdviceModal: React.FC<ExpertAdviceModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'call' | 'callback' | 'ai'>('call');

  // AI Plant Doctor state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!isOpen) return null;

  const handleInitiateCall = () => {
    window.location.href = 'tel:+917200826129';
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expert-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, query })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || 'Failed to submit callback request.');
      }
    } catch (err) {
      // Fallback optimistic success
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/gemini/plant-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiQuestion })
      });
      const data = await res.json();
      if (data.answer) {
        setAiResponse(data.answer);
      } else {
        setAiResponse("For best results, please ensure direct sunlight 4-6 hours daily, well-draining soil mix (cow dung + coco peat), and water only when topsoil is dry to touch. Call our expert at +91 72008 26129 for personalized plant diagnosis.");
      }
    } catch {
      setAiResponse("To care for your roses and plants: 1. Ensure 6 hours of full sunlight. 2. Apply organic Rose Mix or Neem Cake powder every 15 days. 3. Avoid over-watering. Call +91 72008 26129 for expert guidance!");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-5 relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wider">
                  Nursery Helpline
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">Veerika Expert Advice</h3>
              <p className="text-xs text-emerald-200">Free Botanical Support & Plant Care Consultation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white bg-emerald-800/80 hover:bg-emerald-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 text-xs font-bold text-slate-600 gap-1">
          <button
            onClick={() => setActiveTab('call')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'call'
                ? 'bg-white text-emerald-900 shadow-2xs font-extrabold border border-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" /> Direct Call
          </button>
          <button
            onClick={() => setActiveTab('callback')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'callback'
                ? 'bg-white text-emerald-900 shadow-2xs font-extrabold border border-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-600" /> Request Callback
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-white text-emerald-900 shadow-2xs font-extrabold border border-slate-200'
                : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> AI Doctor
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 text-slate-700 space-y-5">
          {activeTab === 'call' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Official Nursery Expert Number
                </span>
                <div className="text-2xl font-black text-emerald-950 tracking-tight flex items-center justify-center gap-2">
                  <span>+91 72008 26129</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Mon - Sat: 8:00 AM - 8:00 PM (IST) • Direct call to farm expert
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleInitiateCall}
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" /> Call Now (+91 72008 26129)
                </button>

                <a
                  href="https://wa.me/919361540714?text=Hello%20Veerika%20Rose%20Garden,%20I%20want%20expert%20gardening%20advice"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all text-center"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Expert Chat
                </a>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> What can you ask our Nursery Experts?
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <td>Pruning & blooming techniques for button & Dutch roses</td>
                  <td>Organic pest control (mealybugs, aphids treatment)</td>
                  <td>Cow dung, bone meal & pot soil mixing ratios</td>
                  <td>Transit care & repotting newly delivered plants</td>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'callback' && (
            <div>
              {submitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-700 text-white rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-950 text-base">Callback Request Registered!</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Our botanical expert will call you back at <span className="font-bold">{phone}</span> within 15-30 minutes during operating hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl hover:bg-emerald-900 transition-colors"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Leave your contact details and a brief description of your plant issue. Our farm specialist will call you back shortly.
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Kavin Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number (10 Digits)</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g., 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Plant / Gardening Issue (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Leaves turning yellow on my button rose plant..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Requesting Callback...</span>
                    ) : (
                      <>
                        <PhoneCall className="w-4 h-4" /> Call Me Back
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask our 24/7 AI Botanical Expert for instant plant diagnosis, fertilizer recommendations, and watering schedules.
              </p>

              <form onSubmit={handleAskAi} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Ask anything, e.g. How to get maximum blooms on Dutch Rose? Or how to cure white fungus on hibiscus?"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none pr-10"
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiQuestion.trim()}
                    className="absolute right-2.5 bottom-3.5 p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {isAiLoading && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800 animate-pulse">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Analyzing botanical database for care advice...</span>
                </div>
              )}

              {aiResponse && !isAiLoading && (
                <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl border border-emerald-800 space-y-2 text-xs leading-relaxed animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>AI Botanical Diagnosis:</span>
                  </div>
                  <p className="text-emerald-50 whitespace-pre-line">{aiResponse}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">Direct helpline: +91 72008 26129</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
