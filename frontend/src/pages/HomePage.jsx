import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#0c8a3f', primaryDark: '#097a37',
  primaryLight: '#e8f5e9', primaryFaint: '#f0faf3',
  orange: '#f97316', orangeLight: '#fff3e0',
  bg: '#f5f5f0', white: '#FFFFFF',
  text: '#111111', muted: '#777777',
  border: '#e8e8e8', green: '#0c8a3f',
  greenBg: '#e8f5e9'
}

export default function HomePage({ user, onLogout }) {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchVendors() }, [])

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

  const categories = [
    { emoji: '🌾', name: 'Staples', bg: '#fff3e0' },
    { emoji: '🥬', name: 'Veggies', bg: '#e8f5e9' },
    { emoji: '🥛', name: 'Dairy', bg: '#fce4ec' },
    { emoji: '🧴', name: 'Personal', bg: '#e3f2fd' },
    { emoji: '🍪', name: 'Snacks', bg: '#f3e5f5' },
    { emoji: '🧃', name: 'Drinks', bg: '#fff9c4' },
    { emoji: '🧹', name: 'Cleaning', bg: '#e8f5e9' },
    { emoji: '💊', name: 'Health', bg: '#fbe9e7' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80, fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px 16px 14px' }}>

        {/* Location row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ fontSize: 17, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>
                {user?.area || 'Pimpri'}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginLeft: 2 }}>▼</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1, paddingLeft: 2 }}>
              Pimpri-Chinchwad, 411018
            </div>
          </div>
          <button onClick={onLogout} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 20, padding: '5px 12px',
            color: 'white', fontSize: 11, fontWeight: 600
          }}>Logout</button>
        </div>

        {/* Search bar */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '9px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 12, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>🔍</span>
          <input
            style={{
              flex: 1, border: 'none', fontSize: 13,
              color: 'white', background: 'transparent',
              outline: 'none'
            }}
            placeholder="Search stores or areas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Promo banner */}
      <div style={{
        margin: '14px 14px 0',
        background: 'linear-gradient(110deg, #fff3e0 0%, #ffe0b2 100%)',
        borderRadius: 14, padding: '12px 14px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', border: '1px solid #ffd0a0'
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#bf5000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Limited Time
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#7c2d00', marginTop: 1 }}>
            Get ₹50 off on ₹299+
          </div>
        </div>
        <div style={{
          background: '#e65100', color: 'white',
          fontSize: 11, fontWeight: 700,
          padding: '6px 14px', borderRadius: 20
        }}>CLAIM</div>
      </div>

      {/* Categories */}
      <div style={{ padding: '16px 14px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>
          Shop by Category
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10
        }}>
          {categories.map(cat => (
            <div key={cat.name} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 5, cursor: 'pointer'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: cat.bg,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24
              }}>{cat.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#444', textAlign: 'center' }}>
                {cat.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stores */}
      <div style={{ padding: '16px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 12 }}>
          {loading ? 'Finding stores...' : `Stores Near You (${filtered.length})`}
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
                padding: '12px 14px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 12,
                border: `1px solid ${C.border}`, cursor: 'pointer'
              }}>

              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: C.greenBg,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0
              }}>🏪</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                  {vendor.shop_name}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {vendor.area} · 🛵 ₹{vendor.delivery_fee || 8} · Min ₹{vendor.min_order_amt || 99}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: C.muted }}>
                  <span>⭐ {vendor.rating || '4.5'}</span>
                  <span>🕐 20–30 min</span>
                </div>
              </div>

              <div style={{
                background: vendor.is_open ? C.greenBg : '#FEE2E2',
                color: vendor.is_open ? C.green : '#EF4444',
                padding: '4px 10px', borderRadius: 20,
                fontSize: 10, fontWeight: 700, flexShrink: 0
              }}>
                {vendor.is_open ? 'OPEN' : 'CLOSED'}
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
        display: 'flex', padding: '8px 0 4px'
      }}>
        {[
          { icon: '🏠', label: 'Home', path: '/' },
          { icon: '🔍', label: 'Search', path: '/' },
          { icon: '📦', label: 'Orders', path: '/orders' },
          { icon: '👤', label: 'Profile', path: '/profile' }
        ].map(item => (
          <button key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, cursor: 'pointer',
              color: item.label === 'Home' ? C.primary : C.muted,
              fontSize: 10, fontWeight: 600, padding: '4px 0'
            }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}