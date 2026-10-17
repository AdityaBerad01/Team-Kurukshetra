import { useState, useEffect } from 'react'
import { fetchWallet } from '../api/credits'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Wallet = () => {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    fetchWallet()
      .then((data) => {
        if (isMounted) {
          setWallet(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load wallet:', err)
          setError('Unable to load wallet ledger. Please check back shortly.')
          setLoading(false)
        }
      })

    return () => { isMounted = false }
  }, [])

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Loading credit ledger…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-rose-50 border-rose-200 p-8 text-center my-6">
        <p className="text-rose-700 font-bold mb-3">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-secondary text-xs"
        >
          Retry
        </button>
      </div>
    )
  }

  const { balance = 100, total_earned = 0, total_spent = 0, transactions = [] } = wallet || {}

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Learn-to-Earn Credit Economy
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Credit Wallet & Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Exchange academic tutoring hours peer-to-peer using verified, internal learning credits without real money.
        </p>
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 text-white p-6 shadow-xl border-primary-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-200">
              Current Available Balance
            </span>
            <span className="text-2xl">🪙</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight">{balance}</span>
            <span className="text-sm font-semibold text-primary-200">Credits</span>
          </div>
          <p className="text-xs text-primary-300 mt-4">
            Spendable for booking tutoring sessions across any subject.
          </p>
        </div>

        <div className="card bg-white p-6 border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Credits Earned
            </span>
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ↑
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">+{total_earned}</span>
            <span className="text-xs font-semibold text-emerald-600">Earned</span>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Earned by teaching and completing peer tutoring sessions.
          </p>
        </div>

        <div className="card bg-white p-6 border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Credits Spent
            </span>
            <span className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              ↓
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">-{total_spent}</span>
            <span className="text-xs font-semibold text-amber-600">Spent</span>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Exchanged for mentorship from expert peer tutors.
          </p>
        </div>
      </div>

      {/* Learn-to-Earn Mechanism Explainer */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-primary-50/40 to-slate-50/80 border border-emerald-200/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>💡</span> How the Learn-to-Earn Credit System Works
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Each student automatically receives <strong>100 starting credits</strong> upon registration. Whenever you complete a tutoring session, <strong>20 credits</strong> are safely transferred to your mentor. Teach peers to earn more credits or learn new subjects with your earned balance!
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex-shrink-0">
          Zero Real-Money Cost
        </span>
      </div>

      {/* Immutable Transaction Ledger */}
      <div className="card bg-white border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Audit Transaction History
            </h2>
            <p className="text-xs text-slate-500">
              Permanent immutable ledger entries recorded with timestamps and session IDs.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {transactions.length} record{transactions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-400">No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Transaction ID</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Reason / Description</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Balance After</th>
                  <th className="pb-3 pr-2">Date (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0
                  return (
                    <tr key={tx.id || tx.transaction_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-2 font-mono text-[11px] text-slate-500">
                        {tx.transaction_id || tx.id}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'INITIAL_BONUS'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : tx.type === 'SESSION_COMPLETION_CREDIT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-800 font-semibold max-w-xs truncate">
                        {tx.reason}
                        {tx.related_session_id && (
                          <span className="ml-1 text-[10px] font-mono text-slate-400">
                            (Session #{tx.related_session_id.slice(-6)})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className={`font-black ${isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isPositive ? `+${tx.amount}` : tx.amount} credits
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 font-semibold">
                        {tx.balance_after} credits
                      </td>
                      <td className="py-3.5 pr-2 text-slate-400 font-normal">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Just now'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Wallet
