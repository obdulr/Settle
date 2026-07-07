import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-900 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Settle In Peace</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/assessment" className="hover:text-white transition-colors">Free Assessment</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare Providers</Link></li>
              <li><Link href="/providers" className="hover:text-white transition-colors">For Providers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><a href="mailto:help@settleinpeace.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link href="/portal" className="hover:text-white transition-colors">Provider Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><a href="mailto:help@settleinpeace.com" className="hover:text-white transition-colors">help@settleinpeace.com</a></li>
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

        <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-xs text-zinc-600 space-y-2">
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <a href="mailto:help@settleinpeace.com" className="hover:text-zinc-400 transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} Settle In Peace, Inc. All rights reserved. SettleInPeace.com is a trademark of Settle In Peace, Inc.</div>
        </div>
      </div>
    </footer>
  );
}
