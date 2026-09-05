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
  'Veerika Rose Garden': 'வீரிகா ரோஜா கார்டன்',
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

  // Catalog & Sections
  'Combos & Offers': 'காம்போ சலுகைகள்',
  'EXTRA SAVINGS': 'கூடுதல் சேமிப்பு',
  'Special Plant Combo Offers': 'சிறப்பு செடி காம்போ சலுகைகள்',
  'Healthy Grafted Saplings': 'ஆரோக்கியமான ஒட்டுச்செடிகள்',
  'Express Moisture Packed': 'ஈரப்பதம் குறையாத பேக்கிங்',
  '1-IN-1 SPECIAL': '1-ல்-1 சிறப்பு சலுகை',
  '2-IN-1 SPECIAL': '2-ல்-1 சிறப்பு சலுகை',
  '3-IN-1 SPECIAL': '3-ல்-1 சிறப்பு சலுகை',
  'FREE SHIPPING': 'இலவச டெலிவரி',
  'Free Delivery (TN)': 'இலவச டெலிவரி (TN)',
  'Add Combo Package to Cart': 'காம்போ தொகுப்பை கூடையில் சேர்க்கவும்',
  'Add Bundle': 'காம்போவை சேர்க்க',
  'Browse by Type': 'வகைகள்',
  'Plant Categories': 'செடி வகைகள்',
  'View All': 'அனைத்தையும் பார்க்க',
  'Shop now': 'வாங்கவும்',
  'Our Collection': 'எங்கள் தொகுப்பு',
  'All Plants': 'அனைத்து செடிகள்',
  'Full Catalog': 'முழு பட்டியல்',
  'VERIFIED BUYER PLANT PHOTOS': 'வாடிக்கையாளர் செடி புகைப்படங்கள்',
  'Customer Photo Reviews': 'வாடிக்கையாளர் புகைப்படக் கருத்துகள்',
  '4.9 / 5.0 Rating': '4.9 / 5.0 மதிப்பீடு',
  '500+ Verified Sapling Deliveries': '500+ உறுதிப்படுத்தப்பட்ட செடி டெலிவரிகள்',
  'Customer Photo': 'வாடிக்கையாளர் புகைப்படம்',
  'Click to Zoom': 'பெரிதாக்க அழுத்தவும்',
  'Verified Buyer': 'உறுதிப்படுத்தப்பட்ட வாங்குபவர்',
  '✓ Verified Buyer': '✓ உறுதிப்படுத்தப்பட்ட வாங்குபவர்',
  'Customer Love': 'வாடிக்கையாளர் அன்பு',
  'What Customers Say': 'வாடிக்கையாளர்கள் கூறுவது',
  'Visit Our Farm': 'எங்கள் பண்ணையைப் பார்வையிட',
  'Come Visit Veerika Rose Garden': 'வீரிகா ரோஜா கார்டனுக்கு வருகை தாருங்கள்',
  'Shop Plants': 'செடிகளை வாங்க',
  'Expert AI Chat': 'தாவர நிபுணர் AI',
  'Quick Links': 'முக்கிய இணைப்புகள்',
  'Shop All Plants': 'அனைத்து செடிகள்',
  'Starting at': 'ஆரம்ப விலை',
  '10K+ Happy Customers': '10,000+ மகிழ்ச்சியான வாடிக்கையாளர்கள்',
  '7-Day Root Protection': '7-நாள் வேர் பாதுகாப்பு',
  'Live arrival guaranteed': 'உயிருடன் வந்து சேரும் உத்தரவாதம்',
  'PhonePe Safe Payment': 'போன்பே பாதுகாப்பான கட்டணம்',
  '100% encrypted checkout': '100% பாதுகாப்பான பரிவர்த்தனை',
  'Organic Nursery': 'இயற்கை நர்சரி',
  'Chemical-free cultivation': 'ரசாயனமற்ற இயற்கை விவசாயம்',
  'Free Expert Support': 'இலவச நிபுணர் உதவி',
  'Call + WhatsApp helpline': 'அழைப்பு & வாட்ஸ்அப் உதவி',
  '★ Top Rated': '★ சிறந்த மதிப்பீடு',
  'Explore All': 'அனைத்தும் பார்க்க',
  'Handpicked Selection': 'தேர்ந்தெடுக்கப்பட்ட தொகுப்பு',
  'Featured Varieties': 'சிறப்பு வகைகள்',
  'Explore All Plants': 'அனைத்து செடிகளையும் பார்க்க',
  'WhatsApp Order': 'வாட்ஸ்அப் ஆர்டர்',
  'Plant Varieties': 'செடி வகைகள்',
  'Customer Rating': 'வாடிக்கையாளர் மதிப்பீடு',
  'Orders Delivered': 'ஆர்டர்கள் விநியோகம்',
  'Mun coeur': 'மான் கர் ரோஜா',
  'Taiwan pink guva': 'தைவான் பிங்க் கொய்யா',
  'Mini beetroot guva': 'மினி பீட்ரூட் கொய்யா',
  'Perfume breeze light pink': 'பெர்பியூம் ப்ரீஸ் லைட் பிங்க் ரோஜா',
  'Perfume breeze': 'பெர்பியூம் ப்ரீஸ் ரோஜா',
  'White Panneer Rose': 'வெள்ளை பன்னீர் ரோஜா',
  'Creeper Jackie Rose': 'ஜாக்கி கொடி ரோஜா',
  'Birthday Party Creeper Rose': 'பர்த்டே பார்ட்டி கொடி ரோஜா',
  'Baby Romantica Creeper Rose': 'பேபி ரொமாண்டிகா கொடி ரோஜா',
  'Red Cascade Climber Rose': 'சிவப்பு கொடி ரோஜா (ரெட் காஸ்கேட்)',
  'Suloli Hanging Rose (Creeper)': 'சுலோலி தொங்கும் கொடி ரோஜா',
  'Pink Creeper Rose': 'இளஞ்சிவப்பு கொடி ரோஜா',
  'Purple Hibiscus': 'நீல/ஊதா செம்பருத்தி',
  'Manoranjitham (Climbing Ylang Ylang)': 'மனோரஞ்சிதம் செடி',
  'Panneer Kodi Milagu (Pepper Vine)': 'பன்னீர் கொடி மிளகு',
  'Red Henna (Sigappu Marudhani)': 'சிகப்பு மருதாணி செடி',
  'Srilankan Malli': 'இலங்கை மல்லி செடி',
  'Kodi Sambangi (Climbing Tuberose)': 'கொடி சம்பங்கி செடி',
  'Rangoon Creeper (Single Petal)': 'ரங்கூன் மல்லி (ஒற்றை இதழ்)',
  'Barleria Cristata (December Poo)': 'டிசம்பர் பூ செடி (வயலட்/பிங்க்)',
  'Magilam Poo Maram (Bullet Wood)': 'மகிழம் பூ மரம்',
  'Yellow Parijadham': 'மஞ்சள் பாரிஜாதம்',
  'Bridal Bouquet (Night Queen Kodi)': 'பிரைடல் பொக்கே / நைட்குயின் கொடி',
  'Panneer Pushpam Plant': 'பன்னீர் புஷ்பம் செடி',
  'Petrea Volubilis Violet (Sandpaper Vine)': 'பெட்ரியா வயலட் கொடி',
  'Petrea Volubilis White (Sandpaper Vine)': 'பெட்ரியா வெள்ளை கொடி',
  'Apple Red rose offer': 'ஆப்பிள் ரெட் ரோஸ் சலுகை',
  'Apple Red Rose': 'ஆப்பிள் ரெட் ரோஸ்',
  'Sunday Rose Combo': 'ஞாயிறு ரோஜா காம்போ',
  'BEST ON SUNDAY – ROSE COMBO OFFER': 'ஞாயிறு சிறப்பு ரோஜா காம்போ சலுகை',
  'Seven Days Rose': '7 நாட்கள் ரோஜா',
  'Paneer Butter Rose': 'பன்னீர் பட்டர் ரோஜா',
  '7 Days Rose (Everblooming Red)': '7 நாட்கள் ரோஜா (எவர்ப்ளூமிங் ரெட்)',
  'Naatu Rose (Country Paneer Rose)': 'நாட்டு பன்னீர் ரோஸ்',
  'SWEET FRAGRANCE ORCHID ROSE SPECIAL OFFER': 'நறுமணமிக்க ஆர்க்கிட் ரோஜா சிறப்பு சலுகை',
  'Orchid Rose (Free shipping)': 'ஆர்க்கிட் ரோஸ் (இலவச டெலிவரி)',
  'Orchid Rose': 'ஆர்க்கிட் ரோஸ்',
  'FAIRY ROSE – 2 SPECIAL VARIETIES COMBO': 'ஃபேரி ரோஸ் - 2 சிறப்பு ரகங்கள் காம்போ',
  'Pink Fairy Rose (Polyantha)': 'பிங்க் ஃபேரி ரோஸ்',
  'Margo Koster Pink Rose': 'மார்கோ கோஸ்டர் பிங்க் ரோஸ்',
  'WATER APPLE – 3 VARIETY COMBO': 'வாட்டர் ஆப்பிள் - 3 ரக காம்போ',
  'Green Water Apple Plant': 'பச்சை வாட்டர் ஆப்பிள் செடி',
  'Red Water Apple Plant': 'சிவப்பு வாட்டர் ஆப்பிள் செடி',
  'White Water Apple Plant': 'வெள்ளை வாட்டர் ஆப்பிள் செடி',
  'Guva combo offer': 'கொய்யா காம்போ சலுகை',
  'Taiwan pink guva & mini beetroot guva': 'தைவான் பிங்க் கொய்யா & மினி பீட்ரூட் கொய்யா',
  'Restock alert': 'மீண்டும் இருப்பில் வந்துள்ளது',
  'Sunday Special offer': 'ஞாயிறு சிறப்பு சலுகை',
  '7days rose and button panner combo': '7 நாட்கள் ரோஜா & பட்டன் பன்னீர் காம்போ',
  'Button Pink Rose': 'பட்டன் பிங்க் ரோஸ்',
  'Rose Plants': 'ரோஜா வகைகள்',
  'Herbal Plants': 'மூலிகைச் செடிகள்',
  'Jasmine Varieties': 'மல்லி பூ வகைகள்',
  'Creeper Roses': 'கொடி ரோஸ் வகைகள்',
  'Rare & Exotic Roses': 'அரிய வகை ரோஜாக்கள்',
  'Flowering Plants': 'பூச்செடிகள்',
  'Live Plant': 'உயிருள்ள பண்ணை செடி',
  'Live Plants': 'உயிருள்ள பண்ணை செடிகள்',
  'From': 'விலை',
  'Plants': 'செடிகள்',
  'Plant': 'செடி',
};

