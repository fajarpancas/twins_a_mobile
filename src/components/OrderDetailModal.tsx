import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { OrderDocument } from '../services/FirestoreService';

interface OrderDetailModalProps {
  visible: boolean;
  onClose: () => void;
  order: OrderDocument | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  visible,
  onClose,
  order,
}) => {
  if (!order) return null;

  const totalPrice =
    order.orders?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
  const finalTotal = totalPrice + (order.unique_code || 0);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Pesanan</Text>

          <ScrollView style={styles.contentContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Nama:</Text>
              <Text style={styles.value}>{order.name}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>4 digit No HP:</Text>
              <Text style={styles.value}>{order.last_4_digits_phone}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 10, marginBottom: 5 }]}>
              Buku:
            </Text>
            <View style={{ height: 8 }} />
            {order.orders?.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  index === order.orders?.length - 1
                    ? {}
                    : { borderBottomWidth: 1, borderBottomColor: '#eee' },
                ]}
              >
                <Text style={styles.itemText}>- {item.description}</Text>
                <Text style={styles.itemPrice}>
                  Rp {item.price?.toLocaleString()}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Total:</Text>
              <Text style={styles.value}>Rp {totalPrice.toLocaleString()}</Text>
            </View>

            {order.unique_code ? (
              <View style={styles.row}>
                <Text style={styles.label}>Kode Unik:</Text>
                <Text style={[styles.value, { color: '#e67e22' }]}>
                  +{order.unique_code}
                </Text>
              </View>
            ) : null}

            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Total Bayar:</Text>
              <Text style={styles.totalValue}>
                Rp {finalTotal.toLocaleString()}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  contentContainer: {
    width: '100%',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    paddingLeft: 10,
  },
  itemText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: '100%',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OrderDetailModal;
