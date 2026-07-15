'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * ComplianceDisclosure
 *
 * A collapsible/expandable disclosure component containing the required CFPB
 * and FTC disclosures for debt settlement marketing. Renders Schema.org
 * structured data (WebPage / Disclaimer) so search engines and compliance
 * crawlers can identify the disclosures.
 *
 * Usage:
 *   <ComplianceDisclosure />                       // collapsible, closed by default
 *   <ComplianceDisclosure defaultOpen />           // open by default
 *   <ComplianceDisclosure variant="inline" />      // always-expanded inline block
 */

export const CFPB_DISCLOSURES: string[] = [
  'Debt settlement services may have a negative impact on your credit rating.',
  'Debt settlement programs may not be suitable for all consumers.',
  'Settled debt may be considered taxable income by the IRS. Forgiven debt over $600 may generate a 1099-C tax form.',
  'We are not a law firm and this is not legal advice. You should consult an attorney for legal guidance.',
  'Results are not guaranteed and vary by individual circumstances. Not all clients complete their program.',
  'Fees may apply for debt settlement services. Provider fees typically range from 15% to 25% of enrolled debt.',
];

interface ComplianceDisclosureProps {
  /** Start expanded (default: false) */
  defaultOpen?: boolean;
  /** "collapsible" (default) or "inline" (always visible) */
  variant?: 'collapsible' | 'inline';
  /** Optional title override */
  title?: string;
  /** Extra class on the outer wrapper */
  className?: string;
}

export default function ComplianceDisclosure({
  defaultOpen = false,
  variant = 'collapsible',
  title = 'Important Disclosures',
  className = '',
}: ComplianceDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isInline = variant === 'inline';

  // Schema.org structured data: marks this block as a Disclaimer WebPage element.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Debt Settlement Disclosures',
    description:
      'CFPB and FTC required disclosures for debt settlement marketing, including credit impact, tax implications, and fee disclosures.',
    about: {
      '@type': 'Thing',
      name: 'Debt Settlement Disclosures',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Settle In Peace, Inc.',
    },
  };

  const body = (
    <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed space-y-2">
      <ul className="space-y-1.5 list-disc pl-4">
        {CFPB_DISCLOSURES.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p>
        Settle In Peace is a marketplace, not a debt settlement provider. We are
        not affiliated with any government agency, including the CFPB or FTC.{' '}
        <Link
          href="/disclosures"
          className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          View full disclosures
        </Link>
        . To submit a complaint, visit the{' '}
        <a
          href="https://www.consumerfinance.gov/complaint/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          CFPB complaint portal
        </a>
        .
      </p>
    </div>
  );

  return (
    <section
      className={`bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg ${className}`}
      aria-label="Compliance disclosures"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {isInline ? (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {title}
          </h3>
          {body}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
          >
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {title}
            </span>
            <span
              className={`text-zinc-400 text-lg flex-shrink-0 transition-transform ${
                open ? 'rotate-45' : ''
              }`}
              aria-hidden="true"
            >
              +
            </span>
          </button>
          {open && <div className="px-4 pb-4">{body}</div>}
        </>
      )}
    </section>
  );
}
