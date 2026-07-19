import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../navigation/AppNavigator';
import { articles } from '../data/articles';
import { colors } from '../theme/colors';

type LearnScreenProps = NativeStackScreenProps<LearnStackParamList, 'LearnList'>;

export default function LearnScreen({ navigation }: LearnScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Learn</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Article', { slug: item.slug })}
          >
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.articleTitle}>{item.title}</Text>
            <Text style={styles.excerpt} numberOfLines={3}>
              {item.excerpt}
            </Text>
            <Text style={styles.meta}>{item.readingTime} min read</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  excerpt: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  meta: {
    fontSize: 12,
    color: colors.slate,
  },
});
