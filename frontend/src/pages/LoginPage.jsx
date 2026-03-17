import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const C = {
  primary: '#FF5A1F',
  bg: '#F5F5F0',
  white: '#FFFFFF',
  text: '#1C1C14',
  muted: '#6B6B60',
  border: '#E8E8E0',
}

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOTP() {
    const cleaned = phone.replace(/\s/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError('Please enter a valid 10 digit mobile number')
      return
    }
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API}/auth/send-otp`, {
      phone: `+91${phone.replace(/\s/g, '')}`,  
        role
      })
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) {
      setError('Please enter the 6 digit OTP')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, {
        phone: `+91${phone}`,
        otp,
        role
      })
      onLogin(res.data.user, res.data.user.role || role, res.data.token)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px'
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🧺</div>
        <div style={{
          fontSize: 32, fontWeight: 800,
          color: C.primary, letterSpacing: -0.5
        }}>Tokri</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
          {step === 'phone' && 'Your neighbourhood grocery store'}
          {step === 'otp' && `OTP sent to +91 ${phone}`}
        </div>
      </div>

      {/* Role Toggle */}
      {step === 'phone' && (
        <div style={{
          display: 'flex', background: C.white,
          borderRadius: 12, padding: 4,
          marginBottom: 20, border: `1px solid ${C.border}`
        }}>
          {['customer', 'vendor'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1, padding: '10px',
              borderRadius: 10, border: 'none',
              background: role === r ? C.primary : 'transparent',
              color: role === r ? C.white : C.muted,
              fontWeight: 700, fontSize: 14,
              transition: 'all 0.2s'
            }}>
              {r === 'customer' ? 'Customer' : 'Vendor'}
            </button>
          ))}
        </div>
      )}

      {/* Phone Input */}
      {step === 'phone' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{
              background: C.white, border: `1.5px solid ${C.border}`,
              borderRadius: 10, padding: '0 14px',
              display: 'flex', alignItems: 'center',
              fontSize: 16, fontWeight: 600, color: C.text
            }}>+91</div>
            <input
              style={{
                flex: 1, background: C.white,
                border: `1.5px solid ${C.border}`,
                borderRadius: 10, padding: '0 16px',
                fontSize: 18, fontWeight: 600,
                color: C.text, height: 52
              }}
              placeholder="Mobile number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={10}
              type="tel"
              autoFocus
            />
          </div>
          {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button
            onClick={handleSendOTP}
            disabled={loading}
            style={{
              width: '100%', background: C.primary,
              border: 'none', borderRadius: 10,
              height: 52, color: C.white,
              fontSize: 16, fontWeight: 800,
              opacity: loading ? 0.6 : 1
            }}>
            {loading ? 'Sending...' : 'Get OTP'}
          </button>
        </div>
      )}

      {/* OTP Input */}
      {step === 'otp' && (
        <div>
          <input
            style={{
              width: '100%', background: C.white,
              border: `1.5px solid ${C.border}`,
              borderRadius: 10, padding: '0 16px',
              fontSize: 28, fontWeight: 800,
              color: C.text, height: 64,
              textAlign: 'center', letterSpacing: 8,
              marginBottom: 14
            }}
            placeholder="• • • • • •"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            maxLength={6}
            type="tel"
            autoFocus
          />
          {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <button
            onClick={handleVerifyOTP}
            disabled={loading}
            style={{
              width: '100%', background: C.primary,
              border: 'none', borderRadius: 10,
              height: 52, color: C.white,
              fontSize: 16, fontWeight: 800,
              opacity: loading ? 0.6 : 1,
              marginBottom: 14
            }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            style={{
              width: '100%', background: 'transparent',
              border: 'none', color: C.muted,
              fontSize: 14, padding: 8
            }}>
            ← Change number
          </button>
        </div>
      )}

      <div style={{
        textAlign: 'center', color: C.muted,
        fontSize: 11, marginTop: 32, lineHeight: 1.5
      }}>
        By continuing you agree to our Terms of Service
      </div>
    </div>
  )
}