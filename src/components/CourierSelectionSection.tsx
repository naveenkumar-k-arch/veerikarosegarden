import React, { useState, useEffect } from 'react';
import { Truck, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  METTUR_PARCEL_COVERAGE,
  getMetturStateCoverage,
  isMetturServiceAvailable,
  getBranchesForDistrict
} from '../utils/courierLocations';

export type CourierPartnerType = 'PROFESSIONAL_COURIER' | 'METTUR_PARCEL';

export interface CourierSelectionSectionProps {
  selectedCourier: CourierPartnerType;
  onChangeCourier: (courier: CourierPartnerType) => void;
  shippingState: string;
  shippingDistrict: string;
  metturState: string;
  onChangeMetturState: (state: string) => void;
  metturDistrict: string;
  onChangeMetturDistrict: (dist: string) => void;
  metturBranch: string;
  onChangeMetturBranch: (branch: string) => void;
  totalPlantCount: number;
  deliveryOption?: 'REDUCED_SOIL' | 'FULL_SOIL_6INCH' | 'FULL_SOIL_8INCH' | 'FULL_SOIL' | 'METTUR_PARCEL';
  onChangeDeliveryOption?: (opt: 'REDUCED_SOIL' | 'FULL_SOIL_6INCH' | 'FULL_SOIL_8INCH' | 'FULL_SOIL' | 'METTUR_PARCEL') => void;
  hasFreeDelivery?: boolean;
  className?: string;
}

