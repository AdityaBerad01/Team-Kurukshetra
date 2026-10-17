import { Link } from 'react-router-dom'

const FOOTER_LINKS = {
  Platform: [
    { label: 'Find Tutors',    to: '/tutors' },
    { label: 'Become a Tutor', to: '/register' },
    { label: 'How It Works',   to: '/#how-it-works' },
  ],
  Support: [
    { label: 'Help Centre',    to: '#' },
    { label: 'Safety Guidelines', to: '#' },
    { label: 'Contact Support',   to: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
    { label: 'Honor Code',     to: '#' },
  ],
}

const CURRENT_YEAR = new Date().getFullYear()

const Footer = () => (
  <footer className="bg-brand-dark text-slate-400 border-t border-slate-800/80">
    <div className="page-container py-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary-700 via-primary-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">PeerConnect</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed font-normal">
            Learn Together. Teach Together. Grow Together.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
            Hackathon 2026 · Team Kurushtra
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">{heading}</h4>
            <ul className="space-y-2.5">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-400 hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
        <p>© {CURRENT_YEAR} PeerConnect Technologies. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span>Encrypted &amp; Secure Peer Network</span>
          <span>·</span>
          <span>Built with ❤️ by Team Kurushtra</span>
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
