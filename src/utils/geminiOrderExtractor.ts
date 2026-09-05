// Gemini AI Order Image Extractor Utility
// Extracts customer details, delivery address, ordered plant items, prices, and courier preferences from photos/screenshots

export interface ExtractedOrderItem {
  name: string;
  tamilName?: string;
  quantity: number;
  price: number;
}

export interface ExtractedOrderData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fullAddress: string;
  houseNo: string;
  street: string;
  villageTown: string;
  district: string;
  state: string;
  pincode: string;
  items: ExtractedOrderItem[];
  plantsText: string;
  grandTotal: number;
  courierName: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes: string;
  rawExtractedText?: string;
  imagePreviewUrl?: string;
}

const DEFAULT_GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY)) || '';

// Helper: Convert File to base64 data URL
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Helper: Downscale image if too large (over 2000px) to ensure super-fast upload and analysis
export const compressImageIfNeeded = async (dataUrl: string, maxDimension = 1800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(dataUrl);
        return;
      }

      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// Extract order details from base64 image data
export const extractOrderFromImage = async (
  imageBase64: string,
  authHeader?: string
): Promise<ExtractedOrderData> => {
  const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

  // 1. Try backend endpoint first
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch('/api/admin/orders/extract-from-image', {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64: cleanBase64, mimeType }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        return sanitizeExtractedOrderData(result.data, imageBase64);
      }
    }
  } catch (err) {
    console.warn('[Gemini Order Extractor] Backend route failed or unavailable, using direct client fallback:', err);
  }

  // 2. Direct client fallback using @google/genai & GEMINI_API_KEY
  try {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY;
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert order extraction AI for Veerika Rose Garden nursery in Tamil Nadu, India.
Analyze this order image (which could be a WhatsApp chat screenshot, a handwritten order slip, a paper receipt, bill, shipping parcel label, or handwritten note in English, Tamil, or Tanglish).

Carefully extract ALL customer and order details into this JSON structure:
{
  "customerName": "Full name of customer",
  "customerPhone": "10-digit mobile number without +91 or leading 0",
  "customerEmail": "Email or empty string",
  "fullAddress": "Complete doorstep shipping delivery address as written",
  "houseNo": "Door number / house / flat number",
  "street": "Street name / road / layout / area",
  "villageTown": "Village, town, or city",
  "district": "District (e.g. Dharmapuri, Salem, Krishnagiri, Chennai, Coimbatore, etc.)",
  "state": "Tamil Nadu",
  "pincode": "6-digit Indian PIN code",
  "items": [
    {
      "name": "Exact or standardized plant name",
      "quantity": 1,
      "price": 0
    }
  ],
  "plantsText": "Clean multiline string formatted with quantities, e.g.: 1. 2x 7 Days Yellow Rose\\n2. 1x Paneer Rose",
  "grandTotal": 0,
  "courierName": "Professional Courier – Reduced Soil",
  "paymentMethod": "WHATSAPP",
  "paymentStatus": "SUCCESS",
  "orderStatus": "CONFIRMED",
  "notes": "Any special customer instructions or delivery notes"
}

If any field is not explicitly mentioned, provide reasonable defaults (state: "Tamil Nadu", courierName: "Professional Courier – Reduced Soil", paymentMethod: "WHATSAPP", paymentStatus: "SUCCESS", orderStatus: "CONFIRMED").
Calculate grandTotal if prices are mentioned, else set to 0.
RESPOND STRICTLY WITH A SINGLE VALID JSON OBJECT ONLY (no markdown formatting, no code fences).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        prompt,
      ],
    });

    const rawText = (response.text || '').trim();
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON: ' + rawText.slice(0, 200));
      }
    }

    return sanitizeExtractedOrderData(parsedData, imageBase64);
  } catch (clientErr: any) {
    console.error('[Gemini Order Extractor] Client fallback failed:', clientErr);
    throw new Error(clientErr.message || 'Failed to extract order details from image with Gemini AI');
  }
};

// Helper: Sanitize & validate extracted data
const sanitizeExtractedOrderData = (data: any, imagePreviewUrl?: string): ExtractedOrderData => {
  const items: ExtractedOrderItem[] = Array.isArray(data.items) && data.items.length > 0
    ? data.items.map((it: any) => ({
        name: String(it.name || 'Nursery Plant').trim(),
        quantity: Math.max(1, parseInt(String(it.quantity || 1), 10) || 1),
        price: Math.max(0, parseFloat(String(it.price || 0)) || 0),
      }))
    : [];

  let plantsText = String(data.plantsText || '').trim();
  if (!plantsText && items.length > 0) {
    plantsText = items
      .map((it, idx) => `${idx + 1}. ${it.quantity > 1 ? it.quantity + 'x ' : ''}${it.name}`)
      .join('\n');
  }

  // Sanitize phone: 10 digits
  let phone = String(data.customerPhone || '').replace(/\D/g, '');
  if (phone.startsWith('91') && phone.length === 12) {
    phone = phone.slice(2);
  } else if (phone.length > 10) {
    phone = phone.slice(-10);
  }

  // Sanitize pincode: 6 digits
  let pincode = String(data.pincode || '').replace(/\D/g, '').slice(0, 6);
  if (!pincode && data.fullAddress) {
    const pinMatch = String(data.fullAddress).match(/\b\d{6}\b/);
    if (pinMatch) pincode = pinMatch[0];
  }

  // Calculate grand total if 0 and items have prices
  let total = parseFloat(String(data.grandTotal || 0)) || 0;
  if (total <= 0 && items.length > 0) {
    const sum = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    if (sum > 0) total = sum;
  }

  return {
    customerName: String(data.customerName || '').trim(),
    customerPhone: phone,
    customerEmail: String(data.customerEmail || '').trim(),
    fullAddress: String(data.fullAddress || '').trim(),
    houseNo: String(data.houseNo || '').trim(),
    street: String(data.street || '').trim(),
    villageTown: String(data.villageTown || '').trim(),
    district: String(data.district || '').trim(),
    state: String(data.state || 'Tamil Nadu').trim(),
    pincode,
    items,
    plantsText,
    grandTotal: total,
    courierName: String(data.courierName || 'Professional Courier – Reduced Soil').trim(),
    paymentMethod: String(data.paymentMethod || 'WHATSAPP').toUpperCase(),
    paymentStatus: String(data.paymentStatus || 'SUCCESS').toUpperCase(),
    orderStatus: String(data.orderStatus || 'CONFIRMED').toUpperCase(),
    notes: String(data.notes || '').trim(),
    rawExtractedText: String(data.rawExtractedText || '').trim(),
    imagePreviewUrl,
  };
};
