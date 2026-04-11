import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#0c8a3f', primaryLight: '#e8f5e9',
  bg: '#f5f5f0', white: '#FFFFFF',
  text: '#111111', muted: '#777777', border: '#e8e8e8'
}

export default function CartPage({ user }) {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [vendorId, setVendorId] = useState(null)
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [error, setError] = useState('')

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const saved = localStorage.getItem('tokri_cart')
    const savedVendor = localStorage.getItem('tokri_vendor_id')
    if (saved) setCartItems(JSON.parse(saved))
    if (savedVendor) setVendorId(savedVendor)

    const savedUser = localStorage.getItem('tokri_user')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      if (u.address) setAddress(u.address)
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.qty), 0)
  const deliveryFee = 8
  const platformFee = 3
  const total = subtotal + deliveryFee + platformFee

  function updateQty(productId, change) {
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.id === productId ? { ...item, qty: item.qty + change } : item
      ).filter(item => item.qty > 0)
      localStorage.setItem('tokri_cart', JSON.stringify(updated))
      return updated
    })
  }

  async function placeOrder() {
    if (!address.trim()) { setError('Please enter your delivery address'); return }
    if (cartItems.length === 0) { setError('Your cart is empty'); return }

    setLoading(true)
    setError('')

    try {
      const orderRes = await axios.post(`${API}/orders`, {
        vendor_id: vendorId,
        items: cartItems.map(i => ({ product_id: i.id, qty: i.qty })),
        delivery_address: address,
        payment_method: paymentMethod,
        customer_note: note
      }, { headers })

      const orderId = orderRes.data.order?.id

      if (paymentMethod === 'cod') {
        localStorage.removeItem('tokri_cart')
        localStorage.removeItem('tokri_vendor_id')
        navigate('/orders')
        return
      }

      const payRes = await axios.post(`${API}/payments/create-order`, {
        order_id: orderId, amount: total
      }, { headers })

      const { razorpay_order_id, amount, currency, key_id } = payRes.data

      const options = {
        key: key_id, amount, currency,
        name: 'Tokri 🧺',
        description: 'Grocery Order Payment',
        order_id: razorpay_order_id,
        handler: async function (response) {
          await axios.post(`${API}/payments/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            order_id: orderId
          }, { headers })
          localStorage.removeItem('tokri_cart')
          localStorage.removeItem('tokri_vendor_id')
          navigate('/orders')
        },
        prefill: { contact: user?.phone || '' },
        theme: { color: '#0c8a3f' },
        modal: {
          ondismiss: function () {
            setLoading(false)
            setError('Payment cancelled. Try again.')
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100, fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '14px 14px 16px' }}>
        <button onClick={() => navigate(-1)} style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: 'white', fontSize: 14, marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}>←</button>
        <div style={{ fontSize: 19, fontWeight: 900, color: 'white' }}>Your Cart</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ padding: '14px' }}>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ color: C.muted, fontSize: 16 }}>Your cart is empty</div>
            <button onClick={() => navigate('/')} style={{
              marginTop: 20, background: C.primary,
              border: 'none', borderRadius: 12,
              padding: '12px 24px', color: 'white',
              fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>Browse Stores</button>
          </div>
        ) : (
          <>
            {/* Cart items */}
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 12, overflow: 'hidden' }}>
              {cartItems.map((item, idx) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderBottom: idx < cartItems.length - 1 ? `1px solid ${C.border}` : 'none'
                }}>
                  <div style={{
                    width: 44, height: 44, background: '#f8f8f8',
                    borderRadius: 10, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 22, flexShrink: 0
                  }}>{item.emoji || '📦'}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{item.unit}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginTop: 2 }}>
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: C.primaryLight, borderRadius: 8, padding: '4px 8px'
                  }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: C.primary, color: 'white', fontSize: 16,
                      fontWeight: 700, cursor: 'pointer', lineHeight: 1
                    }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.primary, minWidth: 20, textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button onClick={() => updateQty(item.id, 1)} style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: C.primary, color: 'white', fontSize: 16,
                      fontWeight: 700, cursor: 'pointer', lineHeight: 1
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div style={{
              background: C.white, borderRadius: 14,
              padding: '14px', marginBottom: 12,
              border: `1px solid ${C.border}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                📍 Delivery Address
              </div>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter your full delivery address..."
                rows={3}
                style={{
                  width: '100%', border: `1.5px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: C.text, resize: 'none',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Note */}
            <div style={{
              background: C.white, borderRadius: 14,
              padding: '14px', marginBottom: 12,
              border: `1px solid ${C.border}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                📝 Note for vendor (optional)
              </div>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Please deliver before 7pm"
                style={{
                  width: '100%', border: `1.5px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: C.text, boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Payment method */}
            <div style={{
              background: C.white, borderRadius: 14,
              padding: '14px', marginBottom: 12,
              border: `1px solid ${C.border}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                Pay with
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'upi', icon: '📱', label: 'UPI / Card', desc: 'Pay online' },
                  { id: 'cod', icon: '💵', label: 'Cash', desc: 'Pay on delivery' }
                ].map(method => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10,
                    border: `2px solid ${paymentMethod === method.id ? C.primary : C.border}`,
                    background: paymentMethod === method.id ? C.primaryLight : C.white,
                    cursor: 'pointer', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{method.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: paymentMethod === method.id ? C.primary : C.text }}>
                      {method.label}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted }}>{method.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bill summary */}
            <div style={{
              background: '#f9f9f9', borderRadius: 14,
              padding: '14px', marginBottom: 12,
              border: `1px solid ${C.border}`
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                Bill Summary
              </div>
              {[
                { label: 'Item total', value: `₹${subtotal.toFixed(2)}` },
                { label: 'Delivery fee', value: `₹${deliveryFee}` },
                { label: 'Platform fee', value: `₹${platformFee}` },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: C.muted, marginBottom: 7
                }}>
                  <span>{row.label}</span><span>{row.value}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 14, fontWeight: 800, color: C.text,
                borderTop: `1px dashed ${C.border}`, paddingTop: 8, marginTop: 4
              }}>
                <span>To Pay</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div style={{
                color: '#EF4444', fontSize: 12,
                marginBottom: 10, textAlign: 'center',
                background: '#FEE2E2', padding: '8px 12px',
                borderRadius: 8
              }}>{error}</div>
            )}
          </>
        )}
      </div>

      {/* Place order button */}
      {cartItems.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px',
          background: C.bg
        }}>
          <button onClick={placeOrder} disabled={loading} style={{
            width: '100%', background: C.primary,
            border: 'none', borderRadius: 14,
            padding: '0 20px', color: 'white',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', height: 54,
            fontSize: 14, fontWeight: 800,
            opacity: loading ? 0.6 : 1, cursor: 'pointer'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 500 }}>
                {paymentMethod === 'upi' ? 'Pay via UPI / Card' : 'Cash on Delivery'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>
                {loading ? 'Processing...' : `₹${total.toFixed(2)}`}
              </div>
            </div>
            <div style={{ fontSize: 14 }}>
              {loading ? '⏳' : 'Place Order →'}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}