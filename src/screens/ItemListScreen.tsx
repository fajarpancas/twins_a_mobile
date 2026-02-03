import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from 'react';
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
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import FirestoreService, { OrderDocument } from '../services/FirestoreService';
import AddOrderModal from '../components/AddOrderModal';
import OrderItem from '../components/OrderItem';
import FilterSection from '../components/FilterSection';

const ItemListScreen = ({ navigation }: any) => {
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

  // Filter States
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'packing' | 'sent' | 'hnr'
  >('all');
  const [paymentFilter, setPaymentFilter] = useState<
    'all' | 'none' | 'half' | 'full'
  >('all');

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const COLLECTION_NAME = 'orders';

  const fetchData = async () => {
    try {
      const data = await FirestoreService.getCollection(
        COLLECTION_NAME,
        'created_at',
        'desc',
      );
      setItems(data as OrderDocument[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddOrder = useCallback(() => {
    setModalVisible(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleAddOrder} title="Tambah Order" />
      ),
      headerTitle: '', // Keep title empty as per previous request
    });
  }, [navigation, handleAddOrder]);

  const getFilteredItems = () => {
    return items.filter(item => {
      const matchStatus =
        statusFilter === 'all' || item.status === statusFilter;
      const matchPayment =
        paymentFilter === 'all' || item.payment_status === paymentFilter;

      let matchDate = true;
      if (item.created_at) {
        // created_at could be a Firestore Timestamp or a string/number
        // Adjust parsing logic as needed. Assuming it can be converted to Date.
        // If it's a Firestore Timestamp, we might need item.created_at.toDate()
        // But here we'll assume standard Date constructor works or it's a string
        const itemDate = new Date(item.created_at);
        if (fromDate) {
          // Reset time to 00:00:00 for accurate date comparison
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          const itemD = new Date(itemDate);
          itemD.setHours(0, 0, 0, 0);
          matchDate = matchDate && itemD >= from;
        }
        if (toDate) {
          // Reset time to 23:59:59 for accurate date comparison
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          const itemD = new Date(itemDate);
          itemD.setHours(0, 0, 0, 0);
          // logic correction: item date (start of day) <= to date (end of day)
          // or simply compare dates
          matchDate = matchDate && itemD <= to;
        }
      } else if (fromDate || toDate) {
        // If item has no date but filter is active, exclude it
        matchDate = false;
      }

      return matchStatus && matchPayment && matchDate;
    });
  };

  const filteredItems = getFilteredItems();

  const handleSaveOrder = async (orderData: Omit<OrderDocument, 'id'>) => {
    try {
      await FirestoreService.addDocument(COLLECTION_NAME, orderData);

      // Kurangi stok barang yang dipesan
      if (orderData.orders && orderData.orders.length > 0) {
        await FirestoreService.deductStock(orderData.orders);
      }

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

  const handleUpdatePayment = (item: OrderDocument) => {
    Alert.alert('Update Pembayaran', 'Pilih status pembayaran:', [
      { text: 'Belum Bayar', onPress: () => updatePayment(item.id, 'none') },
      { text: 'DP (Half)', onPress: () => updatePayment(item.id, 'half') },
      { text: 'Lunas (Full)', onPress: () => updatePayment(item.id, 'full') },
      { text: 'Batal', style: 'cancel' },
    ]);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FilterSection
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
      />

      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <OrderItem
            item={item}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteOrder}
            onEditAddress={handleEditAddress}
            onUpdatePayment={handleUpdatePayment}
          />
        )}
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
  listContent: {
    padding: 16,
    paddingTop: 8,
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
});

export default ItemListScreen;
