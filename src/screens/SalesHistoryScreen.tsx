import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FirestoreService, {
  HistoricalDataDocument,
} from '../services/FirestoreService';

const COLLECTION_NAME = 'sales_history';

const SalesHistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoricalDataDocument[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [capital, setCapital] = useState('');
  const [revenue, setRevenue] = useState('');
  const [totalBooks, setTotalBooks] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getCollection(COLLECTION_NAME);
      // Sort by created_at desc
      const sortedData = (data as HistoricalDataDocument[]).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      setHistoryData(sortedData);
    } catch (error) {
      console.error('Error fetching history data:', error);
      Alert.alert('Error', 'Gagal mengambil data history');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const resetForm = () => {
    setDescription('');
    setCapital('');
    setRevenue('');
    setTotalBooks('');
  };

  const handleSave = async () => {
    if (!description || !capital || !revenue || !totalBooks) {
      Alert.alert('Validasi', 'Mohon lengkapi semua field');
      return;
    }

    const capitalValue = parseInt(capital.replace(/\D/g, ''), 10) || 0;
    const revenueValue = parseInt(revenue.replace(/\D/g, ''), 10) || 0;
    const totalBooksValue = parseInt(totalBooks.replace(/\D/g, ''), 10) || 0;
    const profitValue = revenueValue - capitalValue;

    setSaving(true);
    try {
      const newEntry: Omit<HistoricalDataDocument, 'id'> = {
        description,
        capital: capitalValue,
        revenue: revenueValue,
        profit: profitValue,
        total_books: totalBooksValue,
        created_at: new Date().toISOString(),
      };

      await FirestoreService.addDocument(COLLECTION_NAME, newEntry);
      setModalVisible(false);
      resetForm();
      fetchData();
      Alert.alert('Sukses', 'Data history berhasil disimpan');
    } catch (error) {
      console.error('Error saving history:', error);
      Alert.alert('Error', 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus data ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteDocument(COLLECTION_NAME, id);
              fetchData();
            } catch (error) {
              console.error('Error deleting history:', error);
              Alert.alert('Error', 'Gagal menghapus data');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: HistoricalDataDocument }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.description}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Total Modal:</Text>
        <Text style={styles.value}>Rp {item.capital.toLocaleString()}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Total Pemasukan:</Text>
        <Text style={[styles.value, { color: '#2ecc71' }]}>
          Rp {item.revenue.toLocaleString()}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Keuntungan:</Text>
        <Text
          style={[
            styles.value,
            {
              fontWeight: 'bold',
              color: item.profit >= 0 ? '#27ae60' : '#e74c3c',
            },
          ]}
        >
          Rp {item.profit.toLocaleString()}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.label}>Buku Terjual:</Text>
        <Text style={styles.value}>{item.total_books} Buku</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History Penjualan Lama</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Tambah Data</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={historyData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Belum ada data history penjualan.
            </Text>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah History Penjualan</Text>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>
                Keterangan (cth: Rekap 2023)
              </Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Masukkan keterangan..."
              />

              <Text style={styles.inputLabel}>Total Modal (Rp)</Text>
              <TextInput
                style={styles.input}
                value={capital}
                onChangeText={setCapital}
                keyboardType="numeric"
                placeholder="0"
              />

              <Text style={styles.inputLabel}>Total Pemasukan (Rp)</Text>
              <TextInput
                style={styles.input}
                value={revenue}
                onChangeText={setRevenue}
                keyboardType="numeric"
                placeholder="0"
              />

              <Text style={styles.inputLabel}>Total Buku Terjual (Qty)</Text>
              <TextInput
                style={styles.input}
                value={totalBooks}
                onChangeText={setTotalBooks}
                keyboardType="numeric"
                placeholder="0"
              />

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>Estimasi Keuntungan:</Text>
                <Text style={styles.summaryValue}>
                  Rp{' '}
                  {(
                    (parseInt(revenue.replace(/\D/g, ''), 10) || 0) -
                    (parseInt(capital.replace(/\D/g, ''), 10) || 0)
                  ).toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  summaryContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
});

export default SalesHistoryScreen;
