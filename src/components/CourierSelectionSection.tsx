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
  deliveryOption?: 'REDUCED_SOIL' | 'FULL_SOIL' | 'METTUR_PARCEL';
  onChangeDeliveryOption?: (opt: 'REDUCED_SOIL' | 'FULL_SOIL' | 'METTUR_PARCEL') => void;
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

  // Auto-select first branch if current selection is invalid
  useEffect(() => {
    if (branches.length > 0) {
      const exists = branches.some(b => b.name === metturBranch);
      if (!exists) {
        onChangeMetturBranch(branches[0].name);
      }
    }
  }, [branches, metturBranch, onChangeMetturBranch]);

  const profCourierCharge = deliveryOption === 'FULL_SOIL'
    ? totalPlantCount * 100
    : totalPlantCount * 60;

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
              Select your preferred parcel network for safe nursery dispatch.
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
                    📦 Professional Courier (All India Delivery)
                  </h4>
                  <span className="text-[9px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                    All India Coverage
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Reliable nationwide doorstep delivery covering metro cities and regional hubs across all states.
                </p>

                {/* Sub-options: Reduced Soil vs Full Soil — shown when selected */}
                {selectedCourier === 'PROFESSIONAL_COURIER' && (
                  <div
                    className="mt-3 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Reduced Soil Option */}
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
                          <p className="text-[10px] text-emerald-700 font-bold">Available</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-900 block">
                          {hasFreeDelivery ? '₹0' : `₹${totalPlantCount * 60}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Delivery Charge</span>
                        <span className="text-[8px] text-slate-400 block">₹60/plant</span>
                      </div>
                    </div>

                    {/* Full Soil Option */}
                    <div
                      onClick={() => {
                        if (totalPlantCount > 5) return; // enforce max 5 plants
                        onChangeDeliveryOption && onChangeDeliveryOption('FULL_SOIL');
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        totalPlantCount > 5
                          ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                          : deliveryOption === 'FULL_SOIL'
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="profCourierOption"
                          checked={deliveryOption === 'FULL_SOIL'}
                          disabled={totalPlantCount > 5}
                          onChange={() => {
                            if (totalPlantCount <= 5) onChangeDeliveryOption && onChangeDeliveryOption('FULL_SOIL');
                          }}
                          className="accent-emerald-700 cursor-pointer"
                        />
                        <div>
                          <p className="text-[11px] font-black text-slate-900">🌱 Professional Courier – Full Soil</p>
                          <p className="text-[10px] font-bold text-amber-600">
                            {totalPlantCount > 5
                              ? `⚠️ Maximum 5 plants (you have ${totalPlantCount})`
                              : 'Maximum 5 plants'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-900 block">
                          {hasFreeDelivery ? '₹0' : `₹${totalPlantCount * 100}`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Delivery Charge</span>
                        <span className="text-[8px] text-slate-400 block">₹100/plant</span>
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
                  {hasFreeDelivery ? '₹0' : `from ₹${totalPlantCount * 60}`}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">₹60/plant</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Mettur Parcel Service */}
        <div
          onClick={() => {
            onChangeCourier('METTUR_PARCEL');
            if (onChangeDeliveryOption) onChangeDeliveryOption('METTUR_PARCEL');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${
            selectedCourier === 'METTUR_PARCEL'
              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                name="courierPartner"
                checked={selectedCourier === 'METTUR_PARCEL'}
                onChange={() => {
                  onChangeCourier('METTUR_PARCEL');
                  if (onChangeDeliveryOption) onChangeDeliveryOption('METTUR_PARCEL');
                }}
                className="mt-1 accent-emerald-700 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">
                    🏢 Mettur Parcel Service (Regional Hubs &amp; Depots)
                  </h4>
                  <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                    Full Soil / Open Box Available
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Economical bulk parcel service with pickup depots across Tamil Nadu, Karnataka (Bangalore), Kerala (Palakkad) &amp; Pondicherry.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs sm:text-sm font-black text-emerald-900 block">
                {hasFreeDelivery ? '₹0' : totalPlantCount < 3 ? '₹60' : `₹${Math.ceil(totalPlantCount / 6) * 60}`}
              </span>
              <span className="text-[9px] text-emerald-800 font-bold">Bulk Flat Rate</span>
            </div>
          </div>

          {/* Mettur Parcel Branch & Availability Selection Box */}
          {selectedCourier === 'METTUR_PARCEL' && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-3.5 pt-3.5 border-t border-emerald-200/80 space-y-3 bg-white p-3.5 rounded-xl border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  Select Nearby Mettur Parcel Service Depot / Branch:
                </span>
                {isAvailable ? (
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Service Available
                  </span>
                ) : (
                  <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    Branch Unavailable
                  </span>
                )}
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
                        onChangeMetturBranch(newDistricts[0].branches[0]?.name || '');
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
                      const bList = getBranchesForDistrict(metturState, newDist);
                      if (bList.length > 0) {
                        onChangeMetturBranch(bList[0].name);
                      }
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
                  <label className="text-[10px] font-extrabold text-slate-600 block mb-1">
                    Select Nearest Branch / Delivery Office
                  </label>
                  <select
                    value={metturBranch || (branches[0]?.name || '')}
                    onChange={(e) => onChangeMetturBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        📍 {b.name} [{b.type}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Status Message */}
              {isAvailable ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-900 text-[11px] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    ✅ <strong>Mettur Parcel Service</strong> is active in{' '}
                    <strong>{metturDistrict || shippingDistrict}</strong> ({metturBranch || 'Main Branch'}).
                    Your parcel will be dispatched directly to this depot / delivery point.
                  </span>
                </div>
              ) : (
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
