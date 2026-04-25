import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ShoppingCartPage from './pages/ShoppingCartPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import PaymentPage from './pages/PaymentPage'
import MomoReturnPage from './pages/MomoReturnPage'
import MyOrdersPage from './pages/MyOrdersPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminContacts from './pages/admin/AdminContacts'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminPosts from './pages/admin/AdminPosts'
import AdminComments from './pages/admin/AdminComments'
import AdminReviews       from './pages/admin/AdminReviews'
import AdminBrands        from './pages/admin/AdminBrands'
import AdminConcentrations from './pages/admin/AdminConcentrations'
import AdminReports       from './pages/admin/AdminReports'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

const DASHBOARD_ROLES = ['admin', 'manager', 'staff']

// Guard: chặn staff/manager/admin vào giao diện người dùng
function UserRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (DASHBOARD_ROLES.includes(user?.role)) return <Navigate to="/admin" replace />
  return children
}

// Guard: chỉ cho phép staff/manager/admin vào dashboard
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!DASHBOARD_ROLES.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
    <CartProvider>
      <Routes>
        {/* Auth pages (no layout) */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Admin layout route – yêu cầu role admin/manager/staff */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="reviews"        element={<AdminReviews />} />
          <Route path="brands"         element={<AdminBrands />} />
          <Route path="concentrations" element={<AdminConcentrations />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Public layout route — chặn admin */}
        <Route element={<UserRoute><Layout /></UserRoute>}>
          <Route index element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<ShoppingCartPage />} />
          <Route path="/payment/momo-return"  element={<MomoReturnPage />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </CartProvider>
    </AuthProvider>
  )
}

export default App
