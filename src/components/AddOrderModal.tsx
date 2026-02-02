import React, { useState } from 'react';
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
} from 'react-native';
import { OrderDocument, OrderItem } from '../services/FirestoreService';

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
            {items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { marginBottom: 8 }]}
                    value={item.description}
                    onChangeText={text =>
                      handleUpdateItem(item.id, 'description', text)
                    }
                    placeholder="Nama Barang"
                  />
                  <TextInput
                    style={styles.input}
                    value={item.price.toString()}
                    onChangeText={text =>
                      handleUpdateItem(item.id, 'price', parseInt(text) || 0)
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
            ))}

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
});

export default AddOrderModal;
