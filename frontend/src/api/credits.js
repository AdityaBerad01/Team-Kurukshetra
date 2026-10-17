import api from './axios'

/**
 * Fetch authenticated user's wallet metrics and ledger transactions.
 * @returns {Promise<Object>} { balance, total_earned, total_spent, transactions }
 */
export const fetchWallet = async () => {
  const response = await api.get('/credits/wallet')
  return response.data.data
}

/**
 * Fetch authenticated user's credit ledger transactions.
 * @returns {Promise<Array>} List of transactions
 */
export const fetchTransactions = async () => {
  const response = await api.get('/credits/transactions')
  return response.data.data
}
