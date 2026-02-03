import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import FirestoreService, {
  OrderDocument,
  OrderItem,
  StockOpnameDocument,
} from '../services/FirestoreService';

interface AddOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (order: Omit<OrderDocument, 'id'>) => Promise<void>;
}

const AddOrderModal: React.FC<AddOrderModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState('express');
  const [paymentStatus, setPaymentStatus] =
    useState<OrderDocument['payment_status']>('none');
  const [items, setItems] = useState<OrderItem[]>([
    { id: Date.now().toString(), description: '', price: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  // State untuk data stock opname dan modal seleksi
  const [stockItems, setStockItems] = useState<StockOpnameDocument[]>([]);
  const [isSelectionModalVisible, setSelectionModalVisible] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      fetchStockItems();
    }
  }, [visible]);

  const fetchStockItems = async () => {
    try {
      const data = await FirestoreService.getCollection('stock_opname');
      setStockItems(data as StockOpnameDocument[]);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    }
  };

  const handleOpenSelection = (itemId: string) => {
    setActiveItemId(itemId);
    setSearchQuery(''); // Reset search query
    setSelectionModalVisible(true);
  };

  const handleSelectStockItem = (stockItem: StockOpnameDocument) => {
    if (activeItemId) {
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === activeItemId
            ? {
                ...item,
                description: stockItem.book_name,
                stockId: stockItem.id,
              }
            : item,
        ),
      );
    }
    setSelectionModalVisible(false);
    setActiveItemId(null);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', price: 0 },
    ]);
  };

  const handleUpdateItem = (
    id: string,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setItems(
      items.map(item => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert('Validasi', 'Mohon lengkapi data pelanggan (Nama dan No HP)');
      return;
    }

    if (items.some(item => !item.description || item.price <= 0)) {
      Alert.alert('Validasi', 'Mohon lengkapi data item belanjaan');
      return;
    }

    setLoading(true);
    try {
      const newOrder: Omit<OrderDocument, 'id'> = {
        name,
        last_4_digits_phone: phone,
        delivery_address: address,
        delivery_type: deliveryType,
        payment_status: paymentStatus,
        status: 'pending',
        orders: items,
        unique_code: Math.floor(Math.random() * 100) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await onSave(newOrder);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menyimpan order');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setDeliveryType('express');
    setPaymentStatus('none');
    setItems([{ id: Date.now().toString(), description: '', price: 0 }]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Tambah Order Baru</Text>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Nama Pelanggan</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Contoh: Budi Santoso"
            />

            <Text style={styles.label}>4 Digit Terakhir No. HP</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              maxLength={4}
              placeholder="Contoh: 1234"
            />

            <Text style={styles.label}>Alamat Pengiriman (Opsional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder="Alamat lengkap..."
            />

            <Text style={styles.label}>Tipe Pengiriman</Text>
            <TextInput
              style={styles.input}
              value={deliveryType}
              onChangeText={setDeliveryType}
              placeholder="Contoh: JNE, GoSend, dll"
            />

            <Text style={styles.label}>Status Pembayaran</Text>
            <View style={styles.row}>
              {(['none', 'half', 'full'] as const).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.optionButton,
                    paymentStatus === status && styles.optionButtonActive,
                  ]}
                  onPress={() => setPaymentStatus(status)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      paymentStatus === status && styles.optionTextActive,
                    ]}
                  >
                    {status === 'none'
                      ? 'Belum'
                      : status === 'half'
                      ? 'DP'
                      : 'Lunas'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Item Belanjaan</Text>
            {items.map(item => {
              const stockItem = stockItems.find(s => s.id === item.stockId);
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInputContainer}>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        styles.dropdownInput,
                      ]}
                      onPress={() => handleOpenSelection(item.id)}
                    >
                      <Text
                        style={
                          item.description
                            ? styles.inputText
                            : styles.placeholderText
                        }
                      >
                        {item.description || 'Pilih Barang'}
                      </Text>
                    </TouchableOpacity>
                    {stockItem && (
                      <Text style={styles.stockInfoText}>
                        Harga: Rp {stockItem.price.toLocaleString()} | Stok:{' '}
                        {stockItem.stock}
                      </Text>
                    )}
                    <TextInput
                      style={styles.input}
                      value={item.price.toString()}
                      onChangeText={text =>
                        handleUpdateItem(
                          item.id,
                          'price',
                          parseInt(text, 10) || 0,
                        )
                      }
                      keyboardType="numeric"
                      placeholder="Harga"
                    />
                  </View>
                  {items.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.addItemButton}
              onPress={handleAddItem}
            >
              <Text style={styles.addItemText}>+ Tambah Item Lain</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Menyimpan...' : 'Simpan Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Seleksi Barang */}
      <Modal
        visible={isSelectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectionModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Pilih Barang</Text>
            <TextInput
              style={styles.input}
              placeholder="Cari nama barang..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={stockItems.filter(item =>
                item.book_name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()),
              )}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectionItem,
                    item.stock <= 0 && styles.disabledSelectionItem,
                  ]}
                  onPress={() => item.stock > 0 && handleSelectStockItem(item)}
                  disabled={item.stock <= 0}
                >
                  <View style={styles.selectionRow}>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.selectionItemText,
                          item.stock <= 0 && styles.disabledText,
                        ]}
                      >
                        {item.book_name}
                      </Text>
                      <Text style={styles.selectionItemSubText}>
                        Stok: {item.stock}
                      </Text>
                    </View>
                    <Text style={styles.priceText}>
                      Rp {item.price.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Tidak ada data stock</Text>
              }
            />
            <TouchableOpacity
              style={[styles.button, styles.buttonClose, styles.marginTop10]}
              onPress={() => setSelectionModalVisible(false)}
            >
              <Text style={styles.textStyle}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#333',
  },
  optionTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  removeButton: {
    marginLeft: 10,
    backgroundColor: '#ff3b30',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addItemButton: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addItemText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dropdownInput: {
    justifyContent: 'center',
    height: 50, // Match typical input height
    marginBottom: 8,
  },
  itemInputContainer: {
    flex: 1,
  },
  marginTop10: {
    marginTop: 10,
  },
  inputText: {
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  selectionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  disabledSelectionItem: {
    backgroundColor: '#f9f9f9',
  },
  selectionItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    lineHeight: 22,
    marginBottom: 2,
  },
  disabledText: {
    color: '#aaa',
  },
  selectionItemSubText: {
    fontSize: 13,
    color: '#888',
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    margin: 20,
    color: '#666',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stockInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default AddOrderModal;
