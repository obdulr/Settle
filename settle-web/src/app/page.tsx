import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black font-sans">

      {/* ============================================================
          HERO SECTION
          - Honest value proposition (we're new, here's why we're different)
          - Mini qualification widget above the fold
          - No fake trust badges — just what's true
          ============================================================ */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Headline + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Now in early access
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6">
                Settle your debt.<br />
                <span className="text-green-300">Find your peace.</span>
              </h1>

              <p className="text-xl text-blue-100 mb-8 max-w-lg leading-relaxed">
                We're building the first marketplace for debt relief — compare providers side-by-side with transparent fees, real timelines, and no pressure. Take the free assessment to get started.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/assessment"
                  className="px-8 py-4 bg-white text-blue-700 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Take the Free Assessment →
                </Link>
                <Link
                  href="/compare"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all"
                >
                  How the Marketplace Works
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><CheckIcon /> Free assessment</span>
                <span className="flex items-center gap-1.5"><CheckIcon /> No credit check</span>
                <span className="flex items-center gap-1.5"><CheckIcon /> No obligation</span>
                <span className="flex items-center gap-1.5"><CheckIcon /> 2 minutes</span>
              </div>
            </div>

            {/* Right: Mini qualification widget */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8 text-zinc-900">
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-zinc-900">See your options in 60 seconds</h2>
                <p className="text-sm text-zinc-500 mt-1">Start with your total debt — no personal info needed yet</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-700">How much do you owe?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Under $7.5K', value: '5000' },
                    { label: '$7.5K – $15K', value: '10000' },
                    { label: '$15K – $25K', value: '20000' },
                    { label: '$25K – $50K', value: '35000' },
                    { label: '$50K – $100K', value: '75000' },
                    { label: 'Over $100K', value: '125000' },
                  ].map(opt => (
                    <Link
                      key={opt.value}
                      href={`/assessment?debt=${opt.value}`}
                      className="py-2.5 px-3 rounded-lg border-2 border-zinc-200 text-center text-sm font-medium text-zinc-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>

                <Link
                  href="/assessment"
                  className="block w-full py-3.5 bg-blue-600 text-white text-center font-bold rounded-xl hover:bg-blue-700 transition-all mt-4"
                >
                  Get My Free Assessment →
                </Link>

                <p className="text-xs text-center text-zinc-400 mt-2">
                  🔒 Your information is secure & confidential
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          "WHY WE'RE DIFFERENT" SECTION
          - Our unique marketplace angle
          - Honest about being new — that's the differentiator
          ============================================================ */}
      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-3">Why Settle In Peace is different</p>
            <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white mb-4">
              Other sites send you to one company.<br />
              <span className="text-blue-600">We're building a marketplace.</span>
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Think of us like Kayak or LendingTree — but for debt relief. Enter your situation once, see multiple providers compete, compare real offers, and choose what's right for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚖️',
                title: 'True Side-by-Side Comparison',
                desc: 'See multiple providers with transparent fees, average savings, timelines, and verified reviews — all in one place. No more calling 5 different companies.',
                badge: 'No one else does this',
              },
              {
                icon: '🔍',
                title: 'Radical Transparency',
                desc: 'We show total cost including fees, tax implications on forgiven debt, and credit score impact upfront. No surprises after you sign.',
                badge: 'What competitors hide',
              },
              {
                icon: '🤝',
                title: 'You Stay in Control',
                desc: 'No high-pressure sales calls. Providers come to you with their best offer. Review, ask questions, and choose on your own timeline.',
                badge: 'No pressure, ever',
              },
            ].map(item => (
              <div key={item.title} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full mb-3">
                  {item.badge}
                </div>
                <h3 className="text-lg font-bold text-black dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          "HOW IT WORKS" SECTION
          - 4-step visual process
          ============================================================ */}
      <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white mb-4">How it works</h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400">From stressed to settled in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📝', title: 'Take the assessment', desc: 'Answer 7 quick questions about your debt. No SSN, no credit check, no obligation.' },
              { step: '2', icon: '🎯', title: 'Get matched', desc: 'We match your profile to vetted providers who can help with your specific situation.' },
              { step: '3', icon: '⚖️', title: 'Compare offers', desc: 'See real fees, timelines, and savings side-by-side. Ask questions before committing.' },
              { step: '4', icon: '🕊️', title: 'Choose your path', desc: "Enroll when you're ready, or use our coaching tools to handle it yourself." },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center">
                {idx < 3 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
                )}
                <div className="relative inline-flex w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl shadow-md items-center justify-center mb-4">
                  <span className="text-4xl">{item.icon}</span>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 text-white text-sm font-black rounded-full flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-black dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/assessment"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start My Free Assessment →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          MARKETPLACE CONCEPT SECTION
          - Shows how the marketplace WILL work
          - Honest that we're building this, not live yet
          ============================================================ */}
      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-3">The marketplace advantage</p>
            <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white mb-4">
              See what providers would charge you — before you talk to anyone
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Here's a preview of what the comparison will look like once our provider network is live.
            </p>
          </div>

          {/* Sample comparison table — clearly labeled as illustrative */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold text-center py-2">
              Illustrative example — real comparisons will appear once providers join the network
            </div>
            <div className="grid grid-cols-4 bg-blue-600 text-white text-sm font-semibold">
              <div className="p-4">Provider</div>
              <div className="p-4 text-center">Fee</div>
              <div className="p-4 text-center">Avg. Savings</div>
              <div className="p-4 text-center">Timeline</div>
            </div>
            {[
              { name: 'Provider A', fee: '15%', savings: '50%', timeline: '24 mo' },
              { name: 'Provider B', fee: '18%', savings: '45%', timeline: '22 mo' },
              { name: 'Provider C', fee: '20%', savings: '38%', timeline: '26 mo' },
            ].map(p => (
              <div key={p.name} className="grid grid-cols-4 border-t border-zinc-100 dark:border-zinc-800 text-sm">
                <div className="p-4 font-semibold text-black dark:text-white">{p.name}</div>
                <div className="p-4 text-center font-bold text-blue-600 dark:text-blue-400">{p.fee}</div>
                <div className="p-4 text-center font-bold text-green-600 dark:text-green-400">{p.savings}</div>
                <div className="p-4 text-center text-zinc-600 dark:text-zinc-400">{p.timeline}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/compare"
              className="inline-block px-8 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
            >
              See the Marketplace Page →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          SAVINGS ESTIMATOR SECTION
          - Honest estimates based on industry averages, not our results
          ============================================================ */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white mb-4">
            See how much you could save
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10">
            Industry data shows debt settlement programs typically reduce enrolled debt by 40-60%. Here's what that could look like.
          </p>

          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
            {[
              { debt: '$15,000', saved: '$6,750', after: '$8,250' },
              { debt: '$30,000', saved: '$13,500', after: '$16,500' },
              { debt: '$50,000', saved: '$22,500', after: '$27,500' },
            ].map(item => (
              <div key={item.debt} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-md">
                <div className="text-sm text-zinc-500 mb-1">If you owe</div>
                <div className="text-2xl font-black text-zinc-900 dark:text-white mb-3">{item.debt}</div>
                <div className="text-sm text-green-600 font-semibold mb-1">You could save</div>
                <div className="text-3xl font-black text-green-600 mb-3">{item.saved}</div>
                <div className="text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                  Pay back approx <strong className="text-zinc-700 dark:text-zinc-300">{item.after}</strong>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-400 mb-6 max-w-xl mx-auto">
            * Estimates based on industry averages from the American Fair Credit Council (AFCC). Individual results vary based on your specific situation and provider. Forgiven debt over $600 may be taxable. We are not a direct debt settlement provider.
          </p>

          <Link
            href="/assessment"
            className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg"
          >
            Get My Personalized Assessment →
          </Link>
        </div>
      </section>

      {/* ============================================================
          DEBT TYPES SECTION
          ============================================================ */}
      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-black dark:text-white mb-4">What types of debt do we cover?</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10">Our providers specialize across all major unsecured debt categories.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '💳', label: 'Credit Card Debt', desc: 'Visa, Mastercard, Amex, store cards' },
              { icon: '🏥', label: 'Medical Bills', desc: 'Hospital, doctor, dental bills' },
              { icon: '🏦', label: 'Personal Loans', desc: 'Unsecured installment loans' },
              { icon: '🎓', label: 'Student Loans', desc: 'Private student loan debt' },
              { icon: '💼', label: 'Business Debt', desc: 'Personal-guaranteed business debt' },
              { icon: '📋', label: 'Collections', desc: 'Accounts in collections' },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 text-left"
              >
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="font-bold text-black dark:text-white text-sm">{item.label}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          EARLY ACCESS / JOIN SECTION
          - Honest about being new — frame as advantage
          - No fake testimonials
          ============================================================ */}
      <section className="py-20 px-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            We're just getting started
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white mb-4">
            Be one of our first success stories
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
            We're a new company with a simple mission: bring transparency to debt relief. No fake reviews, no inflated stats, no pressure. Just an honest assessment of your options. Take the assessment today and we'll match you with providers as our network grows.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: '🌱',
                title: 'We\'re new, and that\'s good',
                desc: 'No bloated corporate overhead. No call center quotas. We built this because the industry needs transparency, and we answer directly to you.',
              },
              {
                icon: '🔒',
                title: 'Your data stays yours',
                desc: 'We don\'t sell your information. We match you with providers only when you ask us to. You can delete your account and data anytime.',
              },
              {
                icon: '💬',
                title: 'We listen to our early users',
                desc: 'As one of our first members, your feedback directly shapes what we build. Tell us what you need and we\'ll prioritize it.',
              },
            ].map(item => (
              <div key={item.title} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 text-left border border-zinc-100 dark:border-zinc-800">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-black dark:text-white text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <Link
            href="/assessment"
            className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg"
          >
            Take the Free Assessment →
          </Link>
        </div>
      </section>

      {/* ============================================================
          FAQ SECTION
          - Honest answers, including "are you a real company?"
          ============================================================ */}
      <section className="py-20 px-4 bg-white dark:bg-black">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-black dark:text-white text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is this really free?',
                a: 'Yes. Our assessment, comparison tools, and provider matching are 100% free for consumers. We get paid by providers when they successfully help you, never by you.',
              },
              {
                q: 'Are you a debt settlement company?',
                a: 'No. We are not a direct debt settlement provider. We are a marketplace that connects you with third-party debt relief companies. We do not negotiate on your behalf or hold your funds.',
              },
              {
                q: 'How is this different from other debt relief sites?',
                a: "Other sites send your information to one company and hope for the best. We're building a marketplace where you can see multiple providers side-by-side with transparent fees, timelines, and success rates — so you can make an informed decision instead of being sold to.",
              },
              {
                q: 'You\'re a new company. Can I trust you?',
                a: "Fair question. We're transparent about being new. We don't have thousands of reviews or decades of history — yet. What we do have is a commitment to honesty: no fake stats, no high-pressure sales, and no hidden fees. We make money when providers pay us for qualified leads, and we disclose that openly. If that approach resonates with you, we'd love to have you as an early user.",
              },
              {
                q: 'Will this affect my credit score?',
                a: 'Debt settlement can negatively impact your credit score in the short term. However, our providers are transparent about this upfront, and many clients see their scores recover and improve after becoming debt-free. We show you the full picture before you decide.',
              },
              {
                q: 'What if I don\'t qualify for debt settlement?',
                a: "If your debt is under $7,500 or you don't qualify for settlement, we plan to offer a financial coaching subscription that includes budgeting tools, debt payoff calculators, and credit monitoring. We won't turn anyone away without pointing you to a resource that can help.",
              },
              {
                q: 'Are the providers on your platform vetted?',
                a: 'Every provider in our network must have active state licensing, a BBB rating of B or above, and be a member of AFCC or IAPDA. We verify their success rates and display them transparently on our comparison page. We are currently building our provider network.',
              },
              {
                q: 'How long does the process take?',
                a: 'The assessment takes 2 minutes. Most debt settlement programs run 24-48 months, but we show you each provider\'s average timeline upfront so you can choose what works for your situation.',
              },
            ].map((faq, idx) => (
              <details key={idx} className="group bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-black dark:text-white list-none">
                  {faq.q}
                  <span className="text-blue-600 text-2xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR PROVIDERS SECTION
          - B2B CTA (our two-sided marketplace)
          ============================================================ */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wide mb-3">For Debt Relief Companies</p>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Access pre-qualified, intent-driven leads</h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
            Our consumers complete a full 7-step assessment with TCPA consent before you ever contact them. Higher intent. Better conversions. No wasted calls.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/providers"
              className="px-8 py-4 bg-white text-blue-700 font-bold text-lg rounded-xl hover:bg-blue-50 transition-all shadow-lg"
            >
              Learn About Lead Access →
            </Link>
            <Link
              href="/providers"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold text-lg rounded-xl hover:bg-white/20 transition-all"
            >
              See Pricing Plans
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA SECTION
          ============================================================ */}
      <section className="py-24 px-4 bg-white dark:bg-black text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Take the first step today
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-black dark:text-white mb-4">
            Ready to settle in peace?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-lg">
            Take our free 2-minute assessment and see which options are available to you — with no pressure and no commitment.
          </p>
          <Link
            href="/assessment"
            className="inline-block px-12 py-5 bg-blue-600 text-white text-xl font-black rounded-xl hover:bg-blue-700 transition-all shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1"
          >
            Get My Free Assessment →
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400 dark:text-zinc-600">
            <span>✓ Free</span>
            <span>✓ No credit check</span>
            <span>✓ No obligation</span>
            <span>✓ 2 minutes</span>
            <span>✓ 100% confidential</span>
          </div>
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-600">
            Not sure if you qualify?{' '}
            <Link href="/compare" className="text-blue-500 hover:underline font-medium">See how the marketplace works →</Link>
          </p>
        </div>
      </section>

      {/* ============================================================
          FOOTER WITH COMPLIANCE
          - Honest disclaimers
          - Only links to pages that exist
          ============================================================ */}
      <footer className="bg-zinc-900 dark:bg-black text-zinc-400 pt-16 pb-8 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="text-xl font-bold text-white mb-3">
                Settle<span className="text-blue-400">InPeace</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The debt relief marketplace that puts you in control. Compare providers, see transparent fees, and choose your path to financial peace.
              </p>
            </div>

            {/* For Consumers */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">For Consumers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/assessment" className="hover:text-white transition-colors">Free Assessment</Link></li>
                <li><Link href="/compare" className="hover:text-white transition-colors">How the Marketplace Works</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>

            {/* For Providers */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">For Providers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/providers" className="hover:text-white transition-colors">List Your Company</Link></li>
                <li><Link href="/providers" className="hover:text-white transition-colors">Lead Pricing</Link></li>
                <li><a href="mailto:partners@settleinpeace.com" className="hover:text-white transition-colors">Partner Support</a></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/debts" className="hover:text-white transition-colors">Track My Debts</Link></li>
                <li><Link href="/settings" className="hover:text-white transition-colors">Settings</Link></li>
                <li><a href="mailto:help@settleinpeace.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Compliance disclaimer */}
          <div className="border-t border-zinc-800 pt-8 space-y-4 text-xs text-zinc-500 leading-relaxed">
            <p>
              <strong className="text-zinc-400">Disclaimer:</strong> Settle In Peace is not a direct debt settlement provider. We are a marketplace that connects consumers with third-party debt relief companies. We receive compensation from partner providers, which may affect which providers are featured and their order. All fees, ratings, and statistics are disclosed transparently.
            </p>
            <p>
              <strong className="text-zinc-400">Important:</strong> Debt settlement may negatively impact your credit score. Forgiven debt over $600 may be considered taxable income by the IRS. Results vary based on individual circumstances. Programs typically take 24-48 months. Not all clients complete their program. Not available in all states. Please consult a tax advisor regarding tax implications of debt settlement.
            </p>
            <p>
              <strong className="text-zinc-400">TCPA Consent:</strong> By using our assessment tool, you consent to be contacted by Settle In Peace and its partner providers via phone, email, or text message regarding your debt situation. Standard message and data rates may apply. You may opt out at any time.
            </p>
          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} Settle In Peace, Inc. All rights reserved. SettleInPeace.com is a trademark of Settle In Peace, Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================
    INLINE ICON COMPONENTS
    ============================================================ */

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
