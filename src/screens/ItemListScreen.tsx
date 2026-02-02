import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Button,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import FirestoreService, { OrderDocument } from '../services/FirestoreService';
import AddOrderModal from '../components/AddOrderModal';

const ItemListScreen = () => {
  const [items, setItems] = useState<OrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // State untuk edit alamat
  const [editAddressModalVisible, setEditAddressModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDocument | null>(
    null,
  );
  const [newAddress, setNewAddress] = useState('');

  // Ganti 'items' dengan nama koleksi Anda yang sebenarnya di Firestore
  const COLLECTION_NAME = 'orders';

  const fetchData = async () => {
    try {
      const data = await FirestoreService.getCollection(COLLECTION_NAME);
      setItems(data as OrderDocument[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddOrder = () => {
    setModalVisible(true);
  };

  const handleSaveOrder = async (orderData: Omit<OrderDocument, 'id'>) => {
    try {
      await FirestoreService.addDocument(COLLECTION_NAME, orderData);
      Alert.alert('Sukses', 'Order baru berhasil ditambahkan');
      fetchData(); // Refresh list
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menambah order');
    }
  };

  const handleEditAddress = (item: OrderDocument) => {
    setSelectedOrder(item);
    setNewAddress(item.delivery_address || '');
    setEditAddressModalVisible(true);
  };

  const saveAddress = async () => {
    if (!selectedOrder) return;

    try {
      await FirestoreService.updateDocument(COLLECTION_NAME, selectedOrder.id, {
        delivery_address: newAddress,
      });
      fetchData();
      setEditAddressModalVisible(false);
      Alert.alert('Sukses', 'Alamat berhasil diperbarui');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal update alamat');
    }
  };

  const handleUpdateStatus = (item: OrderDocument) => {
    Alert.alert('Update Status', 'Pilih status baru:', [
      { text: 'Pending', onPress: () => updateStatus(item.id, 'pending') },
      { text: 'Packing', onPress: () => updateStatus(item.id, 'packing') },
      { text: 'Sent', onPress: () => updateStatus(item.id, 'sent') },
      {
        text: 'HnR',
        onPress: () => updateStatus(item.id, 'hnr'),
        style: 'destructive',
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleUpdatePayment = (item: OrderDocument) => {
    Alert.alert('Update Pembayaran', 'Pilih status pembayaran:', [
      { text: 'Belum Bayar', onPress: () => updatePayment(item.id, 'none') },
      { text: 'DP (Half)', onPress: () => updatePayment(item.id, 'half') },
      { text: 'Lunas (Full)', onPress: () => updatePayment(item.id, 'full') },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const updateStatus = async (
    id: string,
    newStatus: OrderDocument['status'],
  ) => {
    try {
      await FirestoreService.updateDocument(COLLECTION_NAME, id, {
        status: newStatus,
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal update status');
    }
  };

  const updatePayment = async (
    id: string,
    newPayment: OrderDocument['payment_status'],
  ) => {
    try {
      await FirestoreService.updateDocument(COLLECTION_NAME, id, {
        payment_status: newPayment,
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal update pembayaran');
    }
  };

  const handleDeleteOrder = (item: OrderDocument) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus order dari ${item.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirestoreService.deleteDocument(COLLECTION_NAME, item.id);
              Alert.alert('Sukses', 'Order berhasil dihapus');
              fetchData();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Gagal menghapus order');
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }: { item: OrderDocument }) => {
    const totalPrice =
      item.orders?.reduce((sum, order) => sum + (order.price || 0), 0) || 0;
    const finalTotal = totalPrice + (item.unique_code || 0);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.rowBetween}>
          <Text style={styles.itemTitle}>{item.name || 'Tanpa Nama'}</Text>
          <View style={styles.rowRight}>
            <TouchableOpacity
              onPress={() => handleUpdateStatus(item)}
              style={styles.statusButton}
            >
              <Text
                style={[
                  styles.statusBadge,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status?.toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallDeleteButton}
              onPress={() => handleDeleteOrder(item)}
            >
              <Text style={styles.smallDeleteText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.itemSubtitle}>
          Phone: ****{item.last_4_digits_phone}
        </Text>
        <TouchableOpacity onPress={() => handleEditAddress(item)}>
          <Text style={styles.itemSubtitle}>
            Alamat: {item.delivery_address || 'Belum diisi'} (Ubah)
          </Text>
        </TouchableOpacity>

        <View style={styles.paymentContainer}>
          <Text style={styles.itemSubtitle}>
            Total Belanja: Rp {totalPrice.toLocaleString()}
          </Text>
          {item.unique_code && (
            <Text style={styles.uniqueCodeText}>
              Kode Unik: +{item.unique_code}
            </Text>
          )}
          <Text style={styles.totalPaymentText}>
            Total Bayar: Rp {finalTotal.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity onPress={() => handleUpdatePayment(item)}>
          <Text style={[styles.itemSubtitle, { color: 'blue', marginTop: 4 }]}>
            Payment:{' '}
            {item.payment_status === 'none'
              ? 'Belum bayar'
              : item.payment_status === 'half'
              ? 'DP'
              : 'Lunas'}{' '}
            (Ubah)
          </Text>
        </TouchableOpacity>

        {item.orders && item.orders.length > 0 && (
          <View style={styles.orderItemsContainer}>
            <Text style={styles.sectionHeader}>Items:</Text>
            {item.orders.map((order, index) => (
              <Text key={index} style={styles.orderItemText}>
                - {order.description} (Rp {order.price?.toLocaleString()})
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.dateText}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'packing':
        return '#3498db';
      case 'sent':
        return '#2ecc71';
      case 'hnr':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Daftar Order</Text>
        <Button title="Tambah Order" onPress={handleAddOrder} />
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada data ditemukan</Text>
          </View>
        }
      />

      <AddOrderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveOrder}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={editAddressModalVisible}
        onRequestClose={() => setEditAddressModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Alamat</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
              placeholder="Alamat lengkap..."
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setEditAddressModalVisible(false)}
              >
                <Text style={styles.textStyle}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={saveAddress}
              >
                <Text style={styles.textStyle}>Simpan</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#444',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    fontWeight: 'bold',
    fontSize: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderColor: 'currentColor',
  },
  orderItemsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  orderItemText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    marginBottom: 2,
  },
  paymentContainer: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  uniqueCodeText: {
    fontSize: 12,
    color: '#e67e22',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  totalPaymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
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
    width: '90%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
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
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    marginRight: 8,
  },
  smallDeleteButton: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  smallDeleteText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ItemListScreen;
