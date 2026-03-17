import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

// Pages
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import VendorDashboard from './pages/VendorDashboard'
import VendorOrders from './pages/VendorOrders'
import VendorProducts from './pages/VendorProducts'

// Styles
const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F5F5F0;
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
  }
  button { cursor: pointer; }
  input { outline: none; }
`

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = globalStyles
    document.head.appendChild(style)

    // Check if user is logged in
    const token = localStorage.getItem('tokri_token')
    const savedUser = localStorage.getItem('tokri_user')
    const savedRole = localStorage.getItem('tokri_role')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      setRole(savedRole)
    }
    setLoading(false)
  }, [])

  const login = (userData, userRole, token) => {
    localStorage.setItem('tokri_token', token)
    localStorage.setItem('tokri_user', JSON.stringify(userData))
    localStorage.setItem('tokri_role', userRole)
    setUser(userData)
    setRole(userRole)
  }

  const logout = () => {
    localStorage.removeItem('tokri_token')
    localStorage.removeItem('tokri_user')
    localStorage.removeItem('tokri_role')
    setUser(null)
    setRole(null)
  }

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
      <div style={{fontSize:32}}>🧺</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={
          user ? <Navigate to={role === 'vendor' ? '/vendor' : '/'} /> 
               : <LoginPage onLogin={login} />
        } />

        {/* Customer routes */}
        <Route path="/" element={user && role === 'customer' ? <HomePage user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/store/:id" element={user ? <StorePage user={user} /> : <Navigate to="/login" />} />
        <Route path="/cart" element={user ? <CartPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/orders" element={user ? <OrdersPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={logout} /> : <Navigate to="/login" />} />

        {/* Vendor routes */}
        <Route path="/vendor" element={user && role === 'vendor' ? <VendorDashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/vendor/orders" element={user && role === 'vendor' ? <VendorOrders user={user} /> : <Navigate to="/login" />} />
        <Route path="/vendor/products" element={user && role === 'vendor' ? <VendorProducts user={user} /> : <Navigate to="/login" />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App