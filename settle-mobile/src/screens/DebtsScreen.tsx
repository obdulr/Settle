import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';

interface Debt {
  id: string;
  creditor: string;
  balance: number;
  interestRate?: number;
  type?: string;
  status?: string;
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function DebtsScreen() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDebts() {
      try {
        const response = await api.get<Debt[]>('/debts');
        setDebts(response.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load debts');
      } finally {
        setLoading(false);
      }
    }
    fetchDebts();
  }, []);

  function renderDebt({ item }: { item: Debt }) {
    return (
      <Card>
        <View style={styles.debtHeader}>
          <Text style={styles.creditor}>{item.creditor}</Text>
          <Text style={styles.balance}>{currency.format(Number(item.balance) || 0)}</Text>
        </View>
        <View style={styles.debtMeta}>
          <Text style={styles.metaText}>Rate: {item.interestRate ? `${item.interestRate}%` : 'N/A'}</Text>
          <Text style={styles.metaText}>Type: {item.type || 'Other'}</Text>
          <Text style={styles.metaText}>Status: {item.status || 'Active'}</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Debts</Text>
        <Button title="Add Debt" onPress={() => { /* placeholder */ }} variant="outline" />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={debts}
          keyExtractor={(item) => item.id}
          renderItem={renderDebt}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No debts found. Add your first debt to get started.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  error: {
    color: colors.danger,
    marginTop: 20,
  },
  list: {
    paddingBottom: 40,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 40,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditor: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.danger,
  },
  debtMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
