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
}

export interface OrderDocument extends FirestoreDocument {
  name: string;
  last_4_digits_phone: string;
  orders: OrderItem[];
  status: 'pending' | 'packing' | 'sent' | 'hnr';
  payment_status: 'full' | 'half' | 'none';
  updated_at: string;
  created_at: string;
  delivery_address?: string;
  delivery_type: string;
  additional_notes?: string;
  unique_code?: number;
}

class FirestoreService {
  /**
   * Mengambil semua dokumen dari sebuah koleksi
   * @param collectionName Nama koleksi
   * @returns Promise berisi array dokumen
   */
  async getCollection(collectionName: string): Promise<FirestoreDocument[]> {
    try {
      const snapshot = await firestore().collection(collectionName).get();
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
      const doc = await docRef.get();
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
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
