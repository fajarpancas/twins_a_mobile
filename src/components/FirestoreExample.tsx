import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import FirestoreService, {
  FirestoreDocument,
} from '../services/FirestoreService';

const FirestoreExample = () => {
  const [collectionData, setCollectionData] = useState<FirestoreDocument[]>([]);
  const [singleDoc, setSingleDoc] = useState<FirestoreDocument | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);

  // Nama koleksi contoh
  const COLLECTION_NAME = 'orders';

  const handleGetCollection = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getCollection(COLLECTION_NAME);
      setCollectionData(data);
      console.log('Collection data:', data);
    } catch {
      Alert.alert('Error', 'Gagal mengambil data koleksi');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDocument = async (id: string) => {
    setLoading(true);
    try {
      const doc = await FirestoreService.getDocument(COLLECTION_NAME, id);
      setSingleDoc(doc);
      console.log('Single document:', doc);
      if (!doc) {
        Alert.alert('Info', 'Dokumen tidak ditemukan');
      }
    } catch {
      Alert.alert('Error', 'Gagal mengambil dokumen');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Validation', 'Nama item tidak boleh kosong');
      return;
    }

    setLoading(true);
    try {
      const newDoc = await FirestoreService.addDocument(COLLECTION_NAME, {
        name: newItemName,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Success', `Item ditambahkan dengan ID: ${newDoc.id}`);
      setNewItemName('');
      // Refresh list
      handleGetCollection();
    } catch {
      Alert.alert('Error', 'Gagal menambahkan item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Firestore Example</Text>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Tambah Item Baru</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama Item"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <Button
          title={loading ? 'Loading...' : 'Tambah Item'}
          onPress={handleAddItem}
          disabled={loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.subHeader}>Data Koleksi ({COLLECTION_NAME})</Text>
        <Button
          title="Ambil Semua Data"
          onPress={handleGetCollection}
          disabled={loading}
        />
        {collectionData.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemText}>ID: {item.id}</Text>
            <Text style={styles.itemText}>Name: {item.name}</Text>
            <Button
              title="Lihat Detail"
              onPress={() => handleGetDocument(item.id)}
            />
          </View>
        ))}
      </View>

      {singleDoc && (
        <View style={styles.section}>
          <Text style={styles.subHeader}>Detail Dokumen Terpilih</Text>
          <View style={styles.detailCard}>
            <Text>{JSON.stringify(singleDoc, null, 2)}</Text>
          </View>
          <Button title="Tutup" onPress={() => setSingleDoc(null)} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemText: {
    marginBottom: 4,
  },
  detailCard: {
    backgroundColor: '#e1f5fe',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
});

export default FirestoreExample;
