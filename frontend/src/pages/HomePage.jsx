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

export default function HomePage({ user, onLogout }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    try {
      const token = localStorage.getItem('tokri_token')
      const res = await axios.get(`${API}/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendors(res.data.vendors)
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = vendors.filter(v =>
    v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    v.area?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: C.primary, padding: '16px 16px 20px'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 12
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>
              🧺 Tokri
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              Namaste, {user?.name || 'there'} 👋
            </div>
          </div>
          <button onClick={onLogout} style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: 8,
            padding: '6px 12px', color: C.white,
            fontSize: 12, fontWeight: 600
          }}>Logout</button>
        </div>

        {/* Search */}
        <div style={{
          background: C.white, borderRadius: 12,
          padding: '10px 14px', display: 'flex',
          alignItems: 'center', gap: 8
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            style={{
              flex: 1, border: 'none', fontSize: 14,
              color: C.text, background: 'transparent'
            }}
            placeholder="Search stores or areas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: C.muted, marginBottom: 12
        }}>
          {loading ? 'Finding stores near you...' :
            `${filtered.length} store${filtered.length !== 1 ? 's' : ''} nearby`}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            Loading stores...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏪</div>
            <div style={{ color: C.muted }}>No stores found</div>
          </div>
        ) : (
          filtered.map(vendor => (
            <div key={vendor.id}
              onClick={() => navigate(`/store/${vendor.id}`)}
              style={{
                background: C.white, borderRadius: 16,
                padding: 16, marginBottom: 12,
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                cursor: 'pointer'
              }}>

              {/* Store header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 8
              }}>
                <div>
                  <div style={{
                    fontSize: 16, fontWeight: 800,
                    color: C.text, marginBottom: 2
                  }}>{vendor.shop_name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {vendor.area} · {vendor.address?.split(',')[0]}
                  </div>
                </div>
                <div style={{
                  background: vendor.is_open ? C.greenBg : '#FEE2E2',
                  color: vendor.is_open ? C.green : '#EF4444',
                  padding: '4px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700
                }}>
                  {vendor.is_open ? 'Open' : 'Closed'}
                </div>
              </div>

              {/* Store details */}
              <div style={{
                display: 'flex', gap: 16,
                fontSize: 12, color: C.muted
              }}>
                <span>⭐ {vendor.rating || '4.5'}</span>
                <span>🕐 20-30 min</span>
                <span>🛵 ₹{vendor.delivery_fee || 8} delivery</span>
                <span>Min ₹{vendor.min_order_amt || 99}</span>
              </div>
            </div>
          ))
        )}
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
          { icon: '🏠', label: 'Home', path: '/' },
          { icon: '📦', label: 'Orders', path: '/orders' },
          { icon: '👤', label: 'Profile', path: '/profile' }
        ].map(item => (
          <button key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              fontSize: 10, color: C.muted, padding: '4px 0'
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}