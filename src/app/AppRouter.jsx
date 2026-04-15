import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import CustomerCreatePage from '../pages/CustomerCreatePage'
import CustomerDetailPage from '../pages/CustomerDetailPage'
import CustomersPage from '../pages/CustomersPage'
import ConsultationPage from '../pages/ConsultationPage'
import DashboardPage from '../pages/DashboardPage'
import OrderCreatePage from '../pages/OrderCreatePage'
import OrderDetailPage from '../pages/OrderDetailPage'
import OrdersPage from '../pages/OrdersPage'
import LoginPage from '../pages/LoginPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<CustomerCreatePage />} />
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
          <Route path="/consultations" element={<ConsultationPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<OrderCreatePage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
