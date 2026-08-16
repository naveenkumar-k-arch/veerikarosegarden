/**
 * Firestore Server-Side Persistence Layer
 * Uses Firebase REST API (no admin SDK needed) to persist orders
 * across all serverless requests.
 */

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'veerikarosegarden-1c712';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) obj[k] = fromFirestoreValue(v);
    return obj;
  }
  return null;
}

function docToOrder(doc: any): any {
  if (!doc?.fields) return null;
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields as Record<string, any>)) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

export async function firestoreSaveOrder(order: any): Promise<void> {
  try {
    const docId = order.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fields: Record<string, any> = {};

    // IMPORTANT: Strip paymentProofUrl (base64 image, can be 500KB–2MB) before saving to Firestore.
    // Firestore has a 1MB document size limit — storing base64 images causes silent failures.
    // The screenshot is already persisted safely in Postgres via the |||PROOF||| notes column.
    const { paymentProofUrl: _stripped, ...safeOrder } = order;
    for (const [k, v] of Object.entries(safeOrder)) fields[k] = toFirestoreValue(v);

    const url = `${FIRESTORE_BASE}/orders/${docId}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.error('Firestore saveOrder error:', err);
  }
}

export async function firestoreGetAllOrders(): Promise<any[]> {
  try {
    const url = `${FIRESTORE_BASE}/orders?pageSize=200`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.documents) return [];
    return data.documents.map(docToOrder).filter(Boolean);
  } catch (err) {
    console.error('Firestore getAllOrders error:', err);
    return [];
  }
}

export async function firestoreUpdateOrder(orderId: string, updates: Record<string, any>): Promise<void> {
  try {
    const docId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const url = `${FIRESTORE_BASE}/orders/${docId}`;

    // First get the existing document
    const getRes = await fetch(url);
    const existing = await getRes.json();
    const existingFields = existing?.fields || {};

    // Merge with updates
    const mergedFields = { ...existingFields };
    for (const [k, v] of Object.entries(updates)) {
      mergedFields[k] = toFirestoreValue(v);
    }

    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: mergedFields })
    });
  } catch (err) {
    console.error('Firestore updateOrder error:', err);
  }
}

export async function firestoreDeleteOrder(orderId: string): Promise<void> {
  try {
    const docId = orderId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const url = `${FIRESTORE_BASE}/orders/${docId}`;
    await fetch(url, {
      method: 'DELETE'
    }).catch(() => null);
  } catch (err) {
    console.error('Firestore deleteOrder error:', err);
  }
}

