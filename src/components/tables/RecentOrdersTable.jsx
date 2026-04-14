import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import PropTypes from 'prop-types'

function getPaymentStatusColor(status) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'PAID':
      return 'success'
    case 'PARTIAL':
      return 'warning'
    case 'PENDING':
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

export default function RecentOrdersTable({ rows = [], onRowClick = null }) {
  const clickable = typeof onRowClick === 'function'

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow
            sx={{
              '& th': {
                fontWeight: 700,
                color: '#344054',
                bgcolor: 'rgba(79, 124, 255, 0.08)',
              },
            }}
          >
            <TableCell>Order No.</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">
              Amount
            </TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>Order Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length ? (
            rows.map((row) => (
              <TableRow
                key={row.id || row.orderNumber}
                hover={clickable}
                onClick={clickable ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: clickable ? 'pointer' : 'default',
                  '&:hover': clickable
                    ? {
                        bgcolor: 'rgba(79, 124, 255, 0.08)',
                      }
                    : undefined,
                }}
              >
                <TableCell sx={{ fontWeight: 600, color: '#344054' }}>{row.orderNumber}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.orderDate}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {row.amount}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.paymentStatus}
                    color={getPaymentStatusColor(row.paymentStatus)}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.orderStatus}
                    color={getOrderStatusColor(row.orderStatus)}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6}>
                <Box sx={{ py: 2.5, textAlign: 'center', color: '#667085' }}>No orders to show.</Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

RecentOrdersTable.propTypes = {
  onRowClick: PropTypes.func,
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      customerName: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      orderDate: PropTypes.string,
      orderNumber: PropTypes.string,
      orderStatus: PropTypes.string,
      paymentStatus: PropTypes.string,
    }),
  ),
}
