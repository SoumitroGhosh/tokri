import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#FF5A1F', bg: '#F5F5F0',
  white: '#FFFFFF', text: '#1C1C14',
  muted: '#6B6B60', border: '#E8E8E0'
}

export default function ProfilePage({ user, onLogout }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const savedUser = localStorage.getItem('tokri_user')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      setName(u.name || '')
      setAddress(u.address || '')
      setPincode(u.pincode || '')
    }
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await axios.patch(`${API}/user/profile`, {
        name, address, pincode
      }, { headers })

      localStorage.setItem('tokri_user', JSON.stringify(res.data.user))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
          My Profile
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#FFF0EA', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 8px'
          }}>👤</div>
          <div style={{ fontSize: 14, color: C.muted }}>
            {user?.phone}
          </div>
        </div>

        {/* Form */}
        <div style={{
          background: C.white, borderRadius: 16,
          padding: '16px', marginBottom: 12
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>
            Personal Details
          </div>

          {[
            { label: 'Your Name', value: name, setter: setName, placeholder: 'Enter your name' },
            { label: 'Delivery Address', value: address, setter: setAddress, placeholder: 'Enter your address' },
            { label: 'Pincode', value: pincode, setter: setPincode, placeholder: 'e.g. 411018' }
          ].map(field => (
            <div key={field.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>
                {field.label}
              </div>
              <input
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', border: `1.5px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 14, color: C.text
                }}
              />
            </div>
          ))}

          <button onClick={saveProfile} disabled={saving} style={{
            width: '100%', background: C.primary,
            border: 'none', borderRadius: 10,
            padding: '12px', color: 'white',
            fontSize: 14, fontWeight: 700,
            opacity: saving ? 0.6 : 1
          }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Logout */}
        <div style={{
          background: C.white, borderRadius: 16,
          padding: '16px', marginBottom: 12
        }}>
          <button onClick={onLogout} style={{
            width: '100%', background: 'transparent',
            border: `1.5px solid #EF4444`, borderRadius: 10,
            padding: '12px', color: '#EF4444',
            fontSize: 14, fontWeight: 700
          }}>
            Logout
          </button>
        </div>

        {/* App info */}
        <div style={{ textAlign: 'center', color: C.muted, fontSize: 11 }}>
          Tokri v1.0 · Your neighbourhood grocery store 🧺
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
              fontSize: 10,
              color: item.path === '/profile' ? C.primary : C.muted,
              padding: '4px 0',
              fontWeight: item.path === '/profile' ? 700 : 400
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}