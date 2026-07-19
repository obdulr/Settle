import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { colors } from '../theme/colors';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function calculateDTI(income: number, debt: number): number {
  if (!income || income <= 0) return 0;
  return (debt / income) * 100;
}

interface PayoffResult {
  months: number;
  totalInterest: number;
  totalPaid: number;
  error?: string;
}

function calculatePayoff(totalDebt: number, apr: number, monthlyPayment: number): PayoffResult {
  if (totalDebt <= 0 || monthlyPayment <= 0) {
    return { months: 0, totalInterest: 0, totalPaid: 0 };
  }

  const monthlyRate = apr / 100 / 12;
  const firstMonthInterest = totalDebt * monthlyRate;

  if (monthlyRate > 0 && monthlyPayment <= firstMonthInterest) {
    return {
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      error: 'Monthly payment is too low to cover interest. Increase your payment to see a payoff timeline.',
    };
  }

  let balance = totalDebt;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let month = 0;
  const maxMonths = 1200;

  while (balance > 0.01 && month < maxMonths) {
    month += 1;
    const interest = balance * monthlyRate;
    const principal = Math.min(monthlyPayment - interest, balance);
    const payment = principal + interest;
    const endingBalance = Math.max(balance - principal, 0);

    totalInterestPaid += interest;
    totalPaid += payment;
    balance = endingBalance;
  }

  return {
    months: month,
    totalInterest: Number(totalInterestPaid.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
  };
}

function getDTICategory(ratio: number) {
  if (ratio < 36) return { label: 'Healthy', color: colors.success, recommendation: 'Your DTI is in a healthy range.' };
  if (ratio <= 42) return { label: 'Manageable', color: colors.warning, recommendation: 'Approaching the threshold many lenders prefer.' };
  if (ratio <= 49) return { label: 'High', color: colors.warning, recommendation: 'High DTI may limit borrowing options.' };
  return { label: 'Critical', color: colors.danger, recommendation: 'Explore debt relief options.' };
}

export default function CalculatorsScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyDebtPayments, setMonthlyDebtPayments] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [apr, setApr] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');

  const dti = useMemo(
    () => calculateDTI(Number(monthlyIncome) || 0, Number(monthlyDebtPayments) || 0),
    [monthlyIncome, monthlyDebtPayments]
  );
  const dtiCategory = getDTICategory(dti);

  const payoff = useMemo(
    () => calculatePayoff(Number(totalDebt) || 0, Number(apr) || 0, Number(monthlyPayment) || 0),
    [totalDebt, apr, monthlyPayment]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.cardTitle}>Debt-to-Income (DTI) Calculator</Text>
        <Input label="Monthly gross income" value={monthlyIncome} onChangeText={setMonthlyIncome} keyboardType="numeric" placeholder="5000" />
        <Input label="Monthly debt payments" value={monthlyDebtPayments} onChangeText={setMonthlyDebtPayments} keyboardType="numeric" placeholder="1500" />

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Your DTI</Text>
          <Text style={[styles.resultValue, { color: dtiCategory.color }]}>{dti.toFixed(1)}%</Text>
          <Text style={styles.categoryLabel}>{dtiCategory.label}</Text>
          <Text style={styles.recommendation}>{dtiCategory.recommendation}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Debt Payoff Calculator</Text>
        <Input label="Total debt" value={totalDebt} onChangeText={setTotalDebt} keyboardType="numeric" placeholder="20000" />
        <Input label="Annual interest rate (APR %)" value={apr} onChangeText={setApr} keyboardType="numeric" placeholder="18.99" />
        <Input label="Monthly payment" value={monthlyPayment} onChangeText={setMonthlyPayment} keyboardType="numeric" placeholder="500" />

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Payoff timeline</Text>
          {payoff.error ? (
            <Text style={styles.error}>{payoff.error}</Text>
          ) : (
            <>
              <Text style={styles.resultValue}>{payoff.months} months</Text>
              <Text style={styles.resultDetail}>Total interest: {currency.format(payoff.totalInterest)}</Text>
              <Text style={styles.resultDetail}>Total paid: {currency.format(payoff.totalPaid)}</Text>
            </>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  resultBox: {
    backgroundColor: colors.slateLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  recommendation: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
  },
  resultDetail: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
});
