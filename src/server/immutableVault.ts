import zlib from 'zlib';
import crypto from 'crypto';
import { getPrismaClient } from './prisma.js';

export interface ArchivedOrderPayload {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: any;
  items: Array<{
    productId?: string;
    sku?: string;
    name: string;
    tamilName?: string;
    price: number;
    mrp?: number;
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  packingCharge?: number;
  potCharge?: number;
  discount: number;
  grandTotal: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber?: string;
  courierName?: string;
  createdAt: string;
  archivedTimestamp: string;
}

export class ImmutableOrderVaultService {
  /**
   * Compresses an object into a compact base64 string using DEFLATE (saves >80% space)
   */
  public static compress(data: any): { compressedBase64: string; checksum: string; rawBytes: number; compressedBytes: number } {
    const rawJson = JSON.stringify(data);
    const checksum = crypto.createHash('sha256').update(rawJson, 'utf-8').digest('hex');
    const buffer = Buffer.from(rawJson, 'utf-8');
    const compressed = zlib.deflateSync(buffer, { level: 9 }); // Maximum compression
    return {
      compressedBase64: compressed.toString('base64'),
      checksum,
      rawBytes: buffer.length,
      compressedBytes: compressed.length
    };
  }

  /**
   * Decompresses a base64 string back into the authentic object and verifies its SHA-256 checksum
   */
  public static decompress(compressedBase64: string, expectedChecksum?: string): any {
    const buffer = Buffer.from(compressedBase64, 'base64');
    const decompressed = zlib.inflateSync(buffer);
    const rawJson = decompressed.toString('utf-8');

    if (expectedChecksum) {
      const calculatedHash = crypto.createHash('sha256').update(rawJson, 'utf-8').digest('hex');
      if (calculatedHash !== expectedChecksum) {
        throw new Error(`🚨 Cryptographic checksum mismatch in Immutable Vault for record!`);
      }
    }

    return JSON.parse(rawJson);
  }

  /**
   * Archives an order into the Append-Only Locked Vault.
   * If already archived, it will NOT be overwritten (Append-Only guarantee).
   */
  public static async archiveOrder(order: any): Promise<{ success: boolean; isNew: boolean; compressedBytes: number }> {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error('Database client not available');
    }

    const orderId = String(order.id || order.orderId);
    
    // Check if record is already archived and locked
    const existing = await (prisma as any).immutableOrderVault.findUnique({
      where: { orderId }
    });

    if (existing) {
      return { success: true, isNew: false, compressedBytes: Buffer.from(existing.compressedData, 'base64').length };
    }

    const payload: ArchivedOrderPayload = {
      orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '',
      shippingAddress: order.shippingAddress,
      items: (order.items || []).map((it: any) => ({
        productId: it.productId,
        sku: it.sku,
        name: it.name || it.productName,
        tamilName: it.tamilName || it.name,
        price: Number(it.price || 0),
        mrp: Number(it.mrp || it.price || 0),
        quantity: Number(it.quantity || 1),
        image: it.image || '/products/double-delight.jpeg'
      })),
      subtotal: Number(order.subtotal || 0),
      deliveryFee: Number(order.shippingCharge || order.deliveryFee || 0),
      packingCharge: Number(order.packingCharge || 0),
      potCharge: Number(order.potCharge || 0),
      discount: Number(order.discount || 0),
      grandTotal: Number(order.grandTotal || order.totalAmount || 0),
      orderStatus: order.orderStatus || order.status || 'PENDING',
      paymentStatus: order.paymentStatus || 'PENDING',
      paymentMethod: order.paymentMethod || 'RAZORPAY',
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      archivedTimestamp: new Date().toISOString()
    };

    const { compressedBase64, checksum, compressedBytes } = this.compress(payload);

    await (prisma as any).immutableOrderVault.create({
      data: {
        orderId,
        customerName: payload.customerName || 'Customer',
        customerPhone: payload.customerPhone || '0000000000',
        totalAmount: payload.grandTotal,
        itemCount: payload.items.length,
        checksum,
        compressedData: compressedBase64
      }
    });

    return { success: true, isNew: true, compressedBytes };
  }

  /**
   * Retrieves a verified authentic record from the locked vault
   */
  public static async getArchivedOrder(orderId: string): Promise<ArchivedOrderPayload | null> {
    const prisma = getPrismaClient();
    if (!prisma) return null;

    const record = await (prisma as any).immutableOrderVault.findUnique({
      where: { orderId }
    });

    if (!record) return null;
    return this.decompress(record.compressedData, record.checksum);
  }

  /**
   * Gets stats on the vault
   */
  public static async getVaultStats(): Promise<{ totalRecords: number; totalCompressedBytes: number; averageBytesPerOrder: number }> {
    const prisma = getPrismaClient();
    if (!prisma) return { totalRecords: 0, totalCompressedBytes: 0, averageBytesPerOrder: 0 };

    const records = await (prisma as any).immutableOrderVault.findMany({
      select: { compressedData: true }
    });

    let totalBytes = 0;
    records.forEach((r: any) => {
      totalBytes += Buffer.from(r.compressedData, 'base64').length;
    });

    return {
      totalRecords: records.length,
      totalCompressedBytes: totalBytes,
      averageBytesPerOrder: records.length > 0 ? Math.round(totalBytes / records.length) : 0
    };
  }
}
