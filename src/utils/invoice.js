export function createEmptyInvoiceItem(type = 'FRAME') {
  return {
    itemType: type,
    name: '',
    quantity: 1,
    unitPrice: 0,
  }
}

export function calculateInvoiceTotals({ items, discount, gstPercent, advance }) {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0)
    const unitPrice = Number(item.unitPrice || 0)
    return sum + quantity * unitPrice
  }, 0)

  const discountValue = Number(discount || 0)
  const taxableAmount = Math.max(subtotal - discountValue, 0)
  const gstAmount = (taxableAmount * Number(gstPercent || 0)) / 100
  const total = taxableAmount + gstAmount
  const advanceAmount = Number(advance || 0)
  const balance = Math.max(total - advanceAmount, 0)

  return {
    subtotal,
    discount: discountValue,
    taxableAmount,
    gstAmount,
    total,
    advance: advanceAmount,
    balance,
  }
}
