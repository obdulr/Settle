import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../navigation/AppNavigator';
import { getArticleBySlug, ContentBlock } from '../data/articles';
import { colors } from '../theme/colors';

type LearnArticleScreenProps = NativeStackScreenProps<LearnStackParamList, 'Article'>;

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case 'h2':
      return (
        <Text key={index} style={styles.h2}>
          {block.text}
        </Text>
      );
    case 'h3':
      return (
        <Text key={index} style={styles.h3}>
          {block.text}
        </Text>
      );
    case 'p':
      return (
        <Text key={index} style={styles.paragraph}>
          {block.text}
        </Text>
      );
    case 'ul':
      return (
        <View key={index} style={styles.list}>
          {block.items.map((item, i) => (
            <Text key={i} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>
      );
    case 'ol':
      return (
        <View key={index} style={styles.list}>
          {block.items.map((item, i) => (
            <Text key={i} style={styles.listItem}>
              {i + 1}. {item}
            </Text>
          ))}
        </View>
      );
    case 'callout':
      return (
        <View key={index} style={styles.callout}>
          <Text style={styles.calloutText}>{block.text}</Text>
        </View>
      );
    default:
      return null;
  }
}

export default function LearnArticleScreen({ route }: LearnArticleScreenProps) {
  const { slug } = route.params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Article not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.category}>{article.category}</Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.meta}>
        {article.readingTime} min read • {article.author}
      </Text>

      {article.content.map((block, index) => renderBlock(block, index))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: colors.danger,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 24,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  h3: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 14,
  },
  list: {
    marginBottom: 16,
  },
  listItem: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 6,
    paddingLeft: 8,
  },
  callout: {
    backgroundColor: colors.slateLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  calloutText: {
    fontSize: 15,
    color: colors.slateDark,
    lineHeight: 22,
  },
});
