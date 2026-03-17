import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#FF5A1F', bg: '#F5F5F0',
  white: '#FFFFFF', text: '#1C1C14',
  muted: '#6B6B60', border: '#E8E8E0',
  green: '#16A34A', greenBg: '#DCFCE7'
}

export default function VendorDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [todayOrders, setTodayOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [vendorRes, ordersRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { headers }),
        axios.get(`${API}/orders/vendor`, { headers })
      ])
      setVendor(vendorRes.data.user)
      setTodayOrders(ordersRes.data.orders)
    } catch (err) {
      console.error('Failed to fetch vendor data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleShop() {
    setToggling(true)
    try {
      const res = await axios.patch(`${API}/vendors/me/toggle-open`, {}, { headers })
      setVendor(prev => ({ ...prev, is_open: res.data.is_open }))
    } catch (err) {
      console.error('Failed to toggle shop:', err)
    } finally {
      setToggling(false)
    }
  }

  const pendingOrders = todayOrders.filter(o => o.status === 'pending')
  const todayRevenue = todayOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_amt, 0)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ fontSize: 32 }}>🧺</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 4
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
              {vendor?.shop_name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              Tokri Partner Dashboard
            </div>
          </div>
          <button onClick={onLogout} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 8, padding: '6px 12px',
            color: 'white', fontSize: 12, fontWeight: 600
          }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Open/Close Toggle */}
        <div style={{
          background: C.white, borderRadius: 16,
          padding: '16px', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
              Shop Status
            </div>
            <div style={{
              fontSize: 13, fontWeight: 600, marginTop: 2,
              color: vendor?.is_open ? C.green : '#EF4444'
            }}>
              {vendor?.is_open ? 'Open — accepting orders' : 'Closed — not accepting orders'}
            </div>
          </div>
          <button onClick={toggleShop} disabled={toggling} style={{
            background: vendor?.is_open ? '#EF4444' : C.green,
            border: 'none', borderRadius: 10,
            padding: '10px 20px', color: 'white',
            fontSize: 13, fontWeight: 700,
            opacity: toggling ? 0.6 : 1
          }}>
            {toggling ? '...' : vendor?.is_open ? 'Close Shop' : 'Open Shop'}
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 12
        }}>
          {[
            { label: 'Pending', value: pendingOrders.length, color: C.primary },
            { label: 'Today orders', value: todayOrders.length, color: C.green },
            { label: 'Revenue', value: `₹${todayRevenue}`, color: '#7C3AED' }
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.white, borderRadius: 12,
              padding: '12px', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Pending Orders Alert */}
        {pendingOrders.length > 0 && (
          <div style={{
            background: '#FFF0EA', borderRadius: 12,
            padding: '14px', marginBottom: 12,
            border: `1.5px solid ${C.primary}`,
            cursor: 'pointer'
          }} onClick={() => navigate('/vendor/orders')}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>
              🔔 {pendingOrders.length} order{pendingOrders.length > 1 ? 's' : ''} waiting!
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              Tap to view and accept
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10
        }}>
          {[
            { icon: '📋', label: 'Manage Orders', path: '/vendor/orders', color: '#EFF6FF' },
            { icon: '🛍️', label: 'My Products', path: '/vendor/products', color: '#F0FDF4' }
          ].map(action => (
            <button key={action.path}
              onClick={() => navigate(action.path)}
              style={{
                background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '16px',
                textAlign: 'center', cursor: 'pointer'
              }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{action.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                {action.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: C.white, borderTop: `1px solid ${C.border}`,
        display: 'flex', padding: '8px 0'
      }}>
        {[
          { icon: '🏠', label: 'Dashboard', path: '/vendor' },
          { icon: '📋', label: 'Orders', path: '/vendor/orders' },
          { icon: '🛍️', label: 'Products', path: '/vendor/products' }
        ].map(item => (
          <button key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              fontSize: 10,
              color: item.path === '/vendor' ? C.primary : C.muted,
              padding: '4px 0',
              fontWeight: item.path === '/vendor' ? 700 : 400
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}