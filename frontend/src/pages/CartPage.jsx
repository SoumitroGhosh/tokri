import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#FF5A1F', bg: '#F5F5F0',
  white: '#FFFFFF', text: '#1C1C14',
  muted: '#6B6B60', border: '#E8E8E0'
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

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.qty), 0)
  const deliveryFee = 8
  const total = subtotal + deliveryFee

  function updateQty(productId, change) {
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.id === productId
          ? { ...item, qty: item.qty + change }
          : item
      ).filter(item => item.qty > 0)
      localStorage.setItem('tokri_cart', JSON.stringify(updated))
      return updated
    })
  }

  async function placeOrder() {
    if (!address.trim()) {
      setError('Please enter your delivery address')
      return
    }
    if (cartItems.length === 0) {
      setError('Your cart is empty')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1 — Create order in Tokri database
      const orderRes = await axios.post(`${API}/orders`, {
        vendor_id: vendorId,
        items: cartItems.map(i => ({
          product_id: i.id,
          qty: i.qty
        })),
        delivery_address: address,
        payment_method: paymentMethod,
        customer_note: note
      }, { headers })

      const orderId = orderRes.data.order?.id

      if (paymentMethod === 'cod') {
        // Cash on delivery — go straight to orders
        localStorage.removeItem('tokri_cart')
        localStorage.removeItem('tokri_vendor_id')
        navigate('/orders')
        return
      }

      // Step 2 — Create Razorpay payment order
      const payRes = await axios.post(`${API}/payments/create-order`, {
        order_id: orderId,
        amount: total
      }, { headers })

      const { razorpay_order_id, amount, currency, key_id } = payRes.data

      // Step 3 — Open Razorpay checkout popup
      const options = {
        key: key_id,
        amount,
        currency,
        name: 'Tokri 🧺',
        description: 'Grocery Order Payment',
        order_id: razorpay_order_id,
        handler: async function (response) {
          // Step 4 — Verify payment on backend
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
        prefill: {
          contact: user?.phone || ''
        },
        theme: {
          color: '#FF5A1F'
        },
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
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 8, padding: '6px 10px',
            color: 'white', fontSize: 16
          }}>←</button>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
            Your Cart
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
            <div style={{ color: C.muted, fontSize: 16 }}>Your cart is empty</div>
            <button onClick={() => navigate('/')} style={{
              marginTop: 20, background: C.primary,
              border: 'none', borderRadius: 12,
              padding: '12px 24px', color: 'white',
              fontSize: 14, fontWeight: 700
            }}>Browse Stores</button>
          </div>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={item.id} style={{
                background: C.white, borderRadius: 12,
                padding: '12px 14px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{ fontSize: 28 }}>{item.emoji || '📦'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>{item.unit}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>
                    ₹{(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#FFF0EA', borderRadius: 8, padding: '4px 8px'
                }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: 'none', background: C.primary,
                    color: 'white', fontSize: 16, fontWeight: 700
                  }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.primary, minWidth: 20, textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button onClick={() => updateQty(item.id, 1)} style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: 'none', background: C.primary,
                    color: 'white', fontSize: 16, fontWeight: 700
                  }}>+</button>
                </div>
              </div>
            ))}

            {/* Delivery Address */}
            <div style={{
              background: C.white, borderRadius: 12,
              padding: '14px', marginTop: 16, marginBottom: 8
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Delivery Address
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
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Note */}
            <div style={{
              background: C.white, borderRadius: 12,
              padding: '14px', marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Note for vendor (optional)
              </div>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Please deliver before 7pm"
                style={{
                  width: '100%', border: `1.5px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: C.text
                }}
              />
            </div>

            {/* Payment Method */}
            <div style={{
              background: C.white, borderRadius: 12,
              padding: '14px', marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                Payment Method
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { id: 'upi', label: '💳 UPI / Card', desc: 'Pay online' },
                  { id: 'cod', label: '💵 Cash', desc: 'Pay on delivery' }
                ].map(method => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10,
                    border: `2px solid ${paymentMethod === method.id ? C.primary : C.border}`,
                    background: paymentMethod === method.id ? '#FFF0EA' : C.white,
                    cursor: 'pointer', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                      {method.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{method.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div style={{
              background: C.white, borderRadius: 12,
              padding: '14px', marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>
                Bill Summary
              </div>
              {[
                { label: 'Subtotal', value: `₹${subtotal.toFixed(2)}` },
                { label: 'Delivery fee', value: `₹${deliveryFee}` },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, color: C.muted, marginBottom: 6
                }}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 15, fontWeight: 800, color: C.text,
                borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4
              }}>
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div style={{
                marginTop: 8, fontSize: 11, color: C.muted,
                textAlign: 'center'
              }}>
                {paymentMethod === 'upi' ? '💳 Paying via UPI / Card' : '💵 Cash on Delivery'}
              </div>
            </div>

            {error && (
              <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10, textAlign: 'center' }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Place Order Button */}
      {cartItems.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px',
          background: C.bg
        }}>
          <button onClick={placeOrder} disabled={loading} style={{
            width: '100%', background: C.primary,
            border: 'none', borderRadius: 12,
            padding: '16px', color: 'white',
            fontSize: 16, fontWeight: 800,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Processing...' : paymentMethod === 'upi'
              ? `Pay ₹${total.toFixed(2)} via UPI`
              : `Place Order · ₹${total.toFixed(2)}`
            }
          </button>
        </div>
      )}
    </div>
  )
}