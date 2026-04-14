// Helper function to format currency in VND
export const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Convert USD to VND (approximate rate: 1 USD = 25,000 VND)
export const usdToVND = (usd) => {
  return usd * 25000
}
