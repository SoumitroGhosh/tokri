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

export default function VendorOrders({ user }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [acting, setActing] = useState(null)

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchOrders() {
    try {
      const res = await axios.get(`${API}/orders/vendor`, { headers })
      setOrders(res.data.orders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function acceptOrder(orderId) {
    setActing(orderId)
    try {
      await axios.patch(`${API}/orders/${orderId}/accept`, {}, { headers })
      fetchOrders()
      setFilter('accepted')
    } catch (err) {
      console.error('Failed to accept order:', err)
    } finally {
      setActing(null)
    }
  }

  async function rejectOrder(orderId) {
    setActing(orderId)
    try {
      await axios.patch(`${API}/orders/${orderId}/reject`,
        { reason: 'Vendor unavailable' }, { headers })
      fetchOrders()
    } catch (err) {
      console.error('Failed to reject order:', err)
    } finally {
      setActing(null)
    }
  }

async function updateStatus(orderId, status) {
    setActing(orderId)
    try {
      await axios.patch(`${API}/orders/${orderId}/status`,
        { status }, { headers })
      fetchOrders()
      setFilter(status)
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setActing(null)
    }
  }
  

  const filters = ['pending', 'accepted', 'packing', 'out_for_delivery', 'delivered']
  const filtered = orders.filter(o => o.status === filter)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/vendor')} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 8, padding: '6px 10px',
            color: 'white', fontSize: 16
          }}>←</button>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
            Manage Orders
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px',
        overflowX: 'auto', background: C.white,
        borderBottom: `1px solid ${C.border}`
      }}>
        {filters.map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            style={{
              flexShrink: 0, padding: '6px 12px',
              borderRadius: 20, border: 'none',
              background: filter === f ? C.primary : C.bg,
              color: filter === f ? 'white' : C.muted,
              fontSize: 11, fontWeight: 600,
              textTransform: 'capitalize'
            }}>
            {f.replace('_', ' ')}
            {f === 'pending' && orders.filter(o => o.status === 'pending').length > 0 &&
              <span style={{
                marginLeft: 4, background: 'white',
                color: C.primary, borderRadius: 10,
                padding: '0 5px', fontSize: 10, fontWeight: 800
              }}>
                {orders.filter(o => o.status === 'pending').length}
              </span>
            }
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            Loading orders...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ color: C.muted }}>No {filter} orders</div>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} style={{
              background: C.white, borderRadius: 16,
              padding: '16px', marginBottom: 12,
              boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
            }}>

              {/* Order header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 10
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                    {order.order_number}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {order.users?.name || 'Customer'} · {order.users?.phone}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.primary }}>
                  ₹{order.total_amt}
                </div>
              </div>

              {/* Items */}
              <div style={{
                background: C.bg, borderRadius: 8,
                padding: '10px 12px', marginBottom: 10
              }}>
                {order.order_items?.map((item, i) => (
                  <div key={i} style={{
                    fontSize: 12, color: C.text,
                    marginBottom: 3, display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{item.product_name} × {item.qty}</span>
                    <span style={{ color: C.muted }}>{item.product_unit}</span>
                  </div>
                ))}
              </div>

              {/* Delivery address */}
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
                📍 {order.delivery_address}
              </div>

              {/* Customer note */}
              {order.customer_note && (
                <div style={{
                  fontSize: 12, color: C.primary,
                  marginBottom: 10, fontStyle: 'italic'
                }}>
                  Note: {order.customer_note}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => acceptOrder(order.id)}
                      disabled={acting === order.id}
                      style={{
                        flex: 1, background: C.green,
                        border: 'none', borderRadius: 10,
                        padding: '12px', color: 'white',
                        fontSize: 13, fontWeight: 800,
                        opacity: acting === order.id ? 0.6 : 1
                      }}>
                      Accept
                    </button>
                    <button
                      onClick={() => rejectOrder(order.id)}
                      disabled={acting === order.id}
                      style={{
                        flex: 1, background: '#EF4444',
                        border: 'none', borderRadius: 10,
                        padding: '12px', color: 'white',
                        fontSize: 13, fontWeight: 800,
                        opacity: acting === order.id ? 0.6 : 1
                      }}>
                      Reject
                    </button>
                  </>
                )}
                {order.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus(order.id, 'packing')}
                    disabled={acting === order.id}
                    style={{
                      flex: 1, background: C.primary,
                      border: 'none', borderRadius: 10,
                      padding: '12px', color: 'white',
                      fontSize: 13, fontWeight: 800
                    }}>
                    Start Packing
                  </button>
                )}
                {order.status === 'packing' && (
                  <button
                    onClick={() => updateStatus(order.id, 'out_for_delivery')}
                    disabled={acting === order.id}
                    style={{
                      flex: 1, background: C.primary,
                      border: 'none', borderRadius: 10,
                      padding: '12px', color: 'white',
                      fontSize: 13, fontWeight: 800
                    }}>
                    Out for Delivery
                  </button>
                )}
                {order.status === 'out_for_delivery' && (
                  <button
                    onClick={() => updateStatus(order.id, 'delivered')}
                    disabled={acting === order.id}
                    style={{
                      flex: 1, background: C.green,
                      border: 'none', borderRadius: 10,
                      padding: '12px', color: 'white',
                      fontSize: 13, fontWeight: 800
                    }}>
                    Mark Delivered
                  </button>
                )}
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
              color: item.path === '/vendor/orders' ? C.primary : C.muted,
              padding: '4px 0',
              fontWeight: item.path === '/vendor/orders' ? 700 : 400
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}