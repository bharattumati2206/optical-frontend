import PropTypes from 'prop-types'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function SalesAreaChart({ data = [] }) {
  const formatAmount = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))

  return (
    <ResponsiveContainer width="100%" height={310}>
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Number(value || 0) / 1000}k`} />
        <Tooltip
          formatter={(value) => [formatAmount(value), 'Sales']}
          labelFormatter={(label, payload) => {
            const current = payload?.[0]?.payload
            return current?.fullLabel || label
          }}
        />

        <Bar
          dataKey="value"
          fill="#4f7cff"
          radius={[8, 8, 0, 0]}
          maxBarSize={34}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

SalesAreaChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      fullLabel: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
}
