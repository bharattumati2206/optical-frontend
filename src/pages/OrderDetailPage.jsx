import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { orderService } from '../services/orderService'

const STATUS_STEPS = ['NEW', 'IN_PROGRESS', 'READY', 'DELIVERED']
const STATUS_LABELS = { NEW: 'New', IN_PROGRESS: 'In Progress', READY: 'Ready', DELIVERED: 'Delivered' }

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(2)}`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPaymentStatusColor(status) {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'success'
    case 'PARTIAL':
      return 'warning'
    case 'UNPAID':
      return 'error'
    default:
      return 'default'
  }
}

function getOrderStatusColor(status) {
  switch (status?.toUpperCase()) {
    case 'NEW':
      return 'default'
    case 'IN_PROGRESS':
      return 'info'
    case 'READY':
      return 'warning'
    case 'DELIVERED':
      return 'success'
    case 'CANCELLED':
      return 'error'
    default:
      return 'default'
  }
}

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchOrder() {
      try {
        const data = await orderService.getOrderById(orderId)
        if (active) setOrder(data)
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Unable to load order details.')
      }
    }

    fetchOrder()
    return () => { active = false }
  }, [orderId])

  const orderItems = useMemo(() => order?.items || order?.orderItems || [], [order])
  const paymentHistory = useMemo(() => order?.payments || [], [order])

  const itemsSubTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + (Number(item.totalPrice) || Number(item.quantity || 0) * Number(item.price || item.unitPrice || 0)), 0),
    [orderItems],
  )

  const discountAmount = order?.discountAmount ?? order?.discount ?? 0
  const gstAmount = order?.gstAmount ?? order?.gst ?? 0
  const totalAmount = order?.finalAmount ?? order?.totalAmount ?? 0
  const advanceAmount = order?.advanceAmount ?? order?.advance ?? 0
  const balanceAmount = order?.balanceAmount ?? order?.balance ?? 0
  const isPaid = order?.paymentStatus?.toUpperCase() === 'PAID'
  const currentStatus = order?.orderStatus?.toUpperCase() || 'NEW'
  const activeStep = STATUS_STEPS.indexOf(currentStatus)

  const handleStatusUpdate = async (newStatus) => {
    setSaving(true)
    setError('')
    try {
      const updated = await orderService.updateOrderStatus(orderId, { orderStatus: newStatus })
      setOrder(updated)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update order status.')
    } finally {
      setSaving(false)
    }
  }

  const handleCollectAndDeliver = async () => {
    setSaving(true)
    setError('')
    try {
      const afterPayment = await orderService.updatePayment(orderId, {
        receivedAmount: Number(balanceAmount),
        paymentType: paymentMode,
      })
      setOrder(afterPayment)
      const afterStatus = await orderService.updateOrderStatus(orderId, { orderStatus: 'DELIVERED' })
      setOrder(afterStatus)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to complete delivery.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={order?.orderNumber || `Order #${orderId}`}
        subtitle={`Customer: ${order?.customerName || order?.customer?.name || '—'}  ·  ${order?.orderDate || order?.date || ''}`}
        action={<Button component={RouterLink} to="/orders" variant="outlined" size="small">Back to Orders</Button>}
      />

      {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}

      {/* Row 1 — Order Info + Prescription */}
      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ORDER SUMMARY
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                <InfoRow label="Order No." value={order?.orderNumber || `#${orderId}`} />
                <InfoRow label="Customer" value={order?.customerName || order?.customer?.name || '—'} />
                <InfoRow label="Date" value={order?.orderDate || order?.date || '—'} />
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={0.5}>
                <InfoRow label="Total Amount" value={`₹${totalAmount}`} />
                <InfoRow label="Advance Paid" value={`₹${advanceAmount}`} />
              </Stack>
              <Box
                sx={{
                  mt: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: isPaid ? 'success.light' : 'error.light',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" fontWeight={600} color={isPaid ? 'success.dark' : 'error.dark'}>
                  Balance Due
                </Typography>
                <Typography variant="h6" fontWeight={700} color={isPaid ? 'success.dark' : 'error.dark'}>
                  ₹{balanceAmount}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                <Chip
                  label={order?.paymentStatus || 'UNPAID'}
                  color={getPaymentStatusColor(order?.paymentStatus)}
                  size="small"
                />
                <Chip
                  label={order?.orderStatus || 'NEW'}
                  color={getOrderStatusColor(order?.orderStatus)}
                  variant="outlined"
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                PRESCRIPTION
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <PrescriptionField
                    eye="Right Eye (OD)"
                    sph={order?.prescription?.rightEyeSph}
                    cyl={order?.prescription?.rightEyeCyl}
                    axis={order?.prescription?.rightEyeAxis}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <PrescriptionField
                    eye="Left Eye (OS)"
                    sph={order?.prescription?.leftEyeSph}
                    cyl={order?.prescription?.leftEyeCyl}
                    axis={order?.prescription?.leftEyeAxis}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      PD
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {order?.prescription?.pd || '—'}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2 — Order Items */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            ORDER ITEMS
          </Typography>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell>Type</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  orderItems.map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell>
                        <Chip label={item.itemType || item.type || '—'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{item.itemName || item.name || item.productName || '—'}</TableCell>
                      <TableCell align="center">{item.quantity || 0}</TableCell>
                      <TableCell align="right">₹{item.price || item.unitPrice || 0}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{item.totalPrice || (item.quantity || 0) * (item.price || item.unitPrice || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <Stack
              spacing={0.8}
              sx={{
                width: { xs: '100%', sm: 360 },
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
            >
              <InfoRow label="Items Subtotal" value={formatCurrency(itemsSubTotal)} />
              <InfoRow label="Discount" value={`- ${formatCurrency(discountAmount)}`} />
              <InfoRow label="GST" value={formatCurrency(gstAmount)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Grand Total" value={formatCurrency(totalAmount)} />
              <InfoRow label="Advance Paid" value={`- ${formatCurrency(advanceAmount)}`} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Balance Due"
                value={formatCurrency(balanceAmount)}
              />
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Row 3 — Order Action (single smart card) */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            PAYMENT HISTORY
          </Typography>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
                  <TableCell>Date & Time</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Payment Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No payments recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  paymentHistory.map((payment, index) => (
                    <TableRow key={payment.id || `${payment.createdAt}-${index}`} hover>
                      <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.paymentMode || '-'}</TableCell>
                      <TableCell>{payment.paymentType || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Row 4 — Order Action (single smart card) */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              ORDER ACTION
            </Typography>
            {currentStatus !== 'CANCELLED' && (
              <Chip
                label={STATUS_LABELS[currentStatus] || currentStatus}
                color={getOrderStatusColor(currentStatus)}
                size="small"
              />
            )}
          </Stack>

          {/* Status Progress Stepper */}
          {currentStatus !== 'CANCELLED' && (
            <Stepper
              activeStep={activeStep === -1 ? 0 : activeStep}
              alternativeLabel
              sx={{ mb: 2.5 }}
            >
              {STATUS_STEPS.map((step) => (
                <Step key={step} completed={activeStep > STATUS_STEPS.indexOf(step)}>
                  <StepLabel>{STATUS_LABELS[step]}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          <Divider sx={{ mb: 2.5 }} />

          {/* Smart Action Area */}
          {currentStatus === 'NEW' && (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">
                Order has been placed. Start processing when ready.
              </Typography>
              <Button
                variant="contained"
                color="info"
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Start Work'}
              </Button>
            </Stack>
          )}

          {currentStatus === 'IN_PROGRESS' && (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">
                Order is being processed. Mark as ready once lenses/frame are prepared.
              </Typography>
              <Button
                variant="contained"
                color="warning"
                onClick={() => handleStatusUpdate('READY')}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Mark as Ready'}
              </Button>
            </Stack>
          )}

          {currentStatus === 'READY' && !isPaid && (
            <Grid container spacing={2} alignItems="flex-end">
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">Balance to Collect</Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    ₹{balanceAmount}
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1.5}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payment Mode"
                    value={paymentMode}
                    onChange={(event) => setPaymentMode(event.target.value)}
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CARD">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                  </TextField>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    onClick={handleCollectAndDeliver}
                    disabled={saving}
                  >
                    {saving ? 'Processing...' : `Collect ₹${balanceAmount} & Deliver`}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}

          {currentStatus === 'READY' && isPaid && (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">
                Payment is fully collected. Hand over the order to the customer.
              </Typography>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleStatusUpdate('DELIVERED')}
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Mark as Delivered'}
              </Button>
            </Stack>
          )}

          {currentStatus === 'DELIVERED' && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label="Order Delivered" color="success" />
              <Typography variant="body2" color="text.secondary">
                This order has been delivered. No further actions required.
              </Typography>
            </Stack>
          )}

          {currentStatus === 'CANCELLED' && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label="Cancelled" color="error" />
              <Typography variant="body2" color="text.secondary">
                This order has been cancelled.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Stack>
  )
}

function PrescriptionField({ eye, sph, cyl, axis }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{eye}</Typography>
      <Typography variant="body2" fontWeight={600}>
        SPH: {sph || '—'} &nbsp; CYL: {cyl || '—'} &nbsp; AXIS: {axis || '—'}
      </Typography>
    </Stack>
  )
}
