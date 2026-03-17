import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#FF5A1F', bg: '#F5F5F0',
  white: '#FFFFFF', text: '#1C1C14',
  muted: '#6B6B60', border: '#E8E8E0',
  green: '#16A34A'
}

const STATUS_STEPS = ['pending', 'accepted', 'packing', 'out_for_delivery', 'delivered']
const STATUS_LABELS = {
  pending: 'Order Placed',
  accepted: 'Accepted',
  packing: 'Packing',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
}
const STATUS_EMOJI = {
  pending: '🕐',
  accepted: '✅',
  packing: '📦',
  out_for_delivery: '🛵',
  delivered: '🎉',
  rejected: '❌',
  cancelled: '❌'
}

export default function OrdersPage({ user }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchOrders() {
    try {
      const res = await axios.get(`${API}/orders/my`, { headers })
      setOrders(res.data.orders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
          My Orders
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
          Updates every 10 seconds
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <div style={{ color: C.muted, fontSize: 16, marginBottom: 20 }}>
              No orders yet
            </div>
            <button onClick={() => navigate('/')} style={{
              background: C.primary, border: 'none',
              borderRadius: 10, padding: '12px 24px',
              color: 'white', fontSize: 14, fontWeight: 700
            }}>Start Shopping</button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} style={{
              background: C.white, borderRadius: 16,
              padding: '16px', marginBottom: 12,
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
            }}>

              {/* Order header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 12
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                    {order.order_number}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {order.vendors?.shop_name}
                  </div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: order.status === 'delivered' ? C.green :
                         order.status === 'rejected' ? '#EF4444' : C.primary
                }}>
                  {STATUS_EMOJI[order.status]} {STATUS_LABELS[order.status]}
                </div>
              </div>

              {/* Status stepper */}
              {!['rejected', 'cancelled'].includes(order.status) && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  marginBottom: 12, gap: 4
                }}>
                  {STATUS_STEPS.map((step, index) => {
                    const currentIndex = STATUS_STEPS.indexOf(order.status)
                    const isDone = index <= currentIndex
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: isDone ? C.primary : C.border,
                          flexShrink: 0
                        }} />
                        {index < STATUS_STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 2,
                            background: index < currentIndex ? C.primary : C.border
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Order items */}
              <div style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 10, marginTop: 4
              }}>
                {order.order_items?.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, color: C.muted, marginBottom: 4
                  }}>
                    <span>{item.product_name} × {item.qty}</span>
                    <span>₹{(item.unit_price / 100 * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, fontWeight: 800, color: C.text,
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 8, marginTop: 4
                }}>
                  <span>Total</span>
                  <span>₹{order.total_amt}</span>
                </div>
              </div>

              {/* Rejected reason */}
              {order.status === 'rejected' && order.reject_reason && (
                <div style={{
                  marginTop: 10, padding: '8px 12px',
                  background: '#FEE2E2', borderRadius: 8,
                  fontSize: 12, color: '#EF4444'
                }}>
                  Reason: {order.reject_reason}
                </div>
              )}
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
              fontSize: 10, color: item.path === '/orders' ? C.primary : C.muted,
              padding: '4px 0', fontWeight: item.path === '/orders' ? 700 : 400
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}