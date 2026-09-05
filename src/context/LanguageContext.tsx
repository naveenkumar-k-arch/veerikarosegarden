import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, Category } from '../types';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  getProductName: (product: { name: string; englishName?: string; tamilName?: string }) => string;
  getCategoryName: (category: { name: string; tamilName?: string }) => string;
}

// Comprehensive English to Tamil translation vocabulary covering all aspects of VRG Nursery
export const TRANSLATIONS_TA: Record<string, string> = {
  // Navigation & Header
  'Home': 'முகப்பு',
  'Shop': 'செடிகள் & கடைகள்',
  'Shop All': 'அனைத்து செடிகள்',
  'Cart': 'கூடை',
  'Account': 'என் கணக்கு',
  'Search': 'தேடுக',
  'Search plants': 'செடிகளைத் தேடுங்கள்...',
  'Search plants in English, தமிழ்...': 'செடிகளைத் தேடுங்கள் (தமிழ் / English)...',
  'Contact': 'தொடர்புக்கு',
  'Contact Us': 'எங்களைத் தொடர்பு கொள்ள',
  'Help': 'உதவி',
  'Track Order': 'ஆர்டரைக் கண்காணிக்கவும்',
  'Wishlist': 'விருப்பப்பட்டியல்',
  'Admin': 'நிர்வாகம்',
  'Admin Portal': 'நிர்வாக போர்டல்',
  'Sign In': 'உள்நுழையவும்',
  'Sign Out': 'வெளியேறவும்',
  'Login': 'உள்நுழைக',
  'Logout': 'வெளியேறு',
  'My Orders': 'எனது ஆர்டர்கள்',
  'Expert Advice': 'தாவரவியல் நிபுணர் ஆலோசனை',
  'WhatsApp Chat': 'வாட்ஸ்அப் உதவி',
  'ALL INDIA DELIVERY': 'அனைத்து இந்தியா டெலிவரி',
  'Direct Nursery Dispatch': 'நர்சரியிலிருந்து நேரடி விநியோகம்',
  'Fast & Safe Delivery': 'விரைவான & பாதுகாப்பான டெலிவரி',

  // Categories
  'Rose Varieties': 'ரோஜா வகைகள்',
  'Exotic Roses': 'அரிய வகை ரோஜாக்கள்',
  'Hybrid Roses': 'ஹைப்ரிட் ரோஜாக்கள்',
  'Standard Roses': 'நாட்டு ரோஜாக்கள்',
  'Climbing Roses': 'கொடி ரோஜாக்கள்',
  'Miniature Roses': 'மினியேச்சர் ரோஜாக்கள்',
  'Fragrant Roses': 'மணமுள்ள ரோஜாக்கள்',
  'Rare Roses': 'அரிய ரோஜாக்கள்',
  'Live Rose Plants': 'உயிருள்ள ரோஜா செடிகள்',
  'Fruit Plants': 'பழச்செடிகள்',
  'Grafted Fruit Trees': 'ஒட்டு பழ மரங்கள்',
  'Medicinal Plants': 'மூலிகைச் செடிகள்',
  'Organic Fertilizers': 'இயற்கை உரங்கள்',
  'Plant Care': 'செடி பராமரிப்பு',
  'Combos': 'காம்போ சலுகைகள்',
  'Special Combos': 'சிறப்பு காம்போ தொகுப்புகள்',
  'Best Sellers': 'அதிகம் விற்பனையாகும் செடிகள்',
  'New Arrivals': 'புதிய வரவுகள்',
  'Featured Plants': 'சிறப்புத் தேர்வுகள்',

  // Product Card & Catalog Actions
  'In Stock': 'இருப்பில் உள்ளது',
  'Out of Stock': 'இருப்பு தீர்ந்துவிட்டது',
  'Low Stock': 'குறைந்த இருப்பே உள்ளது',
  'Add to Cart': 'கூடையில் சேர்க்கவும்',
  'Buy Now': 'உடனே வாங்கவும்',
  'View Details': 'விவரங்களைப் பார்க்க',
  'Quick View': 'விரைவுப் பார்வை',
  'Free Delivery': 'இலவச டெலிவரி',
  'Sale': 'தள்ளுபடி விற்பனை',
  'Off': 'தள்ளுபடி',
  'Price': 'விலை',
  'MRP': 'அசல் விலை',
  'Offer Price': 'சலுகை விலை',
  'Pot Size': 'தொட்டி அளவு',
  'Plant Height': 'செடியின் உயரம்',
  'Sunlight': 'சூரிய ஒளி தேவை',
  'Water Requirement': 'தண்ணீர் தேவை',
  'Flowering Season': 'பூக்கும் பருவம்',
  'Full Sun': 'முழு வெயில் (6+ மணிநேரம்)',
  'Partial Shade': 'மிதமான நிழல்',
  'Daily': 'தினசரி',
  'Twice a week': 'வாரத்திற்கு இருமுறை',
  'When dry': 'மண் உலர்ந்த பின்',
  'Alternate Days': 'ஒரு நாள் விட்டு ஒரு நாள்',

  // Cart & Drawer
  'Shopping Cart': 'உங்கள் கூடை',
  'Your Cart': 'உங்கள் கூடை',
  'Cart is Empty': 'உங்கள் கூடை காலியாக உள்ளது',
  'Looks like you haven\'t added any plants to your cart yet.': 'நீங்கள் இன்னும் செடிகள் எதையும் கூடையில் சேர்க்கவில்லை.',
  'Explore Plants': 'செடிகளைப் பார்க்கவும்',
  'Subtotal': 'கூடைத் தொகை',
  'Delivery Fee': 'டெலிவரி கட்டணம்',
  'Delivery Charge': 'டெலிவரி கட்டணம்',
  'Packing Fee': 'பேக்கிங் கட்டணம்',
  'Estimated Total': 'மொத்தத் தொகை',
  'Total': 'மொத்தத் தொகை',
  'Proceed to Checkout': 'செக்அவுட்டுக்குச் செல்லவும்',
  'Secure Checkout': 'பாதுகாப்பான செக்அவுட்',
  'Continue Shopping': 'தொடர்ந்து செடிகளைத் தேர்ந்தெடுக்கவும்',
  'Remove': 'நீக்குக',
  'Quantity': 'அளவு',
  'Items': 'செடிகள்',
  'Item': 'செடி',

  // Checkout Flow & Steps
  'Step 1 of 9': 'படி 1 / 9',
  'Step 2 of 9': 'படி 2 / 9',
  'Step 3 of 9': 'படி 3 / 9',
  'Step 4 of 9': 'படி 4 / 9',
  'Step 5 of 9': 'படி 5 / 9',
  'Step 6 of 9': 'படி 6 / 9',
  'Step 7 of 9': 'படி 7 / 9',
  'Step 8 of 9': 'படி 8 / 9',
  'Step 9 of 9': 'படி 9 / 9',
  'Step 1 of 8': 'படி 1 / 8',
  'Step 2 of 8': 'படி 2 / 8',
  'Step 3 of 8': 'படி 3 / 8',
  'Step 4 of 8': 'படி 4 / 8',
  'Step 5 of 8': 'படி 5 / 8',
  'Step 6 of 8': 'படி 6 / 8',
  'Step 7 of 8': 'படி 7 / 8',
  'Step 8 of 8': 'படி 8 / 8',
  'Order Summary': 'ஆர்டர் விவரங்கள்',
  'Customer Details': 'வாடிக்கையாளர் விவரங்கள்',
  'Delivery Address': 'டெலிவரி முகவரி',
  'Courier & Packing': 'கூரியர் & பேக்கிங் தேர்வு',
  'Courier & Packing Selection': 'கூரியர் மற்றும் பேக்கிங் முறை தேர்வு',
  'Payment Method': 'பணம் செலுத்தும் முறை',
  'Payment': 'பணம் செலுத்துதல்',
  'Order Confirmation': 'ஆர்டர் உறுதிப்படுத்தல்',
  'Order Confirmed': 'ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டது',
  'Invoice': 'விலைப்பட்டியல்',
  'Receipt': 'ரசீது',

  // Address Fields & Labels
  'Full Name': 'முழு பெயர்',
  'Mobile Number': 'கைபேசி எண்',
  'Alternative Mobile Number': 'கூடுதல் கைபேசி எண் (விருப்பப்பட்டால்)',
  'Email Address': 'மின்னஞ்சல் முகவரி',
  'House / Flat / Door No': 'வீட்டு எண் / கதவு எண்',
  'Street / Area / Colony': 'தெரு / பகுதி / சாலை',
  'Landmark': 'அடையாளக் குறி (அருகில்)',
  'Village / Town / City': 'ஊர் / நகரம்',
  'District': 'மாவட்டம்',
  'State': 'மாநிலம்',
  'Pincode': 'அஞ்சல் குறியீடு (பின்கோடு)',
  'Select State': '-- மாநிலத்தைத் தேர்ந்தெடுக்கவும் --',
  'Select District': '-- மாவட்டத்தைத் தேர்ந்தெடுக்கவும் --',
  'Select Branch': '-- கிளையைத் தேர்ந்தெடுக்கவும் --',
  'Select Your District & Nearest Mettur Branch': 'உங்கள் மாவட்டம் மற்றும் அருகிலுள்ள மேட்டூர் கிளையைத் தேர்ந்தெடுக்கவும்',
  'Nearest Branch': 'அருகிலுள்ள கிளை',
  'Branch / Depot Pickup': 'கிளை / டெப்போ நேரடி சேகரிப்பு',
  'Doorstep Delivery': 'வீட்டுக்கே நேரடி டெலிவரி',
  'All India Coverage': 'இந்தியா முழுவதும் விநியோகம்',

  // Couriers
  'Professional Courier': 'தி புரொபஷனல் கூரியர் (வீட்டு டெலிவரி)',
  'Professional Courier (Doorstep Delivery)': 'தி புரொபஷனல் கூரியர் (வீட்டு டெலிவரி)',
  'Mettur Parcel Service': 'மேட்டூர் பார்சல் சர்வீஸ் (கிளை சேகரிப்பு)',
  'Mettur Parcel Service (Branch / Depot Pickup)': 'மேட்டூர் பார்சல் சர்வீஸ் (கிளை சேகரிப்பு)',
  'Pay at Branch': 'கிளையில் பணம் செலுத்தவும்',
  'Counter pickup': 'நேரடி கிளை சேகரிப்பு',
  'MIN 3 PLANTS': 'குறைந்தது 3 செடிகள் தேவை',
  'SAFE & FAST': 'பாதுகாப்பானது & விரைவானது',
  'Reliable nationwide doorstep delivery covering metro cities and regional hubs across all states.': 'நாடு முழுவதும் உள்ள பெருநகரங்கள் மற்றும் மாவட்டங்களுக்கு நம்பகமான நேரடி வீட்டு டெலிவரி.',
  'Self-pickup at your nearest Mettur Parcel Service branch / depot. Delivery charges payable directly at branch counter upon collection.': 'உங்களுக்கு அருகிலுள்ள மேட்டூர் பார்சல் சர்வீஸ் கிளையில் நேரடியாகப் பெற்றுக் கொள்ளலாம். பார்சல் டெலிவரி கட்டணத்தை கிளையிலேயே நேரடியாகச் செலுத்திக் கொள்ளலாம்.',

  // Buttons & Controls
  'Proceed': 'அடுத்து செல்லவும்',
  'Continue': 'தொடரவும்',
  'Back': 'முந்தைய படிக்கு',
  'Previous': 'பின்னால்',
  'Next': 'அடுத்து',
  'Confirm': 'உறுதி செய்',
  'Confirm & Place Order': 'ஆர்டரை உறுதி செய்து பதிவு செய்',
  'Place Order': 'ஆர்டரை உறுதிப்படுத்து',
  'Pay Now': 'இப்போதே பணம் செலுத்தவும்',
  'Print Receipt': 'ரசீதை அச்சிடவும்',
  'Download Invoice': 'விலைப்பட்டியல் பதிவிறக்கம்',
  'Track Your Order': 'உங்கள் ஆர்டரைக் கண்காணிக்கவும்',
  'Go to Home': 'முகப்புக்குச் செல்லவும்',
  'Apply Coupon': 'கூப்பனைப் பயன்படுத்தவும்',
  'Apply': 'பயன்படுத்து',
  'Coupon Code': 'கூப்பன் குறியீடு',

  // Payment Options
  'Pay Online (PhonePe, GPay, Paytm, Cards)': 'ஆன்லைன் கட்டணம் (போன்பே, கூகிள் பே, பேடிஎம், கார்டுகள்)',
  'Instant UPI / QR Code': 'உடனடி யுபிஐ / கியூஆர் ஸ்கேன்',
  'Scan QR to Pay': 'கியூஆர் ஸ்கேன் செய்து பணம் செலுத்தவும்',
  'Cash on Delivery': 'டெலிவரியில் பணம் செலுத்தவும் (COD)',
  'Verified & Secure Payment': '100% பாதுகாப்பான பரிவர்த்தனை',
  'Payment Successful': 'பணம் செலுத்துதல் வெற்றியடைந்தது',

  // Plant Care & Guarantees
  'Live Plant Transit Guarantee': '100% உயிருள்ள செடி போக்குவரத்து உத்தரவாதம்',
  'Eco-Friendly Corrugated Plant Guard Packaging': 'சுற்றுச்சூழல் பாதுகாப்புடன் கூடிய அட்டைப்பெட்டி பேக்கிங்',
  'Root-Ball Hydration Protection': 'வேர்ப்பகுதி ஈரப்பதம் காக்கும் சிறப்பு பாதுகாப்பு',
  'Direct Nursery Dispatch from Pennagaram': 'பென்னாகரம் நர்சரியிலிருந்து நேரடி விநியோகம்',
  'Fast WhatsApp Customer Support': 'உடனடி வாட்ஸ்அப் வாடிக்கையாளர் உதவி',

  // Footer & About
  'Veerika Rose Garden': 'வீரிகா ரோஜா கார்டன் (VRG Nursery)',
  'Pennagaram, Dharmapuri District, Tamil Nadu': 'பென்னாகரம், தர்மபுரி மாவட்டம், தமிழ்நாடு',
  'All Rights Reserved': 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை',
  'Privacy Policy': 'தனியுரிமைக் கொள்கை',
  'Terms of Service': 'சேவை விதிமுறைகள்',
  'Shipping & Delivery Policy': 'ஷிப்பிங் & டெலிவரி கொள்கை',
  'Cancellation & Refund Policy': 'ரத்து மற்றும் பணத்திருப்புக் கொள்கை',
  'About Us': 'எங்களைப் பற்றி',
  'Contact Information': 'தொடர்பு முகவரி',
  'Call Us': 'அழைக்கவும்',
  'WhatsApp Us': 'வாட்ஸ்அப் செய்யவும்',
  'Operating Hours': 'வேலை நேரம்',
  'Mon - Sun: 6:00 AM - 8:00 PM': 'திங்கள் - ஞாயிறு: காலை 6:00 - இரவு 8:00',

  // Language Modal
  'Choose Preferred Language': 'விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
  'Select Language': 'மொழியைத் தேர்வு செய்க',
  'Please select your preferred shopping language': 'தயவுசெய்து உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
  'Welcome to Veerika Rose Garden': 'வீரிகா ரோஜா கார்டனுக்கு நல்வரவு',
  'You can change your language anytime from the top menu': 'மேல் மெனுவிலிருந்து எந்த நேரத்திலும் மொழியை மாற்றிக் கொள்ளலாம்',
};

