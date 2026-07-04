import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black font-sans">

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-zinc-900 dark:to-black px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            The debt relief marketplace built for you — not for lenders.
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-black dark:text-white leading-tight mb-6">
            Settle your debt.<br />
            <span className="text-blue-600">Find your peace.</span>
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
            Compare vetted debt relief providers side-by-side with transparent fees, real timelines, and verified success rates. No hidden costs. No pressure. No guessing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/assessment"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Get My Free Assessment →
            </Link>
            <Link
              href="/compare"
              className="px-8 py-4 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-lg font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Compare Providers
            </Link>
          </div>
          <p className="mt-5 text-sm text-zinc-400 dark:text-zinc-600">
            Free · No credit check · No obligation · 2 minutes
          </p>
        </div>
      </section>

      {/* How we're different */}
      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-black dark:text-white text-center mb-4">
            Why Settle In Peace is different
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Other sites send you to one company and hope for the best. We show you everything — then let you decide.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚖️',
                title: 'True Comparison',
                desc: 'See multiple providers side-by-side with real fees, average savings, timelines, and reviews — like Kayak, but for debt relief.',
              },
              {
                icon: '🔍',
                title: 'Radical Transparency',
                desc: "We show total cost including fees, tax implications on forgiven debt, and credit score impact. No surprises after you sign.",
              },
              {
                icon: '🤝',
                title: 'You Stay in Control',
                desc: 'No high-pressure sales calls. Providers come to you. Review your options, ask questions, and choose on your own timeline.',
              },
            ].map(item => (
              <div key={item.title} className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">{item.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-black dark:text-white text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { step: '1', title: 'Take the assessment', desc: 'Answer 7 quick questions about your debt. No SSN, no credit check.' },
              { step: '2', title: 'Get matched', desc: 'We match your profile to vetted providers who can help with your specific situation.' },
              { step: '3', title: 'Compare offers', desc: 'See real fees, timelines, and savings side-by-side. Ask questions before committing.' },
              { step: '4', title: 'Choose your path', desc: 'Enroll when you\'re ready, or use our coaching tools to handle it yourself.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 text-white text-xl font-black rounded-full flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-black dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/assessment"
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Start My Free Assessment →
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="py-16 px-4 bg-white dark:bg-black border-y border-zinc-100 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '$22K+', label: 'Avg consumer debt enrolled' },
            { value: '40–60%', label: 'Typical debt reduction' },
            { value: '100%', label: 'TCPA compliant leads' },
            { value: 'Free', label: 'Always free for consumers' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{stat.value}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Debt types we cover */}
      <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">What types of debt do we cover?</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10">Our providers specialize across all major unsecured debt categories.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '💳', label: 'Credit Card Debt' },
              { icon: '🏥', label: 'Medical Bills' },
              { icon: '🏦', label: 'Personal Loans' },
              { icon: '🎓', label: 'Student Loans' },
              { icon: '💼', label: 'Business Debt' },
              { icon: '📋', label: 'Collections' },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-black dark:text-white text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For providers */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-3">For Debt Relief Companies</p>
          <h2 className="text-3xl font-bold mb-4">Access pre-qualified, intent-driven leads</h2>
          <p className="text-blue-100 text-lg mb-8">
            Our consumers complete a full 7-step assessment with TCPA consent before you ever contact them. Higher intent. Better conversions. No wasted calls.
          </p>
          <Link
            href="/providers"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transition-colors"
          >
            Learn About Lead Access →
          </Link>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 bg-white dark:bg-black text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
            Ready to settle in peace?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-lg">
            Take our free 2-minute assessment and see which options are available to you — with no pressure and no commitment.
          </p>
          <Link
            href="/assessment"
            className="inline-block px-10 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Get My Free Assessment →
          </Link>
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-600">
            Not sure if you qualify?{' '}
            <Link href="/compare" className="text-blue-500 hover:underline">Browse providers first →</Link>
          </p>
        </div>
      </section>

    </div>
  );
}
