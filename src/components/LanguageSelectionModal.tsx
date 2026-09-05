import React, { useState } from 'react';
import { Globe, Check, Sparkles, X } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useLanguage();
  // Default is 'en' as requested by the user
  const [selectedLang, setSelectedLang] = useState<Language>(language || 'en');

  if (!isOpen) return null;

  const handleSelect = (lang: Language) => {
    setSelectedLang(lang);
    setLanguage(lang); // Immediately switches site language to give instant visual feedback
  };

  const handleConfirm = () => {
    setLanguage(selectedLang);
    try {
      localStorage.setItem('vrg_lang_chosen', 'true');
    } catch {}
    onClose();
  };

  const isTamil = selectedLang === 'ta';

  return (
    <div
      id="language-selection-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(10, 25, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.35s ease forwards',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-modal-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(165deg, #ffffff 0%, #f0fdf4 100%)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(22, 101, 52, 0.4), 0 0 0 1px rgba(34, 197, 94, 0.25)',
          overflow: 'hidden',
          position: 'relative',
          padding: '28px 24px',
          border: '1px solid rgba(134, 239, 172, 0.6)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleConfirm}
          aria-label={isTamil ? 'மூடுக' : 'Close language selector'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(240, 253, 244, 0.9)',
            border: '1px solid #bbf7d0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#15803d',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={18} />
        </button>

        {/* Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 12px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #22c55e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.5)',
              color: 'white',
            }}
          >
            <Globe size={30} />
          </div>

          <h2
            id="lang-modal-title"
            style={{
              margin: 0,
              fontSize: isTamil ? '20px' : '20px',
              fontWeight: 800,
              color: '#14532d',
              fontFamily: isTamil ? "'Mukta Malar', 'Tamil Sangam MN', sans-serif" : "'Outfit', 'Inter', sans-serif",
              letterSpacing: '-0.02em',
              lineHeight: 1.3,
            }}
          >
            {isTamil ? 'விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்' : 'Choose Preferred Language'}
          </h2>

          <p
            style={{
              margin: '8px 0 0',
              fontSize: '13px',
              color: '#374151',
              lineHeight: 1.4,
              fontFamily: isTamil ? "'Mukta Malar', 'Tamil Sangam MN', sans-serif" : 'inherit',
            }}
          >
            {isTamil
              ? 'வீரிகா ரோஜா கார்டனுக்கு நல்வரவு. தேவையான மொழியைத் தேர்வு செய்யவும்.'
              : 'Welcome to Veerika Rose Garden. Please select your preferred shopping language.'}
          </p>
        </div>

        {/* User Request Dropdown */}
        <div style={{ marginBottom: '18px' }}>
          <label
            htmlFor="language-dropdown-select"
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#166534',
              marginBottom: '8px',
              fontFamily: isTamil ? "'Mukta Malar', 'Tamil Sangam MN', sans-serif" : 'inherit',
            }}
          >
            {isTamil ? 'மொழித் தேர்வு:' : 'Language Preference:'}
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="language-dropdown-select"
              value={selectedLang}
              onChange={(e) => handleSelect(e.target.value as Language)}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                padding: '12px 16px',
                paddingRight: '40px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#14532d',
                backgroundColor: '#ffffff',
                border: '2px solid #86efac',
                borderRadius: '12px',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <option value="en">English (Default)</option>
              <option value="ta">தமிழ்</option>
            </select>
            <div
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#15803d',
                fontSize: '12px',
              }}
            >
              ▼
            </div>
          </div>
        </div>

        {/* Visual Selection Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {/* English Option Card */}
          <button
            type="button"
            id="lang-option-en"
            onClick={() => handleSelect('en')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 10px',
              borderRadius: '14px',
              border: selectedLang === 'en' ? '2.5px solid #16a34a' : '1px solid #e2e8f0',
              backgroundColor: selectedLang === 'en' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: selectedLang === 'en' ? '0 4px 14px rgba(22, 163, 74, 0.15)' : 'none',
            }}
          >
            {selectedLang === 'en' && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <span style={{ fontSize: '26px', marginBottom: '4px' }}>🇬🇧</span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#1f2937' }}>English</span>
            <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Default</span>
          </button>

          {/* Tamil Option Card */}
          <button
            type="button"
            id="lang-option-ta"
            onClick={() => handleSelect('ta')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 10px',
              borderRadius: '14px',
              border: selectedLang === 'ta' ? '2.5px solid #16a34a' : '1px solid #e2e8f0',
              backgroundColor: selectedLang === 'ta' ? '#f0fdf4' : '#ffffff',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: selectedLang === 'ta' ? '0 4px 14px rgba(22, 163, 74, 0.15)' : 'none',
            }}
          >
            {selectedLang === 'ta' && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#16a34a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} strokeWidth={3} />
              </div>
            )}
            <span style={{ fontSize: '26px', marginBottom: '4px' }}>🇮🇳</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#14532d', fontFamily: "'Mukta Malar', 'Tamil Sangam MN', sans-serif" }}>தமிழ்</span>
            <span style={{ fontSize: '11px', color: '#15803d', marginTop: '2px', fontWeight: 700, fontFamily: "'Mukta Malar', 'Tamil Sangam MN', sans-serif" }}>முழு தமிழ்</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          id="confirm-language-btn"
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px -4px rgba(22, 163, 74, 0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            fontFamily: isTamil ? "'Mukta Malar', 'Tamil Sangam MN', sans-serif" : 'inherit',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Sparkles size={18} />
          {isTamil ? 'தொடரவும்' : 'Continue to Store'}
        </button>
      </div>
    </div>
  );
};
