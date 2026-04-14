import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import SummaryCard from '../components/common/SummaryCard'
import SalesAreaChart from '../components/charts/SalesAreaChart'
import PaymentPieChart from '../components/charts/PaymentPieChart'
import RecentOrdersTable from '../components/tables/RecentOrdersTable'
import { useStore } from '../context/useStore'
import { dashboardService } from '../services/dashboardService'

function toArray(data) {
  return Array.isArray(data) ? data : []
}

function toDateOnlyKey(input) {
  const date = new Date(input)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapSalesChartData(items) {
  const input = toArray(items)
  const valueByDate = input.reduce((acc, item) => {
    const key = toDateOnlyKey(item.date || item.label)

    if (!key) {
      return acc
    }

    acc[key] = Number(item.value ?? item.totalSales ?? item.sales ?? item.amount ?? 0)
    return acc
  }, {})

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const output = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - offset)

    const key = toDateOnlyKey(date)
    output.push({
      label: weekdays[date.getDay()],
      fullLabel: date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      }),
      value: Number(valueByDate[key] || 0),
    })
  }

  return output
}

function mapPaymentData(payload) {
  if (payload && !Array.isArray(payload) && typeof payload === 'object') {
    return Object.entries(payload).map(([name, value]) => ({
      name,
      value: Number(value || 0),
    }))
  }

  return toArray(payload).map((item) => ({
    name: item.name || item.mode || item.paymentType || 'Other',
    value: Number(item.value ?? item.amount ?? item.count ?? 0),
  }))
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isSuperAdmin, loadingStores, selectedStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [paymentModes, setPaymentModes] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])

  useEffect(() => {
    const selectedStoreId = selectedStore?.id

    if (isSuperAdmin && (loadingStores || !selectedStore)) {
      setLoading(false)
      setError('')
      setSummary(null)
      setDailySales([])
      setPaymentModes([])
      setPendingOrders([])
      return undefined
    }

    let mounted = true

    async function fetchDashboardData() {
      setLoading(true)
      setError('')

      try {
        const params = isSuperAdmin && selectedStoreId ? { storeId: selectedStoreId } : {}
        const overview = await dashboardService.getOverview(params)

        if (!mounted) {
          return
        }

        setSummary(overview?.summary || null)
        setDailySales(mapSalesChartData(overview?.dailySales))
        setPaymentModes(mapPaymentData(overview?.paymentModes))
        setPendingOrders(toArray(overview?.pendingOrders))
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Unable to load dashboard overview.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      mounted = false
    }
  }, [isSuperAdmin, loadingStores, selectedStore?.id])

  const cards = useMemo(
    () => {
      const totalSales = Number(summary?.totalSales || 0)
      const totalOrders = Number(summary?.totalOrders || 0)
      const totalCustomers = Number(summary?.totalCustomers || 0)
      const pendingDeliveries = Number(summary?.pendingDeliveries || 0)

      return [
        {
          title: 'Total Sales',
          value: totalSales,
          isCurrency: true,
          tone: 'blue',
          icon: <CurrencyRupeeRoundedIcon fontSize="small" />,
        },
        {
          title: 'Orders',
          value: totalOrders,
          tone: 'teal',
          icon: <ReceiptLongRoundedIcon fontSize="small" />,
        },
        {
          title: 'Customers',
          value: totalCustomers,
          tone: 'violet',
          icon: <GroupsRoundedIcon fontSize="small" />,
        },
        {
          title: 'Pending Deliveries',
          value: pendingDeliveries,
          tone: 'rose',
          icon: <LocalShippingRoundedIcon fontSize="small" />,
        },
      ]
    },
    [summary],
  )

  return (
    <Stack spacing={2.2}>
      <BoxHeader title="Overview" subtitle="Track store billing performance and payments." />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard
              title={card.title}
              value={card.value}
              isCurrency={card.isCurrency}
              tone={card.tone}
              icon={card.icon}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Daily Sales
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Loading chart...</Typography>
              ) : (
                <SalesAreaChart data={dailySales} />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Payment Modes
              </Typography>
              {loading ? (
                <Typography color="text.secondary">Loading chart...</Typography>
              ) : (
                <PaymentPieChart data={paymentModes} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Pending Orders
          </Typography>
          <RecentOrdersTable
            rows={pendingOrders}
            onRowClick={(row) => {
              const routeKey = row?.id ?? row?.orderNumber
              if (routeKey) {
                navigate(`/orders/${routeKey}`)
              }
            }}
          />
        </CardContent>
      </Card>
    </Stack>
  )
}

function BoxHeader({ title, subtitle }) {
  return (
    <Stack spacing={0.4}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' } }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Stack>
  )
}

BoxHeader.propTypes = {
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
}
