import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ItemListScreen from './src/screens/ItemListScreen';
import StockOpnameScreen from './src/screens/StockOpnameScreen';
import ProfitReportScreen from './src/screens/ProfitReportScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component<
  any,
  { hasError: boolean; errorText: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorText: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorText: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Terjadi Kesalahan.</Text>
          <Text style={styles.errorMessage}>{this.state.errorText}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const Drawer = createDrawerNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer>
          <Drawer.Navigator initialRouteName="Item List">
            <Drawer.Screen name="Item List" component={ItemListScreen} />
            <Drawer.Screen name="Stock Opname" component={StockOpnameScreen} />
            <Drawer.Screen
              name="Laporan Keuntungan"
              component={ProfitReportScreen}
            />
            <Drawer.Screen name="Pengeluaran" component={ExpensesScreen} />
          </Drawer.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;
