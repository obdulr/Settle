import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL, formatDate } from '@settle/shared';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settle Mobile</Text>
      <Text style={styles.text}>API URL: {API_BASE_URL}</Text>
      <Text style={styles.text}>Date: {formatDate(new Date())}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
});