export const CourierSelectionSection: React.FC<CourierSelectionSectionProps> = ({
  selectedCourier,
  onChangeCourier,
  shippingState,
  shippingDistrict,
  metturState,
  onChangeMetturState,
  metturDistrict,
  onChangeMetturDistrict,
  metturBranch,
  onChangeMetturBranch,
  totalPlantCount,
  deliveryOption = 'REDUCED_SOIL',
  onChangeDeliveryOption,
  hasFreeDelivery = false,
  className = ''
}) => {
  // Sync state & district from address when available
  useEffect(() => {
    if (shippingState && !metturState) {
      onChangeMetturState(shippingState);
    }
  }, [shippingState, metturState, onChangeMetturState]);

  const activeStateDistricts = getMetturStateCoverage(metturState || shippingState || 'Tamil Nadu');
  const isAvailable = isMetturServiceAvailable(metturState || shippingState, metturDistrict || shippingDistrict);
  const branches = getBranchesForDistrict(metturState || shippingState, metturDistrict || shippingDistrict);

  // Reset branch if current selection is invalid for district
  useEffect(() => {
    if (branches.length > 0 && metturBranch) {
      const exists = branches.some(b => b.name === metturBranch);
      if (!exists) {
        onChangeMetturBranch('');
      }
    }
  }, [branches, metturBranch, onChangeMetturBranch]);

  const inTN = shippingState ? (shippingState.toLowerCase().includes('tamil') || shippingState.toLowerCase() === 'tn') : true;
  const isFullSoilAllowed = inTN;
  const isMetturAllowed = totalPlantCount >= 3;

  const reducedSoilCharge = (inTN ? 60 : 100) + Math.max(0, totalPlantCount - 1) * 20;
  const fullSoil6InchCharge = totalPlantCount * 140;
  const fullSoil8InchCharge = totalPlantCount * 190;
  const metturParcelCharge = Math.ceil(Math.max(1, totalPlantCount) / 6) * 60;

  // Auto fallback if Full Soil or Mettur become invalid
  useEffect(() => {
    const isFullSoil = deliveryOption === 'FULL_SOIL_6INCH' || deliveryOption === 'FULL_SOIL_8INCH' || deliveryOption === 'FULL_SOIL';
    if (isFullSoil && (!isFullSoilAllowed || totalPlantCount > 5)) {
      if (onChangeDeliveryOption) onChangeDeliveryOption('REDUCED_SOIL');
    }
    if (selectedCourier === 'METTUR_PARCEL' && !isMetturAllowed) {
      onChangeCourier('PROFESSIONAL_COURIER');
      if (onChangeDeliveryOption) onChangeDeliveryOption('REDUCED_SOIL');
    }
  }, [isFullSoilAllowed, isMetturAllowed, totalPlantCount, deliveryOption, selectedCourier]);

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs ${className}`}>
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Choose Courier &amp; Delivery Partner
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
              Destination: <strong className="text-emerald-800 font-bold">{shippingState || 'Tamil Nadu'}</strong> ({inTN ? '₹60 base shipping' : '₹100 base shipping'})
            </p>
          </div>
        </div>

        {hasFreeDelivery && (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
            FREE SHIPPING
          </span>
        )}
      </div>

      {/* Courier Cards */}
      <div className="space-y-2.5">

        {/* 1. Professional Courier */}
        <div
          onClick={() => {
            onChangeCourier('PROFESSIONAL_COURIER');
            if (onChangeDeliveryOption && deliveryOption === 'METTUR_PARCEL') {
              onChangeDeliveryOption('REDUCED_SOIL');
            }
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedCourier === 'PROFESSIONAL_COURIER'
              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1">
              <input
                type="radio"
                name="courierPartner"
                checked={selectedCourier === 'PROFESSIONAL_COURIER'}
                onChange={() => {
                  onChangeCourier('PROFESSIONAL_COURIER');
                  if (onChangeDeliveryOption && deliveryOption === 'METTUR_PARCEL') {
                    onChangeDeliveryOption('REDUCED_SOIL');
                  }
                }}
                className="mt-1 accent-emerald-700 cursor-pointer"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    📦 Professional Courier (Doorstep Delivery)
                  </h4>
                  <span className="text-[9px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                    All India Coverage
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Reliable nationwide doorstep delivery covering metro cities and regional hubs across all states.
                </p>

                {/* Sub-options: Reduced Soil vs 6 Inch Full Soil vs 8 Inch Full Soil */}
                {selectedCourier === 'PROFESSIONAL_COURIER' && (
                  <div
                    className="mt-3 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Option A: Reduced Soil Option */}
                    <div
                      onClick={() => onChangeDeliveryOption && onChangeDeliveryOption('REDUCED_SOIL')}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryOption === 'REDUCED_SOIL'
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="profCourierOption"
                          checked={deliveryOption === 'REDUCED_SOIL'}
                          onChange={() => onChangeDeliveryOption && onChangeDeliveryOption('REDUCED_SOIL')}
                          className="accent-emerald-700 cursor-pointer"
                        />
                        <div>
                          <p className="text-[11px] font-black text-slate-900">🌿 Professional Courier – Reduced Soil</p>
                          <p className="text-[10px] text-emerald-700 font-bold">
                            {inTN ? '₹60 for 1st plant + ₹20/addl' : '₹100 for 1st plant + ₹20/addl'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-900 block">
                          {hasFreeDelivery ? '₹0' : `₹${reducedSoilCharge}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Delivery Charge</span>
                      </div>
                    </div>

                    {/* Option B: 6 Inch Full Soil Option (₹140/plant) */}
                    <div
                      onClick={() => {
                        if (!isFullSoilAllowed) return;
                        if (totalPlantCount > 5) return;
                        onChangeDeliveryOption && onChangeDeliveryOption('FULL_SOIL_6INCH');
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        !isFullSoilAllowed
                          ? 'border-slate-200 bg-slate-100/80 opacity-60 cursor-not-allowed'
                          : totalPlantCount > 5
                          ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                          : deliveryOption === 'FULL_SOIL_6INCH' || deliveryOption === 'FULL_SOIL'
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/30 cursor-pointer'
                            : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="profCourierOption"
                          checked={deliveryOption === 'FULL_SOIL_6INCH' || deliveryOption === 'FULL_SOIL'}
                          disabled={!isFullSoilAllowed || totalPlantCount > 5}
                          onChange={() => {
                            if (isFullSoilAllowed && totalPlantCount <= 5) onChangeDeliveryOption && onChangeDeliveryOption('FULL_SOIL_6INCH');
                          }}
                          className="accent-emerald-700 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <p className="text-[11px] font-black text-slate-900 flex items-center gap-1.5">
                            <span>🌱 Professional courier(6inch)-full soil: 140</span>
                            {!isFullSoilAllowed && (
                              <span className="text-[8px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Tamil Nadu Only</span>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-800">
                            {!isFullSoilAllowed
                              ? '🚫 Full Soil is available only within Tamil Nadu due to transit weight limits.'
                              : totalPlantCount > 5
                              ? `⚠️ Maximum 5 plants for Full Soil (you have ${totalPlantCount})`
                              : `Rate: ₹140 × ${totalPlantCount} plant${totalPlantCount > 1 ? 's' : ''} = ₹${fullSoil6InchCharge}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-900 block">
                          {!isFullSoilAllowed ? 'N/A' : `₹${fullSoil6InchCharge}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">{isFullSoilAllowed ? '₹140/plant' : 'Not Available'}</span>
                      </div>
                    </div>

                    {/* Option C: 8 Inch Full Soil Option (₹190/plant) */}
                    <div
                      onClick={() => {
                        if (!isFullSoilAllowed) return;
                        if (totalPlantCount > 5) return;
                        onChangeDeliveryOption && onChangeDeliveryOption('FULL_SOIL_8INCH');
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        !isFullSoilAllowed
                          ? 'border-slate-200 bg-slate-100/80 opacity-60 cursor-not-allowed'
                          : totalPlantCount > 5
                          ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                          : deliveryOption === 'FULL_SOIL_8INCH'
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/30 cursor-pointer'
                            : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="profCourierOption"
                          checked={deliveryOption === 'FULL_SOIL_8INCH'}
                          disabled={!isFullSoilAllowed || totalPlantCount > 5}
                          onChange={() => {
                            if (isFullSoilAllowed && totalPlantCount <= 5) onChangeDeliveryOption && onChangeDeliveryOption('FULL_SOIL_8INCH');
                          }}
                          className="accent-emerald-700 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div>
                          <p className="text-[11px] font-black text-slate-900 flex items-center gap-1.5">
                            <span>🪴 Professional courier (8inch) -full soil: 190</span>
                            {!isFullSoilAllowed && (
                              <span className="text-[8px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Tamil Nadu Only</span>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-amber-800">
                            {!isFullSoilAllowed
                              ? '🚫 Full Soil is available only within Tamil Nadu due to transit weight limits.'
                              : totalPlantCount > 5
                              ? `⚠️ Maximum 5 plants for Full Soil (you have ${totalPlantCount})`
                              : `Rate: ₹190 × ${totalPlantCount} plant${totalPlantCount > 1 ? 's' : ''} = ₹${fullSoil8InchCharge}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-900 block">
                          {!isFullSoilAllowed ? 'N/A' : `₹${fullSoil8InchCharge}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">{isFullSoilAllowed ? '₹190/plant' : 'Not Available'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price shown when NOT expanded (courier not selected) */}
            {selectedCourier !== 'PROFESSIONAL_COURIER' && (
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-black text-emerald-900 block">
                  {hasFreeDelivery ? '₹0' : `from ₹${reducedSoilCharge}`}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Doorstep</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Mettur Parcel Service */}
        <div
          onClick={() => {
            if (!isMetturAllowed) return;
            onChangeCourier('METTUR_PARCEL');
            if (onChangeDeliveryOption) onChangeDeliveryOption('METTUR_PARCEL');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${
            !isMetturAllowed
              ? 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
              : selectedCourier === 'METTUR_PARCEL'
              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1">
              <input
                type="radio"
                name="courierPartner"
                disabled={!isMetturAllowed}
                checked={selectedCourier === 'METTUR_PARCEL'}
                onChange={() => {
                  if (!isMetturAllowed) return;
                  onChangeCourier('METTUR_PARCEL');
                  if (onChangeDeliveryOption) onChangeDeliveryOption('METTUR_PARCEL');
                }}
                className="mt-1 accent-emerald-700 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    🚚 Mettur Parcel Service (Branch / Depot Pickup)
                  </h4>
                  <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                    MIN 3 PLANTS
                  </span>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                    SAFE &amp; FAST
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Self-pickup at your nearest Mettur Parcel Service branch / depot. Delivery charges payable directly at branch counter upon collection.
                </p>

                {!isMetturAllowed && (
                  <p className="text-[10px] text-amber-700 font-bold pt-1">
                    ⚠️ Requires minimum 3 plants (Current count: {totalPlantCount}). Add more plants to unlock Mettur Parcel Service!
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-emerald-800 block">
                Pay at Branch
              </span>
              <span className="text-[10px] text-slate-600">Counter pickup</span>
            </div>
          </div>

          {/* Mettur Branch Selection Controls */}
          {selectedCourier === 'METTUR_PARCEL' && isMetturAllowed && (
            <div className="mt-3.5 pt-3.5 border-t border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Select Your Nearest Mettur Parcel Branch / Hub</span>
              </div>

              {/* State & District Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 block mb-1">State</label>
                  <select
                    value={metturState || shippingState || 'Tamil Nadu'}
                    onChange={(e) => {
                      const newState = e.target.value;
                      onChangeMetturState(newState);
                      const newDistricts = getMetturStateCoverage(newState);
                      if (newDistricts.length > 0) {
                        onChangeMetturDistrict(newDistricts[0].district);
                        onChangeMetturBranch('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    {METTUR_PARCEL_COVERAGE.map((s) => (
                      <option key={s.state} value={s.state}>
                        {s.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-600 block mb-1">District</label>
                  <select
                    value={metturDistrict || (activeStateDistricts[0]?.district || '')}
                    onChange={(e) => {
                      const newDist = e.target.value;
                      onChangeMetturDistrict(newDist);
                      onChangeMetturBranch('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    {activeStateDistricts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district} ({d.branches.length} Branch{d.branches.length > 1 ? 'es' : ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch Selector */}
              {branches.length > 0 ? (
                <div>
                  <label className="text-[10px] font-extrabold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Select Nearest Branch / Delivery Office (Required)</span>
                    {!metturBranch && (
                      <span className="text-[10px] text-rose-600 font-extrabold">
                        * Required
                      </span>
                    )}
                  </label>
                  <select
                    id="mettur-branch-dropdown"
                    value={metturBranch || ''}
                    onChange={(e) => onChangeMetturBranch(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 cursor-pointer transition-all ${
                      !metturBranch
                        ? 'border-rose-400 ring-2 ring-rose-200 text-rose-900 bg-rose-50/40'
                        : 'border-slate-300 text-slate-900 focus:ring-emerald-600'
                    }`}
                  >
                    <option value="">-- Select Nearest Mettur Branch / Hub --</option>
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        📍 {b.name} [{b.type}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Error Notice when No Hub is Selected */}
              {!metturBranch && isAvailable && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-900 text-[11px] font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    ⚠️ <strong>Error:</strong> No Mettur branch selected! Please select your pickup branch above to continue.
                  </span>
                </div>
              )}

              {/* Status Message when Hub is Selected */}
              {isAvailable && metturBranch && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-emerald-950 text-[11px] animate-in fade-in">
                  <div className="flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      ✅ <strong>Mettur Parcel Service</strong> is active for{' '}
                      <strong>{metturDistrict || shippingDistrict}</strong> ({metturBranch}).
                      Your parcel will be dispatched directly to this depot.
                    </span>
                  </div>
                  <div className="text-[10px] bg-amber-100/70 border border-amber-300/80 rounded-lg p-1.5 text-amber-950 font-bold flex items-center gap-1">
                    <span>💵</span>
                    <span>Note: Parcel handling / delivery charge is to be paid directly at the branch counter when collecting your plants.</span>
                  </div>
                </div>
              )}

              {!isAvailable && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-[11px] font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    ⚠️ Mettur Parcel Service is not available for this district. Please choose{' '}
                    <strong>Professional Courier</strong> for doorstep delivery.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
