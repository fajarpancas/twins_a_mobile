import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import FirestoreService, {
  OrderDocument,
  StockOpnameDocument,
  ExpenseDocument,
} from '../services/FirestoreService';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProfitItem {
  id: string;
  orderId: string;
  orderName: string; // Nama pelanggan
  itemName: string;
  sellPrice: number;
  buyPrice: number;
  profit: number;
  date: string;
}

const ProfitReportScreen = () => {
  const [loading, setLoading] = useState(true);
  const [profitItems, setProfitItems] = useState<ProfitItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalExpenses: 0,
    zakat: 0,
    netProfit: 0,
    totalBooksSent: 0,
  });

  const fetchData = async () => {
    try {
      // 1. Fetch Orders, Stock, and Expenses Data
      const [ordersData, stockData, expensesData] = await Promise.all([
        FirestoreService.getCollection('orders'),
        FirestoreService.getCollection('stock_opname'),
        FirestoreService.getCollection('expenses'),
      ]);

      const orders = ordersData as OrderDocument[];
      const stocks = stockData as StockOpnameDocument[];
      const expenses = expensesData as ExpenseDocument[];

      // 2. Create Stock Map for fast lookup (id -> price)
      const stockMap = new Map<string, number>();
      const stockNameMap = new Map<string, number>(); // Fallback map by name

      stocks.forEach(stock => {
        stockMap.set(stock.id, stock.price);
        stockNameMap.set(stock.book_name.toLowerCase(), stock.price);
      });

      // 3. Filter "Sent" orders and calculate profit
      const calculatedItems: ProfitItem[] = [];
      let totalRev = 0;
      let totalCst = 0;
      let totalPft = 0;
      let totalBooks = 0;

      orders
        .filter(order => order.status === 'sent')
        .forEach(order => {
          if (order.orders && Array.isArray(order.orders)) {
            totalBooks += order.orders.length;
            order.orders.forEach((item, index) => {
              let buyPrice = 0;

              // Try to find buy price by stockId first, then by name
              if (item.stockId && stockMap.has(item.stockId)) {
                buyPrice = stockMap.get(item.stockId) || 0;
              } else if (
                item.description &&
                stockNameMap.has(item.description.toLowerCase())
              ) {
                buyPrice =
                  stockNameMap.get(item.description.toLowerCase()) || 0;
              }

              const sellPrice = item.price || 0;
              const profit = sellPrice - buyPrice;

              totalRev += sellPrice;
              totalCst += buyPrice;
              totalPft += profit;

              calculatedItems.push({
                id: `${order.id}-${index}`,
                orderId: order.id,
                orderName: order.name || 'Tanpa Nama',
                itemName: item.description || 'Item Tanpa Nama',
                sellPrice,
                buyPrice,
                profit,
                date: order.created_at || new Date().toISOString(),
              });
            });
          }
        });

      // 4. Calculate Expenses and Zakat
      const totalExp = expenses.reduce(
        (sum, item) => sum + (item.total || 0),
        0,
      );
      const netProfit = totalPft - totalExp;
      const zakatAmount = netProfit > 0 ? netProfit * 0.025 : 0;

      // Sort by date desc
      calculatedItems.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setProfitItems(calculatedItems);
      setSummary({
        totalRevenue: totalRev,
        totalCost: totalCst,
        totalProfit: totalPft,
        totalExpenses: totalExp,
        zakat: zakatAmount,
        netProfit: netProfit,
        totalBooksSent: totalBooks,
      });
    } catch (error) {
      console.error('Error fetching profit data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleSummary = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSummaryVisible(!isSummaryVisible);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: ProfitItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.rowBetween}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text
          style={[styles.profitText, item.profit < 0 && styles.negativeProfit]}
        >
          Untung: Rp {item.profit.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.subText}>Pelanggan: {item.orderName}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.priceDetail}>
          Jual: Rp {item.sellPrice.toLocaleString()}
        </Text>
        <Text style={styles.priceDetail}>
          Beli: Rp {item.buyPrice.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.toggleButton,
            isSummaryVisible && styles.toggleButtonActive,
          ]}
          onPress={toggleSummary}
        >
          <Text style={styles.toggleButtonText}>Ringkasan Keuangan</Text>
          <Text style={styles.toggleActionText}>
            {isSummaryVisible ? 'Sembunyikan' : 'Tampilkan'}
          </Text>
        </TouchableOpacity>

        {isSummaryVisible && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Keuntungan (Gross)</Text>
              <Text style={styles.summaryValue}>
                Rp {summary.totalProfit.toLocaleString()}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.summaryLabel, { color: '#1565c0' }]}>
                Keuntungan Bersih
              </Text>
              <Text style={[styles.summaryValue, { color: '#1565c0' }]}>
                Rp {summary.netProfit.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.smallCard}>
                <Text style={styles.smallLabel}>Omset</Text>
                <Text style={styles.smallValue}>
                  Rp {summary.totalRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.smallCard}>
                <Text style={styles.smallLabel}>Modal</Text>
                <Text style={styles.smallValue}>
                  Rp {summary.totalCost.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <View style={styles.smallCard}>
                <Text style={styles.smallLabel}>Total Pengeluaran</Text>
                <Text style={styles.smallValue}>
                  Rp {summary.totalExpenses.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.smallCard, { backgroundColor: '#e8f5e9' }]}>
                <Text
                  style={[
                    styles.smallLabel,
                    { color: '#2e7d32', fontWeight: 'bold' },
                  ]}
                >
                  Zakat (2.5%)
                </Text>
                <Text
                  style={[
                    styles.smallValue,
                    { color: '#2e7d32', fontWeight: 'bold' },
                  ]}
                >
                  Rp {summary.zakat.toLocaleString()}
                </Text>
              </View>
            </View>

            <View
              style={{
                alignItems: 'center',
                marginTop: 10,
                padding: 10,
                backgroundColor: '#fff3e0',
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#e65100', fontWeight: 'bold' }}>
                Total Buku Terkirim: {summary.totalBooksSent} pcs
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Rincian Penjualan (Terkirim)</Text>
      </View>

      <FlatList
        data={profitItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Belum ada data penjualan terkirim
            </Text>
          </View>
        }
      />
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
  summaryContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryCard: {
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 5,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  smallLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  smallValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#eee',
  },
  toggleButtonActive: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleActionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  listHeader: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  profitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  negativeProfit: {
    color: '#d32f2f',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  priceDetail: {
    fontSize: 12,
    color: '#888',
    marginRight: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default ProfitReportScreen;
