import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

/**
 * Tipe data generik untuk dokumen Firestore
 */
export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  description: string;
  price: number;
  stockId?: string; // Reference to stock_opname document
}

export interface OrderDocument extends FirestoreDocument {
  name: string;
  last_4_digits_phone: string;
  orders: OrderItem[];
  status: 'pending' | 'packing' | 'sent' | 'hnr';
  payment_status: 'full' | 'half' | 'none';
  is_book_paid?: boolean;
  is_shipping_paid?: boolean;
  updated_at: string;
  created_at: string;
  delivery_address?: string;
  delivery_type: string;
  additional_notes?: string;
  unique_code?: number;
}

export interface StockOpnameDocument extends FirestoreDocument {
  book_name: string;
  price: number;
  stock: number;
  created_at?: string;
}

export interface ExpenseDocument extends FirestoreDocument {
  name: string;
  price: number;
  qty: number;
  total: number;
  created_at?: string;
}

class FirestoreService {
  /**
   * Mengambil semua dokumen dari sebuah koleksi
   * @param collectionName Nama koleksi
   * @param orderByField Field untuk sorting (opsional)
   * @param orderDirection Arah sorting ('asc' atau 'desc') (opsional)
   * @returns Promise berisi array dokumen
   */
  async getCollection(
    collectionName: string,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
  ): Promise<FirestoreDocument[]> {
    try {
      let query: FirebaseFirestoreTypes.Query =
        firestore().collection(collectionName);

      if (orderByField) {
        query = query.orderBy(orderByField, orderDirection);
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return data;
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Mengambil satu dokumen berdasarkan ID
   * @param collectionName Nama koleksi
   * @param docId ID dokumen
   * @returns Promise berisi data dokumen atau null jika tidak ditemukan
   */
  async getDocument(
    collectionName: string,
    docId: string,
  ): Promise<FirestoreDocument | null> {
    try {
      const doc = await firestore().collection(collectionName).doc(docId).get();
      if ((doc as any).exists) {
        return {
          id: doc.id,
          ...doc.data(),
        };
      }
      return null;
    } catch (error) {
      console.error(
        `Error getting document ${docId} from ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Menambahkan dokumen baru ke koleksi
   * @param collectionName Nama koleksi
   * @param data Data yang akan disimpan
   * @returns Promise berisi dokumen yang baru dibuat
   */
  async addDocument(
    collectionName: string,
    data: any,
  ): Promise<FirestoreDocument> {
    try {
      const docRef = await firestore().collection(collectionName).add(data);
      return {
        id: docRef.id,
        ...data,
      };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Mengurangi stok barang berdasarkan item order
   * @param items Daftar item order
   */
  async deductStock(items: OrderItem[]): Promise<void> {
    try {
      const batch = firestore().batch();
      const stockUpdates = new Map<string, number>();

      items.forEach(item => {
        if (item.stockId) {
          const currentCount = stockUpdates.get(item.stockId) || 0;
          stockUpdates.set(item.stockId, currentCount + 1);
        }
      });

      if (stockUpdates.size === 0) return;

      stockUpdates.forEach((count, stockId) => {
        const ref = firestore().collection('stock_opname').doc(stockId);
        batch.update(ref, {
          stock: firestore.FieldValue.increment(-count),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deducting stock:', error);
      // We don't throw here to avoid blocking the order creation if stock update fails,
      // but in a real app we might want to handle this better.
    }
  }

  /**
   * Mengembalikan stok barang (increment)
   * @param items Daftar item order
   */
  async restoreStock(items: OrderItem[]): Promise<void> {
    try {
      const batch = firestore().batch();
      const stockUpdates = new Map<string, number>();

      items.forEach(item => {
        if (item.stockId) {
          const currentCount = stockUpdates.get(item.stockId) || 0;
          stockUpdates.set(item.stockId, currentCount + 1);
        }
      });

      if (stockUpdates.size === 0) return;

      stockUpdates.forEach((count, stockId) => {
        const ref = firestore().collection('stock_opname').doc(stockId);
        batch.update(ref, {
          stock: firestore.FieldValue.increment(count),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error restoring stock:', error);
    }
  }

  /**
   * Mengupdate dokumen yang ada
   * @param collectionName Nama koleksi
   * @param docId ID dokumen
   * @param data Partial data yang akan diupdate
   */
  async updateDocument(
    collectionName: string,
    docId: string,
    data: Partial<FirestoreDocument>,
  ): Promise<void> {
    try {
      await firestore()
        .collection(collectionName)
        .doc(docId)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error(
        `Error updating document ${docId} in ${collectionName}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Menghapus dokumen
   * @param collectionName Nama koleksi
   * @param docId ID dokumen
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      await firestore().collection(collectionName).doc(docId).delete();
    } catch (error) {
      console.error(
        `Error deleting document ${docId} from ${collectionName}:`,
        error,
      );
      throw error;
    }
  }
}

export default new FirestoreService();