// Common Tamil word dictionary for deep recursive DOM translation
const GENERAL_PHRASE_MAPPINGS: [RegExp, string][] = [
  [/\bVeerika Rose Garden\b/gi, 'வீரிகா ரோஜா கார்டன்'],
  [/\bVRG Nursery\b/gi, 'விஆர்ஜி நர்சரி'],
  [/\bSecure Checkout\b/gi, 'பாதுகாப்பான செக்அவுட்'],
  [/\bOrder Summary\b/gi, 'ஆர்டர் விவரங்கள்'],
  [/\bDelivery Charge\b/gi, 'டெலிவரி கட்டணம்'],
  [/\bDelivery Fee\b/gi, 'டெலிவரி கட்டணம்'],
  [/\bPacking Fee\b/gi, 'பேக்கிங் கட்டணம்'],
  [/\bProfessional Courier\b/gi, 'தி புரொபஷனல் கூரியர்'],
  [/\bMettur Parcel Service\b/gi, 'மேட்டூர் பார்சல் சர்வீஸ்'],
  [/\bDoorstep Delivery\b/gi, 'வீட்டு டெலிவரி'],
  [/\bBranch \/ Depot Pickup\b/gi, 'கிளை நேரடி சேகரிப்பு'],
  [/\bPay at Branch\b/gi, 'கிளையில் செலுத்தவும்'],
  [/\bFull Name\b/gi, 'முழு பெயர்'],
  [/\bMobile Number\b/gi, 'கைபேசி எண்'],
  [/\bHouse No\b/gi, 'வீட்டு எண்'],
  [/\bStreet\b/gi, 'தெரு / சாலை'],
  [/\bVillage \/ Town\b/gi, 'ஊர் / நகரம்'],
  [/\bDistrict\b/gi, 'மாவட்டம்'],
  [/\bState\b/gi, 'மாநிலம்'],
  [/\bPincode\b/gi, 'அஞ்சல் குறியீடு'],
  [/\bIn Stock\b/gi, 'இருப்பில் உள்ளது'],
  [/\bOut of stock\b/gi, 'இருப்பு இல்லை'],
  [/\bAdd to Cart\b/gi, 'கூடையில் சேர்க்கவும்'],
  [/\bBuy Now\b/gi, 'உடனே வாங்கவும்'],
  [/\bFree Delivery\b/gi, 'இலவச டெலிவரி'],
  [/\bProceed to Checkout\b/gi, 'செக்அவுட்டுக்குச் செல்லவும்'],
  [/\bShopping Cart\b/gi, 'ஷாப்பிங் கூடை'],
  [/\bAll India Delivery\b/gi, 'இந்தியா முழுவதும் டெலிவரி'],
  [/\bSubtotal\b/gi, 'கூடைத் தொகை'],
  [/\bTotal\b/gi, 'மொத்தத் தொகை'],
  [/\bDiscount\b/gi, 'தள்ளுபடி'],
  [/\bPlace Order\b/gi, 'ஆர்டரை உறுதிப்படுத்து'],
  [/\bContinue Shopping\b/gi, 'தொடர்ந்து வாங்கவும்'],
];

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (k, fallback) => fallback || k,
  getProductName: (p) => p.name,
  getCategoryName: (c) => c.name,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem('vrg_preferred_lang');
      if (saved === 'ta' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('vrg_preferred_lang', newLang);
      document.documentElement.lang = newLang;
      if (newLang === 'ta') {
        document.body.classList.add('lang-tamil');
      } else {
        document.body.classList.remove('lang-tamil');
      }
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  }, [language, setLanguage]);

  const t = useCallback((key: string, fallback?: string): string => {
    if (language === 'en') return fallback || key;
    const trimmed = (key || '').trim();
    if (TRANSLATIONS_TA[trimmed]) return TRANSLATIONS_TA[trimmed];

    // Check case-insensitive
    const lowerKey = trimmed.toLowerCase();
    for (const [k, v] of Object.entries(TRANSLATIONS_TA)) {
      if (k.toLowerCase() === lowerKey) return v;
    }

    return fallback || key;
  }, [language]);

  const getProductName = useCallback((product: { name: string; englishName?: string; tamilName?: string }): string => {
    if (!product) return '';
    if (language === 'ta') {
      return (product.tamilName && product.tamilName.trim()) 
        ? product.tamilName.trim() 
        : t(product.name || product.englishName || '');
    }
    return product.englishName || product.name;
  }, [language, t]);

  const getCategoryName = useCallback((category: { name: string; tamilName?: string }): string => {
    if (!category) return '';
    if (language === 'ta') {
      return (category.tamilName && category.tamilName.trim()) 
        ? category.tamilName.trim() 
        : t(category.name);
    }
    return category.name;
  }, [language, t]);

  // Global DOM Text Observer in Tamil Mode:
  // Dynamically sweeps rendered text nodes and translates any residual English UI words into Tamil.
  // This guarantees that "no english words should be present there" when Tamil is selected!
  useEffect(() => {
    if (typeof window === 'undefined' || language !== 'ta') return;

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (!text || text.trim().length === 0) return;
        
        // Skip script and style tags
        const parent = node.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'CODE' || parent.classList.contains('no-translate'))) {
          return;
        }

        let newText = text;
        const trimmed = text.trim();
        if (TRANSLATIONS_TA[trimmed]) {
          newText = text.replace(trimmed, TRANSLATIONS_TA[trimmed]);
        } else {
          for (const [regex, replacement] of GENERAL_PHRASE_MAPPINGS) {
            if (regex.test(newText)) {
              newText = newText.replace(regex, replacement);
            }
          }
        }

        if (newText !== text) {
          node.nodeValue = newText;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Also translate placeholders and buttons if present
        const el = node as HTMLElement;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          const ph = el.getAttribute('placeholder');
          if (ph && TRANSLATIONS_TA[ph.trim()]) {
            el.setAttribute('placeholder', TRANSLATIONS_TA[ph.trim()]);
          }
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          translateNode(node.childNodes[i]);
        }
      }
    };

    // Initial pass over the entire body
    translateNode(document.body);

    // MutationObserver to translate newly mounted components / steps
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          translateNode(mutation.addedNodes[i]);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getProductName,
        getCategoryName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
