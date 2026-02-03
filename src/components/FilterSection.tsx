import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { getStatusColor } from '../utils/statusHelper';

interface FilterSectionProps {
  statusFilter: 'all' | 'pending' | 'packing' | 'sent' | 'hnr';
  setStatusFilter: (
    status: 'all' | 'pending' | 'packing' | 'sent' | 'hnr',
  ) => void;
  paymentFilter: 'all' | 'none' | 'half' | 'full';
  setPaymentFilter: (payment: 'all' | 'none' | 'half' | 'full') => void;
  fromDate: Date | null;
  setFromDate: (date: Date | null) => void;
  toDate: Date | null;
  setToDate: (date: Date | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  statusFilter,
  setStatusFilter,
  paymentFilter,
  setPaymentFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  searchQuery,
  setSearchQuery,
}) => {
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Pilih Tanggal';
    return date.toLocaleDateString('id-ID');
  };

  return (
    <View style={styles.filterContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari Nama / No HP..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        <Text style={styles.filterLabel}>Status:</Text>
        {[
          { label: 'Semua', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Packing', value: 'packing' },
          { label: 'Sent', value: 'sent' },
          { label: 'HnR', value: 'hnr' },
        ].map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              statusFilter === option.value && styles.activeFilterChip,
              statusFilter === option.value && {
                backgroundColor:
                  option.value === 'all'
                    ? '#555'
                    : getStatusColor(option.value),
              },
            ]}
            onPress={() => setStatusFilter(option.value as any)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === option.value && styles.activeFilterChipText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Payment Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        <Text style={styles.filterLabel}>Bayar:</Text>
        {[
          { label: 'Semua', value: 'all' },
          { label: 'Belum', value: 'none' },
          { label: 'DP', value: 'half' },
          { label: 'Lunas', value: 'full' },
        ].map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              paymentFilter === option.value && styles.activeFilterChip,
            ]}
            onPress={() => setPaymentFilter(option.value as any)}
          >
            <Text
              style={[
                styles.filterChipText,
                paymentFilter === option.value && styles.activeFilterChipText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date Range Filter */}
      <View style={styles.dateFilterRow}>
        <Text style={styles.filterLabel}>Tanggal:</Text>
        <View style={styles.dateInputs}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setOpenFrom(true)}
          >
            <Text style={styles.dateButtonLabel}>Dari:</Text>
            <Text style={styles.dateButtonValue}>{formatDate(fromDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>-</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setOpenTo(true)}
          >
            <Text style={styles.dateButtonLabel}>Sampai:</Text>
            <Text style={styles.dateButtonValue}>{formatDate(toDate)}</Text>
          </TouchableOpacity>

          {(fromDate || toDate) && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => {
                setFromDate(null);
                setToDate(null);
              }}
            >
              <Text style={styles.clearDateText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <DatePicker
        modal
        open={openFrom}
        date={fromDate || new Date()}
        mode="date"
        onConfirm={date => {
          setOpenFrom(false);
          // Set time to start of day
          date.setHours(0, 0, 0, 0);
          setFromDate(date);
        }}
        onCancel={() => {
          setOpenFrom(false);
        }}
      />

      <DatePicker
        modal
        open={openTo}
        date={toDate || new Date()}
        mode="date"
        onConfirm={date => {
          setOpenTo(false);
          // Set time to end of day
          date.setHours(23, 59, 59, 999);
          setToDate(date);
        }}
        onCancel={() => {
          setOpenTo(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    alignSelf: 'center',
    fontWeight: 'bold',
    color: '#555',
    width: 60,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterChip: {
    backgroundColor: '#3498db',
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    color: '#555',
  },
  activeFilterChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  dateInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dateButtonLabel: {
    fontSize: 10,
    color: '#888',
    marginRight: 4,
  },
  dateButtonValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  dateSeparator: {
    marginHorizontal: 8,
    color: '#888',
  },
  clearDateButton: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#eee',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearDateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default FilterSection;
