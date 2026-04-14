import PropTypes from 'prop-types'
import { Box, Stack, Typography } from '@mui/material'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#4f7cff', '#18b57b', '#f59e0b', '#ef476f', '#7c4dff']

export default function PaymentPieChart({ data = [] }) {
  const sanitizedData = data
    .map((entry, index) => ({
      name: String(entry.name || 'Other'),
      value: Number(entry.value || 0),
      fill: COLORS[index % COLORS.length],
    }))
    .filter((entry) => entry.value > 0)

  const total = sanitizedData.reduce((sum, item) => sum + item.value, 0)

  const formatAmount = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))

  const formatPercent = (value) => {
    if (!total) {
      return '0%'
    }

    return `${Math.round((Number(value || 0) / total) * 100)}%`
  }

  if (!sanitizedData.length) {
    return (
      <Box sx={{ height: 280, display: 'grid', placeItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No payment data available.
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={1.2}>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={sanitizedData}
            dataKey="value"
            nameKey="name"
            fill="#4f7cff"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
          />
          <Tooltip formatter={(value) => [formatAmount(value), 'Amount']} />
        </PieChart>
      </ResponsiveContainer>

      <Stack spacing={0.75}>
        {sanitizedData.map((entry, index) => (
          <Stack key={entry.name} direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: COLORS[index % COLORS.length],
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {entry.name}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 38, textAlign: 'right' }}>
                {formatPercent(entry.value)}
              </Typography>
              <Typography variant="body2" sx={{ minWidth: 86, textAlign: 'right' }}>
                {formatAmount(entry.value)}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

PaymentPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
}
