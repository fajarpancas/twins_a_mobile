import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import FirestoreService, {
  StockOpnameDocument,
} from '../services/FirestoreService';

const COLLECTION_NAME = 'stock_opname';

const StockOpnameScreen = () => {
  const [bookName, setBookName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [items, setItems] = useState<StockOpnameDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Stock State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockOpnameDocument | null>(
    null,
  );
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await FirestoreService.getCollection(COLLECTION_NAME);
      // Sort by created_at desc if available, otherwise unsorted
      const sortedData = (data as StockOpnameDocument[]).sort((a, b) => {
        if (a.created_at && b.created_at) {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        return 0;
      });
      setItems(sortedData);
    } catch (error) {
      console.error('Error fetching stock opname:', error);
      Alert.alert('Error', 'Gagal mengambil data stock opname');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async () => {
    if (!bookName || !price || !stock) {
      Alert.alert('Validasi', 'Mohon isi semua field');
      return;
    }

    setSubmitting(true);
    try {
      const newItem: Omit<StockOpnameDocument, 'id'> = {
        book_name: bookName,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        created_at: new Date().toISOString(),
      };

      await FirestoreService.addDocument(COLLECTION_NAME, newItem);
      Alert.alert('Sukses', 'Data stock opname berhasil disimpan');

      // Reset form
      setBookName('');
      setPrice('');
      setStock('');

      // Refresh list
      fetchItems();
    } catch (error) {
      console.error('Error saving stock opname:', error);
      Alert.alert('Error', 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (item: StockOpnameDocument) => {
    setSelectedItem(item);
    setNewName(item.book_name);
    setNewPrice(item.price.toString());
    setNewStock(item.stock.toString());
    setEditModalVisible(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem || !newName || !newPrice || !newStock) {
      Alert.alert('Validasi', 'Mohon isi semua field');
      return;
    }

    try {
      await FirestoreService.updateDocument(COLLECTION_NAME, selectedItem.id, {
        book_name: newName,
        price: parseFloat(newPrice),
        stock: parseInt(newStock, 10),
      });
      Alert.alert('Sukses', 'Data barang berhasil diperbarui');
      setEditModalVisible(false);
      fetchItems();
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('Error', 'Gagal update data barang');
    }
  };

  const handleDeleteItem = (item: StockOpnameDocument) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus "${item.book_name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteDocument(COLLECTION_NAME, item.id);
              Alert.alert('Sukses', 'Barang berhasil dihapus');
              fetchItems();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Gagal menghapus barang');
            }
          },
        },
      ],
    );
  };

  const filteredItems = items.filter(item =>
    item.book_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);

  const renderItem = ({ item }: { item: StockOpnameDocument }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemMainContent}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.book_name}</Text>
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>{item.stock}</Text>
            <Text style={styles.editIcon}>✎</Text>
          </View>
        </View>
        <Text style={styles.itemPrice}>
          Rp {item.price.toLocaleString('id-ID')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Input Stock Opname</Text>

        <Text style={styles.label}>Nama Buku</Text>
        <TextInput
          style={styles.input}
          value={bookName}
          onChangeText={setBookName}
          placeholder="Masukkan nama buku"
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Harga</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Stok</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>Daftar Stock</Text>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Buku:</Text>
            <Text style={styles.totalValue}>{totalStock}</Text>
          </View>
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari nama buku..."
        />

        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Tidak ada buku yang cocok'
                  : 'Belum ada data stock'}
              </Text>
            }
          />
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Barang</Text>

            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nama Barang"
            />

            <TextInput
              style={styles.modalInput}
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              placeholder="Harga"
            />

            <TextInput
              style={styles.modalInput}
              value={newStock}
              onChangeText={setNewStock}
              keyboardType="numeric"
              placeholder="Stok"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonClose]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.textStyle}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonSave]}
                onPress={handleUpdateItem}
              >
                <Text style={styles.textStyle}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#2e7d32',
    marginRight: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMainContent: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
    marginRight: 4,
  },
  editIcon: {
    fontSize: 12,
    color: '#1976D2',
  },
  itemPrice: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonClose: {
    backgroundColor: '#95a5a6',
  },
  buttonSave: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default StockOpnameScreen;
