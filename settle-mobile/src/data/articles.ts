export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'callout'; text: string };

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  excerpt: string;
  content: ContentBlock[];
}

export const articles: Article[] = [
  {
    slug: 'what-is-debt-settlement',
    title: 'What is Debt Settlement and How Does It Work?',
    description:
      'A plain-English guide to debt settlement: how it works, who it helps, the risks, the timeline, and what to expect at every step of the process.',
    category: 'Debt Settlement',
    author: 'Settle In Peace Editorial Team',
    publishedAt: '2026-01-15',
    updatedAt: '2026-07-01',
    readingTime: 7,
    excerpt:
      'Debt settlement is the process of negotiating with your creditors to pay less than the full amount you owe. Here is exactly how it works, step by step.',
    content: [
      {
        type: 'p',
        text: 'If you are drowning in debt and minimum payments are not making a dent, you have probably heard the term "debt settlement." This guide breaks down debt settlement in plain English so you can decide whether it is the right path for your situation.',
      },
      { type: 'h2', text: 'What is debt settlement?' },
      {
        type: 'p',
        text: 'Debt settlement is the process of negotiating with your creditors to accept a lump-sum payment that is less than the full balance you owe. In exchange for that reduced payment, the creditor agrees to consider the debt "settled" and closes the account.',
      },
      { type: 'h2', text: 'How the debt settlement process works' },
      {
        type: 'ol',
        items: [
          'You stop paying your creditors and instead set money aside into a dedicated savings account.',
          'As accounts become delinquent, creditors become more willing to negotiate.',
          'Once you have saved enough, a settlement offer is made — often for 40% to 60% of the original balance.',
          'If the creditor accepts, you pay the agreed amount and the account is reported as "settled."',
          'You repeat this process for each enrolled debt until the program is complete.',
        ],
      },
      {
        type: 'callout',
        text: 'If you are current on all payments and have a strong credit score, debt settlement may do more harm than good. The process requires you to fall behind, which damages your credit.',
      },
    ],
  },
  {
    slug: 'debt-settlement-vs-consolidation',
    title: 'Debt Settlement vs. Debt Consolidation: Which is Right for You?',
    description:
      'Debt settlement and debt consolidation both promise relief, but they work very differently. Compare the pros, cons, costs, and credit impact to choose the right option.',
    category: 'Debt Consolidation',
    author: 'Settle In Peace Editorial Team',
    publishedAt: '2026-01-20',
    updatedAt: '2026-07-01',
    readingTime: 8,
    excerpt:
      'Settlement reduces what you owe. Consolidation reorganizes how you pay it. Both can help — but they suit very different situations.',
    content: [
      {
        type: 'p',
        text: 'When you are struggling with debt, the number of "debt relief" options can feel overwhelming. Two of the most common — debt settlement and debt consolidation — sound similar but work in fundamentally different ways.',
      },
      { type: 'h2', text: 'The core difference in one sentence' },
      {
        type: 'callout',
        text: 'Consolidation = pay it all back, but smarter. Settlement = pay back less, but with consequences.',
      },
      { type: 'h2', text: 'What is debt consolidation?' },
      {
        type: 'p',
        text: 'Debt consolidation combines several high-interest debts into a single loan or balance transfer with a lower interest rate. You still owe the same total amount, but your monthly payment drops and more of your money goes toward principal.',
      },
      { type: 'h2', text: 'Side-by-side comparison' },
      {
        type: 'ul',
        items: [
          'Goal: Consolidation makes repayment affordable. Settlement reduces the total amount owed.',
          'Credit impact: Consolidation generally helps or preserves your credit if you stay current. Settlement hurts your credit.',
          'Timeline: Consolidation can take effect within weeks. Settlement typically takes 24 to 48 months.',
          'Cost: Consolidation may involve loan fees. Settlement companies charge 15% to 25% of enrolled debt or savings.',
        ],
      },
    ],
  },
  {
    slug: 'how-to-negotiate-with-creditors',
    title: 'How to Negotiate with Creditors: A Step-by-Step Guide',
    description:
      'You can negotiate with creditors yourself and save thousands. This step-by-step guide covers what to say, how much to offer, and how to get it in writing.',
    category: 'Negotiation',
    author: 'Settle In Peace Editorial Team',
    publishedAt: '2026-02-01',
    updatedAt: '2026-07-01',
    readingTime: 9,
    excerpt:
      'You do not need a company to settle your debts. With preparation and the right script, you can negotiate directly with creditors and keep all the savings.',
    content: [
      {
        type: 'p',
        text: 'Hiring a debt settlement company is one option, but you can negotiate with creditors yourself and keep 100% of the savings. Here is a practical script and process.',
      },
      { type: 'h2', text: 'Prepare before you call' },
      {
        type: 'ol',
        items: [
          'Know exactly how much you owe and how far behind you are.',
          'Decide the maximum lump sum you can offer.',
          'Have a checking account ready for immediate payment.',
          'Be ready to request a written settlement letter before paying.',
        ],
      },
      { type: 'h2', text: 'A simple negotiation script' },
      {
        type: 'p',
        text: '"I am experiencing financial hardship and cannot afford the full balance. I can offer a lump sum of [amount] today to settle this account in full. Can you accept that and send me a settlement letter?"',
      },
      {
        type: 'callout',
        text: 'Never pay a settlement without a written agreement confirming the creditor will report the account as "settled" and release you from the remaining balance.',
      },
    ],
  },
  {
    slug: 'debt-avalanche-vs-snowball',
    title: 'Debt Avalanche vs. Snowball: Which Payoff Strategy Wins?',
    description:
      'Compare the debt avalanche and debt snowball methods and choose the payoff strategy that keeps you motivated and saves the most money.',
    category: 'Budgeting',
    author: 'Settle In Peace Editorial Team',
    publishedAt: '2026-03-10',
    updatedAt: '2026-07-01',
    readingTime: 6,
    excerpt:
      'The avalanche method saves the most interest. The snowball method builds momentum with quick wins. The best strategy is the one you will stick with.',
    content: [
      {
        type: 'p',
        text: 'Two popular DIY payoff strategies dominate personal finance: the debt avalanche and the debt snowball. Both work, but they appeal to different personalities and situations.',
      },
      { type: 'h2', text: 'Debt avalanche' },
      {
        type: 'p',
        text: 'Pay the minimum on all debts, then put every extra dollar toward the debt with the highest interest rate. This minimizes total interest paid and pays off debt fastest mathematically.',
      },
      { type: 'h2', text: 'Debt snowball' },
      {
        type: 'p',
        text: 'Pay the minimum on all debts, then put every extra dollar toward the smallest balance. You get quick wins that build motivation, even though it may cost a little more in interest.',
      },
      {
        type: 'callout',
        text: 'If you need motivation to stick with a plan, the snowball method often wins. If you are disciplined and want to save the most, the avalanche method is best.',
      },
    ],
  },
  {
    slug: 'rebuild-credit-after-debt-settlement',
    title: 'How to Rebuild Credit After Debt Settlement',
    description:
      'Debt settlement can lower your credit score, but recovery is possible. Learn the steps to rebuild credit and qualify for better loans in the future.',
    category: 'Credit Repair',
    author: 'Settle In Peace Editorial Team',
    publishedAt: '2026-04-01',
    updatedAt: '2026-07-01',
    readingTime: 7,
    excerpt:
      'Settled accounts stay on your report for up to seven years, but their impact fades over time. Focus on these five steps to rebuild.',
    content: [
      {
        type: 'p',
        text: 'Debt settlement can leave a mark on your credit report, but it is not permanent. With consistent habits, you can rebuild your score within one to three years.',
      },
      { type: 'h2', text: 'Five steps to rebuild' },
      {
        type: 'ol',
        items: [
          'Pay every remaining bill on time, every time. Payment history is the largest factor in your score.',
          'Keep credit card balances low. Aim for under 30% utilization, and ideally under 10%.',
          'Dispute any errors on your credit reports with all three bureaus.',
          'Consider a secured credit card or credit-builder loan to add positive history.',
          'Be patient. Negative marks lose impact as they age.',
        ],
      },
      {
        type: 'callout',
        text: 'Rebuilding credit is a marathon, not a sprint. Small, consistent actions beat dramatic moves every time.',
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
