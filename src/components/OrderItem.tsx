import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OrderDocument } from '../services/FirestoreService';
import { getStatusColor } from '../utils/statusHelper';

interface OrderItemProps {
  item: OrderDocument;
  onUpdateStatus: (item: OrderDocument) => void;
  onDelete: (item: OrderDocument) => void;
  onEditAddress: (item: OrderDocument) => void;
  onUpdatePayment: (item: OrderDocument) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({
  item,
  onUpdateStatus,
  onDelete,
  onEditAddress,
  onUpdatePayment,
}) => {
  const totalPrice =
    item.orders?.reduce((sum, order) => sum + (order.price || 0), 0) || 0;
  const finalTotal = totalPrice + (item.unique_code || 0);

  return (
    <View style={styles.itemContainer}>
      <View style={styles.rowBetween}>
        <Text style={styles.itemTitle}>{item.name || 'Tanpa Nama'}</Text>
        <View style={styles.rowRight}>
          <TouchableOpacity
            onPress={() => onUpdateStatus(item)}
            style={styles.statusButton}
          >
            <Text
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(item.status),
                  borderColor: getStatusColor(item.status),
                  color: 'white',
                },
              ]}
            >
              {item.status?.toUpperCase()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallDeleteButton}
            onPress={() => onDelete(item)}
          >
            <Text style={styles.smallDeleteText}>X</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.itemSubtitle}>
        Phone: ****{item.last_4_digits_phone}
      </Text>
      <TouchableOpacity onPress={() => onEditAddress(item)}>
        <Text style={styles.itemSubtitle}>
          Alamat: {item.delivery_address || 'Belum diisi'} (Ubah)
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

      <TouchableOpacity onPress={() => onUpdatePayment(item)}>
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

      <Text style={styles.dateText}>
        Created: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    marginRight: 8,
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
});

export default OrderItem;
