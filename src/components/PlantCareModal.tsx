import React from 'react';
import { Product } from '../types';
import { X, Sun, Droplets, Sparkles, Sprout, ShieldCheck, Flower2 } from 'lucide-react';

interface PlantCareModalProps {
  product: Product | null;
  onClose: () => void;
}

export const PlantCareModal: React.FC<PlantCareModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-700/80 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Sprout className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white leading-snug">{product.name}</h3>
              <p className="text-xs text-emerald-300 font-medium">{product.tamilName}</p>
              <p className="text-[11px] text-emerald-400/80 italic mt-0.5">{product.scientificName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white bg-emerald-800/80 hover:bg-emerald-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-700 max-h-[70vh] overflow-y-auto">
          {/* Quick Care Overview Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sunlight</span>
              <span className="font-bold text-slate-800 text-[11px]">{product.sunlight}</span>
            </div>

            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Water</span>
              <span className="font-bold text-slate-800 text-[11px]">{product.waterRequirement}</span>
            </div>

            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <Flower2 className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Season</span>
              <span className="font-bold text-slate-800 text-[11px] truncate block">{product.floweringSeason}</span>
            </div>

            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <Sparkles className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pot Size</span>
              <span className="font-bold text-slate-800 text-[11px]">{product.potSize}</span>
            </div>
          </div>

          {/* Detailed Instructions */}
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-1">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                <Sun className="w-4 h-4 text-amber-600" /> Sunlight & Placement
              </h4>
              <p className="text-amber-950 leading-relaxed">{product.careInstructions.sunlight}</p>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-2xl space-y-1">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                <Droplets className="w-4 h-4 text-blue-600" /> Watering Instructions
              </h4>
              <p className="text-blue-950 leading-relaxed">{product.careInstructions.watering}</p>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-1">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                <Sprout className="w-4 h-4 text-emerald-600" /> Fertilizer & Organic Nutrition
              </h4>
              <p className="text-emerald-950 leading-relaxed">{product.careInstructions.fertilizer}</p>
            </div>

            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                🪴 Ideal Soil Mix
              </h4>
              <p className="text-stone-950 leading-relaxed">{product.careInstructions.soil}</p>
            </div>
          </div>

          {/* Farm Guarantee Note */}
          <div className="bg-emerald-900/5 p-3 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Veerika Nursery plants are shipped with moist root ball protection guaranteed to survive 7 days courier transit.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
