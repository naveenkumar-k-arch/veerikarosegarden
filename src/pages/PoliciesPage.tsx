import React, { useState } from 'react';
import { ShieldCheck, Truck, RefreshCw, Lock, HelpCircle, FileText } from 'lucide-react';

interface PoliciesPageProps {
  initialTab?: string;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ initialTab = 'shipping' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Policy Page Header */}
      <div className="bg-emerald-900 text-white p-6 sm:p-8 rounded-3xl space-y-2 shadow-md">
        <h1 className="text-2xl sm:text-3xl font-black">Nursery Policies & Customer Terms</h1>
        <p className="text-xs sm:text-sm text-emerald-200">
          Veerika Rose Garden is committed to transparent business policies, PhonePe PG payment security, and safe plant transit across India.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2.5 rounded-t-xl transition-colors ${
            activeTab === 'shipping' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Shipping & Village Delivery
        </button>

        <button
          onClick={() => setActiveTab('refund')}
          className={`px-4 py-2.5 rounded-t-xl transition-colors ${
            activeTab === 'refund' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Plant Returns & PhonePe Refunds
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2.5 rounded-t-xl transition-colors ${
            activeTab === 'privacy' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Privacy Policy
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2.5 rounded-t-xl transition-colors ${
            activeTab === 'terms' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Terms & Conditions
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2.5 rounded-t-xl transition-colors ${
            activeTab === 'faqs' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Plant Care FAQs
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs text-xs text-slate-700 leading-relaxed space-y-4">
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-700" /> Village & City Shipping Policy
            </h3>
            <p>
              At Veerika Rose Garden, we specialize in delivering fresh, healthy live plants directly from our Hosur & Madurai nurseries to rural villages, towns, and metro cities across India.
            </p>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
              <h4 className="font-bold text-slate-900">1. Root Ball Moisture Protection Packaging</h4>
              <p>Every plant is pruned, treated with bio-fungicide, and wrapped in water-retaining coco peat & moss. Root balls remain moist for up to 7 full days of courier transit.</p>

              <h4 className="font-bold text-slate-900 pt-2">2. Delivery Timeframes</h4>
              <p>• Major Cities & Towns (Coimbatore, Chennai, Madurai, Bangalore, Trichy): 24 to 48 Hours.</p>
              <p>• Village & Rural Locations: 2 to 4 Days via ST Courier or India Post Speed Post.</p>

              <h4 className="font-bold text-slate-900 pt-2">3. Shipping Charges</h4>
              <p>• <strong>Tamil Nadu:</strong> ₹60 base delivery charge (+₹20 per additional plant).</p>
              <p>• <strong>Karnataka, Kerala, Andhra Pradesh & Puducherry:</strong> ₹100 base delivery charge (+₹20 per additional plant).</p>
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-700" /> Plant Replacement & PhonePe Refund Policy
            </h3>
            <p>
              We guarantee 100% live arrival for all plants shipped from our nursery.
            </p>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
              <h4 className="font-bold text-slate-900">1. Transit Damage Guarantee</h4>
              <p>If a plant arrives broken, completely dried, or damaged during transit, notify us on WhatsApp (+91 72008 26129) within 24 hours with an unboxing photo or video.</p>

              <h4 className="font-bold text-slate-900 pt-2">2. Replacement or PhonePe Refund</h4>
              <p>• Option A: Free replacement sapling shipped immediately.</p>
              <p>• Option B: 100% direct refund credited back to your original PhonePe UPI / Card account within 3 to 5 business days.</p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-700" /> Privacy & Data Security Policy
            </h3>
            <p>
              Veerika Rose Garden respects customer privacy. We collect phone numbers, delivery addresses, and names strictly to process plant orders and courier dispatch.
            </p>
            <p>
              We do not store complete payment credentials on our servers. All transaction processing is securely handled by <strong>PhonePe Payment Gateway PG</strong> via 256-bit SSL encryption.
            </p>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" /> Terms & Conditions of Sale
            </h3>
            <p>
              1. Plant photos on website depict mature flowering states; saplings shipped are healthy 1 to 2 feet nursery grow-bag plants ready for planting.
            </p>
            <p>
              2. Prices listed include all applicable GST taxes.
            </p>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-700" /> Frequently Asked Plant Care Questions
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900">Q: What should I do immediately after receiving my plant package?</h4>
                <p className="text-slate-600 mt-1">A: Open the box gently, keep the plant in shade for 2 days, and water thoroughly. Do not place in direct harsh afternoon sun on Day 1.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900">Q: When can I transplant the sapling into a bigger pot or ground?</h4>
                <p className="text-slate-600 mt-1">A: After 3-4 days of shade acclimatization, repot into red soil mixed with 30% organic vermicompost.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
