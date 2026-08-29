/**
 * Address Parsing & Formatting Utilities
 * 
 * Provides robust parsing and full address string generation for:
 * - WhatsApp notifications (Order Confirmation, Packing, Dispatch, Delivered)
 * - Admin order views, search, and invoice tables
 * - Delivery partner shipping labels
 * 
 * Handles Objects, JSON strings, plain text strings, and all property aliases.
 */

export interface ParsedAddress {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  houseNo: string;
  street: string;
  landmark: string;
  villageTown: string;
  district: string;
  state: string;
  pincode: string;
  addressType: string;
  fullAddressString: string;
}

/**
 * Parses any raw address (Object, JSON string, or plain text) into a structured ParsedAddress object.
 */
export function parseFullAddress(rawAddr: any, fallbackName = '', fallbackPhone = ''): ParsedAddress {
  let addrObj: any = {};

  if (!rawAddr) {
    addrObj = {};
  } else if (typeof rawAddr === 'object') {
    addrObj = rawAddr;
  } else if (typeof rawAddr === 'string') {
    const trimmed = rawAddr.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('"{') && trimmed.endsWith('}"'))) {
      try {
        const unescaped = trimmed.startsWith('"{') ? JSON.parse(trimmed) : trimmed;
        addrObj = typeof unescaped === 'string' ? JSON.parse(unescaped) : unescaped;
      } catch {
        addrObj = { street: trimmed };
      }
    } else {
      // Plain text address - extract 6-digit Indian pincode if present
      const pinMatch = trimmed.match(/\b\d{6}\b/);
      const extractedPin = pinMatch ? pinMatch[0] : '';
      
      // Clean string
      const cleanText = trimmed.replace(/\s+/g, ' ').trim();
      return {
        fullName: fallbackName.trim(),
        phone: fallbackPhone.trim(),
        alternatePhone: '',
        houseNo: '',
        street: cleanText,
        landmark: '',
        villageTown: '',
        district: '',
        state: 'Tamil Nadu',
        pincode: extractedPin,
        addressType: 'Home',
        fullAddressString: cleanText
      };
    }
  }

  // Extract all property aliases
  const fullName = String(
    addrObj.fullName ||
    addrObj.name ||
    addrObj.customerName ||
    addrObj.receiverName ||
    fallbackName ||
    ''
  ).trim();

  const phone = String(
    addrObj.phone ||
    addrObj.customerPhone ||
    addrObj.phoneNumber ||
    addrObj.mobile ||
    fallbackPhone ||
    ''
  ).trim();

  const alternatePhone = String(
    addrObj.alternatePhone ||
    addrObj.altPhone ||
    addrObj.secondaryPhone ||
    addrObj.altMobile ||
    ''
  ).trim();

  const houseNo = String(
    addrObj.houseNo ||
    addrObj.doorNo ||
    addrObj.house_no ||
    addrObj.door_no ||
    addrObj.flatNo ||
    addrObj.flat_no ||
    addrObj.plotNo ||
    addrObj.plot_no ||
    addrObj.addressLine1 ||
    addrObj.line1 ||
    ''
  ).trim();

  const street = String(
    addrObj.street ||
    addrObj.streetAddress ||
    addrObj.street_address ||
    addrObj.area ||
    addrObj.road ||
    addrObj.addressLine2 ||
    addrObj.line2 ||
    ''
  ).trim();

  const landmark = String(
    addrObj.landmark ||
    addrObj.nearBy ||
    addrObj.landMark ||
    addrObj.near ||
    ''
  ).trim();

  const villageTown = String(
    addrObj.villageTown ||
    addrObj.village_town ||
    addrObj.village ||
    addrObj.town ||
    addrObj.city ||
    addrObj.taluk ||
    ''
  ).trim();

  const district = String(
    addrObj.district ||
    addrObj.dist ||
    addrObj.county ||
    ''
  ).trim();

  const state = String(
    addrObj.state ||
    addrObj.province ||
    'Tamil Nadu'
  ).trim();

  const pincode = String(
    addrObj.pincode ||
    addrObj.postalCode ||
    addrObj.pin ||
    addrObj.zip ||
    addrObj.zipcode ||
    ''
  ).trim();

  const addressType = String(addrObj.addressType || 'Home').trim();

  // Construct complete formatted full address without dropping any components
  const parts = [
    houseNo,
    street,
    landmark ? `(Landmark: ${landmark})` : '',
    villageTown,
    district,
    state,
    pincode ? `PIN: ${pincode}` : ''
  ].filter(Boolean);

  const fullAddressString = parts.length > 0
    ? parts.join(', ')
    : (typeof rawAddr === 'string' ? rawAddr : 'Address not specified');

  return {
    fullName,
    phone,
    alternatePhone,
    houseNo,
    street,
    landmark,
    villageTown,
    district,
    state,
    pincode,
    addressType,
    fullAddressString
  };
}

/**
 * Returns a clean, human-readable full address string.
 */
export function formatAddress(address: any, fallbackName = '', fallbackPhone = ''): string {
  if (!address) return 'No delivery address recorded';
  return parseFullAddress(address, fallbackName, fallbackPhone).fullAddressString;
}