// Common Tamil word dictionary for deep recursive DOM translation
const GENERAL_PHRASE_MAPPINGS: [RegExp, string][] = [
  [/\bVeerika Rose Garden\b/gi, 'வீரிகா ரோஜா கார்டன்'],
  [/\bVRG Nursery\b/gi, 'விஆர்ஜி நர்சரி'],
  [/\bPremier Plant Nursery · Pennagaram, Tamil Nadu\b/gi, 'முதன்மை தாவர நர்சரி · பென்னாகரம், தமிழ்நாடு'],
  [/\bPennagaram, Tamil Nadu\b/gi, 'பென்னாகரம், தமிழ்நாடு'],
  [/\bHealthy Roses &Exotic PlantsDelivered to Your Door 🌿\b/gi, 'ஆரோக்கியமான ரோஜா & அரிய செடிகள் உங்கள் வீட்டு வாசலுக்கு 🌿'],
  [/\bHealthy Roses & Exotic Plants Delivered to Your Door 🌿\b/gi, 'ஆரோக்கியமான ரோஜா & அரிய செடிகள் உங்கள் வீட்டு வாசலுக்கு 🌿'],
  [/\bPremium hybrid roses, grafted fruit trees, jasmine & organic fertilizers.*?across India\./gi, 'பிரீமியம் ஹைப்ரிட் ரோஜாக்கள், ஒட்டு மா/பழ மரங்கள், மல்லிகை & இயற்கை உரங்கள் — இந்தியா முழுவதும் பாதுகாப்பான டெலிவரிக்கு 7 நாள் வேர் ஈரப்பதம் பாதுகாப்புடன் அனுப்பப்படுகிறது.'],
  [/\bRose Varieties\b/gi, 'ரோஜா வகைகள்'],
  [/\bRose Plants\b/gi, 'ரோஜா வகைகள்'],
  [/\bHerbal Plants\b/gi, 'மூலிகைச் செடிகள்'],
  [/\bJasmine Varieties\b/gi, 'மல்லி பூ வகைகள்'],
  [/\bCreeper Roses\b/gi, 'கொடி ரோஸ் வகைகள்'],
  [/\bMiniature Roses\b/gi, 'மினியேச்சர் ரோஸ் வகைகள்'],
  [/\bRare & Exotic Roses\b/gi, 'அரிய வகை ரோஜாக்கள்'],
  [/\bFruit Plants\b/gi, 'பழ மரங்கள்'],
  [/\bFlowering Plants\b/gi, 'பூச்செடிகள்'],
  [/\bLive Plant\b/gi, 'உயிருள்ள பண்ணை செடி'],
  [/\bLive Plants\b/gi, 'உயிருள்ள பண்ணை செடிகள்'],
  [/\bMun coeur\b/gi, 'மான் கர் ரோஜா'],
  [/\bTaiwan pink guva\b/gi, 'தைவான் பிங்க் கொய்யா'],
  [/\bMini beetroot guva\b/gi, 'மினி பீட்ரூட் கொய்யா'],
  [/\bPerfume breeze light pink\b/gi, 'பெர்பியூம் ப்ரீஸ் லைட் பிங்க் ரோஜா'],
  [/\bPerfume breeze\b/gi, 'பெர்பியூம் ப்ரீஸ் ரோஜா'],
  [/\bGuva\b/gi, 'கொய்யா'],
  [/\bGuava\b/gi, 'கொய்யா'],
  [/\bApple Red rose offer\b/gi, 'ஆப்பிள் ரெட் ரோஸ் சலுகை'],
  [/\bApple Red Rose\b/gi, 'ஆப்பிள் ரெட் ரோஸ்'],
  [/\bSeven Days Rose\b/gi, '7 நாட்கள் ரோஜா'],
  [/\b7 Days Rose \(Everblooming Red\)\b/gi, '7 நாட்கள் ரோஜா (எவர்ப்ளூமிங் ரெட்)'],
  [/\b7 Days Rose\b/gi, '7 நாட்கள் ரோஜா'],
  [/\bNaatu Rose \(Country Paneer Rose\)\b/gi, 'நாட்டு பன்னீர் ரோஸ்'],
  [/\bNaatu Rose\b/gi, 'நாட்டு ரோஜா'],
  [/\bPaneer Butter Rose\b/gi, 'பன்னீர் பட்டர் ரோஜா'],
  [/\bOrchid Rose \(Free shipping\)\b/gi, 'ஆர்க்கிட் ரோஸ் (இலவச டெலிவரி)'],
  [/\bOrchid Rose\b/gi, 'ஆர்க்கிட் ரோஸ்'],
  [/\bPink Fairy Rose \(Polyantha\)\b/gi, 'பிங்க் ஃபேரி ரோஸ்'],
  [/\bPink Fairy Rose\b/gi, 'பிங்க் ஃபேரி ரோஸ்'],
  [/\bMargo Koster Pink Rose\b/gi, 'மார்கோ கோஸ்டர் பிங்க் ரோஸ்'],
  [/\bGreen Water Apple Plant\b/gi, 'பச்சை வாட்டர் ஆப்பிள் செடி'],
  [/\bRed Water Apple Plant\b/gi, 'சிவப்பு வாட்டர் ஆப்பிள் செடி'],
  [/\bWhite Water Apple Plant\b/gi, 'வெள்ளை வாட்டர் ஆப்பிள் செடி'],
  [/\bGreen Water Apple\b/gi, 'பச்சை வாட்டர் ஆப்பிள்'],
  [/\bRed Water Apple\b/gi, 'சிவப்பு வாட்டர் ஆப்பிள்'],
  [/\bWhite Water Apple\b/gi, 'வெள்ளை வாட்டர் ஆப்பிள்'],
  [/\bWater Apple\b/gi, 'வாட்டர் ஆப்பிள் (பன்னீர் ஜம்பு)'],
  [/\bButton Pink Rose\b/gi, 'பட்டன் பிங்க் ரோஸ்'],
  [/\b7days rose and button panner combo\b/gi, '7 நாட்கள் ரோஜா & பட்டன் பன்னீர் சேர்க்கை'],
  [/\bRestock alert\b/gi, 'மீண்டும் இருப்பில் வந்துள்ளது'],
  [/\bSunday Special offer\b/gi, 'ஞாயிறு சிறப்பு சலுகை'],
  [/\bSunday Rose Combo\b/gi, 'ஞாயிறு ரோஜா காம்போ'],
  [/\bBEST ON SUNDAY – ROSE COMBO OFFER\b/gi, 'ஞாயிறு சிறப்பு ரோஜா காம்போ சலுகை'],
  [/\bBest Seller Combo\b/gi, 'அதிக விற்பனை காம்போ'],
  [/\bLimited Stock Offer\b/gi, 'குறைந்த இருப்பு சலுகை'],
  [/\bSpecial Offer\b/gi, 'சிறப்பு சலுகை'],
  [/\bCombos & Offers\b/gi, 'காம்போ சலுகைகள்'],
  [/\bEXTRA SAVINGS\b/gi, 'கூடுதல் சேமிப்பு'],
  [/\bSpecial Plant Combo Offers\b/gi, 'சிறப்பு செடி காம்போ சலுகைகள்'],
  [/\bHand-picked plant bundles directly from.*?delivery\./gi, 'வீரிகா ரோஜா கார்டன் பண்ணையிலிருந்து நேரடியாக பிரத்யேக காம்போ தள்ளுபடி & பண்ணை டெலிவரியுடன் கூடிய செடிகள் தொகுப்பு.'],
  [/\bHealthy Grafted Saplings\b/gi, 'ஆரோக்கியமான ஒட்டுச்செடிகள்'],
  [/\bExpress Moisture Packed\b/gi, 'ஈரப்பதம் குறையாத பேக்கிங்'],
  [/\b1-IN-1 SPECIAL\b/gi, '1-ல்-1 சிறப்பு சலுகை'],
  [/\b2-IN-1 SPECIAL\b/gi, '2-ல்-1 சிறப்பு சலுகை'],
  [/\b3-IN-1 SPECIAL\b/gi, '3-ல்-1 சிறப்பு சலுகை'],
  [/\bFREE SHIPPING\b/gi, 'இலவச டெலிவரி'],
  [/\bFree Shipping\b/gi, 'இலவச டெலிவரி'],
  [/\bFree Delivery \(TN\)\b/gi, 'இலவச டெலிவரி (TN)'],
  [/\bFREE DELIVERY \(TN ONLY\)\b/gi, 'இலவச டெலிவரி (தமிழ்நாடு மட்டும்)'],
  [/\bIncludes (\d+) Farm Plants:\b/gi, 'சேர்க்கப்பட்ட பண்ணை செடிகள் ($1):'],
  [/\bAdd Combo Package to Cart \(₹(\d+)\)\b/gi, 'காம்போ தொகுப்பை கூடையில் சேர்க்கவும் (₹$1)'],
  [/\bAdd Combo Package to Cart\b/gi, 'காம்போ தொகுப்பை கூடையில் சேர்க்கவும்'],
  [/\bAdd Bundle • ₹(\d+)\b/gi, 'கூடையில் சேர்க்க • ₹$1'],
  [/\bAdd Bundle\b/gi, 'கூடையில் சேர்க்க'],
  [/\bSave ₹(\d+) \((\d+)% OFF\)\b/gi, 'ரூ. $1 சேமிப்பு ($2% தள்ளுபடி)'],
  [/\bSave ₹(\d+)\b/gi, 'ரூ. $1 சேமிப்பு'],
  [/(\d+)%\s*OFF\b/gi, '$1% தள்ளுபடி'],
  [/(\d+)%\s*off\b/gi, '$1% தள்ளுபடி'],
  [/\bUp to (\d+)% OFF\b/gi, '$1% வரை தள்ளுபடி'],
  [/\bBrowse by Type\b/gi, 'வகைகள்'],
  [/\bPlant Categories\b/gi, 'செடி வகைகள்'],
  [/\bView All (\d+) Plants\b/gi, 'அனைத்து $1 செடிகளையும் பார்க்க'],
  [/\bView All\b/gi, 'அனைத்தையும் பார்க்க'],
  [/\bFull Catalog\b/gi, 'முழு பட்டியல்'],
  [/\bOur Collection\b/gi, 'எங்கள் தொகுப்பு'],
  [/\bAll Plants\b/gi, 'அனைத்து செடிகள்'],
  [/\bShop now\b/gi, 'வாங்கவும்'],
  [/(\d+)\s+plants\b/gi, '$1 செடிகள்'],
  [/\bVERIFIED BUYER PLANT PHOTOS\b/gi, 'வாடிக்கையாளர் செடி புகைப்படங்கள்'],
  [/\bCustomer Photo Reviews\b/gi, 'வாடிக்கையாளர் புகைப்படக் கருத்துகள்'],
  [/\bReal photos & feedback uploaded by plant lovers directly from their home & terrace gardens\./gi, 'வாடிக்கையாளர்கள் தங்கள் வீட்டு மற்றும் மாடித் தோட்டத்திலிருந்து நேரடியாகப் பகிர்ந்த புகைப்படங்கள் & கருத்துகள்.'],
  [/\b4\.9 \/ 5\.0 Rating\b/gi, '4.9 / 5.0 மதிப்பீடு'],
  [/\b500\+ Verified Sapling Deliveries\b/gi, '500+ உறுதிப்படுத்தப்பட்ட செடி டெலிவரிகள்'],
  [/\bCustomer Photo\b/gi, 'வாடிக்கையாளர் புகைப்படம்'],
  [/\bClick to Zoom\b/gi, 'பெரிதாக்க அழுத்தவும்'],
  [/\bVerified Buyer\b/gi, 'உறுதிப்படுத்தப்பட்ட வாங்குபவர்'],
  [/\bCustomer Love\b/gi, 'வாடிக்கையாளர் அன்பு'],
  [/\bWhat Customers Say\b/gi, 'வாடிக்கையாளர்கள் கூறுவது'],
  [/\bVisit Our Farm\b/gi, 'எங்கள் பண்ணையைப் பார்வையிட'],
  [/\bCome Visit Veerika Rose Garden\b/gi, 'வீரிகா ரோஜா கார்டனுக்கு வருகை தாருங்கள்'],
  [/\bShop Plants\b/gi, 'செடிகளை வாங்க'],
  [/\bExpert AI Chat\b/gi, 'தாவர நிபுணர் AI'],
  [/\bQuick Links\b/gi, 'முக்கிய இணைப்புகள்'],
  [/\bShop All Plants\b/gi, 'அனைத்து செடிகள்'],
  [/\bTrack My Order\b/gi, 'ஆர்டரைக் கண்காணிக்கவும்'],
  [/\bShipping Policy\b/gi, 'டெலிவரி கொள்கை'],
  [/\bRefund Policy\b/gi, 'பணத்திருப்புக் கொள்கை'],
  [/\bCart \((\d+)\)\b/gi, 'கூடை ($1)'],
  [/\bStarting at\b/gi, 'ஆரம்ப விலை'],
  [/\b10K\+ Happy Customers\b/gi, '10,000+ மகிழ்ச்சியான வாடிக்கையாளர்கள்'],
  [/\b7-Day Root Protection\b/gi, '7-நாள் வேர் பாதுகாப்பு'],
  [/\bLive arrival guaranteed\b/gi, 'உயிருடன் வந்து சேரும் உத்தரவாதம்'],
  [/\bPhonePe Safe Payment\b/gi, 'போன்பே பாதுகாப்பான கட்டணம்'],
  [/\b100% encrypted checkout\b/gi, '100% பாதுகாப்பான பரிவர்த்தனை'],
  [/\bOrganic Nursery\b/gi, 'இயற்கை நர்சரி'],
  [/\bChemical-free cultivation\b/gi, 'ரசாயனமற்ற இயற்கை விவசாயம்'],
  [/\bFree Expert Support\b/gi, 'இலவச நிபுணர் உதவி'],
  [/\bCall \+ WhatsApp helpline\b/gi, 'அழைப்பு & வாட்ஸ்அப் உதவி'],
  [/\b★ Top Rated\b/gi, '★ சிறந்த மதிப்பீடு'],
  [/\bBest Sellers\b/gi, 'அதிக விற்பனை'],
  [/\bExplore All\b/gi, 'அனைத்தும் பார்க்க'],
  [/\bHandpicked Selection\b/gi, 'தேர்ந்தெடுக்கப்பட்ட தொகுப்பு'],
  [/\bFeatured Varieties\b/gi, 'சிறப்பு வகைகள்'],
  [/\bExplore All Plants\b/gi, 'அனைத்து செடிகளையும் பார்க்க'],
  [/\bWhatsApp Order\b/gi, 'வாட்ஸ்அப் ஆர்டர்'],
  [/\bPlant Varieties\b/gi, 'செடி வகைகள்'],
  [/\bCustomer Rating\b/gi, 'வாடிக்கையாளர் மதிப்பீடு'],
  [/\bOrders Delivered\b/gi, 'ஆர்டர்கள் விநியோகம்'],
  [/\bDutch Hybrid Rose in Ceramic 3D Pot\b/gi, 'செராமிக் தொட்டியில் டச்சு ஹைப்ரிட் ரோஜா'],
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

    // Check regex mappings
    for (const [regex, replacement] of GENERAL_PHRASE_MAPPINGS) {
      if (regex.test(trimmed)) {
        return trimmed.replace(regex, replacement);
      }
    }

    return fallback || key;
  }, [language]);

  const getProductName = useCallback((product: { name: string; englishName?: string; tamilName?: string }): string => {
    if (!product) return '';
    if (language === 'ta') {
      const trimmedTa = (product.tamilName || '').trim();
      const engName = (product.englishName || product.name || '').trim();
      // If tamilName exists and is distinct from englishName, return it
      if (trimmedTa && trimmedTa.toLowerCase() !== engName.toLowerCase()) {
        return trimmedTa;
      }
      // Check translations for product name
      const translated = t(engName);
      if (translated && translated !== engName) {
        return translated;
      }
      return trimmedTa || engName;
    }
    return product.englishName || product.name;
  }, [language, t]);

  const getCategoryName = useCallback((category: { name: string; tamilName?: string }): string => {
    if (!category) return '';
    if (language === 'ta') {
      if (category.tamilName && category.tamilName.trim()) {
        // Strip out any bracketed English suffix like "(Combos)" or "(Herbals)"
        const cleanTamil = category.tamilName.replace(/\s*\([a-zA-Z\s&]+\)/g, '').trim();
        if (cleanTamil) return cleanTamil;
      }
      return t(category.name);
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
        }

        // Apply general phrase mappings
        for (const [regex, replacement] of GENERAL_PHRASE_MAPPINGS) {
          if (regex.test(newText)) {
            newText = newText.replace(regex, replacement);
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
