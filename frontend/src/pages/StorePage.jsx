import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#FF5A1F', bg: '#F5F5F0',
  white: '#FFFFFF', text: '#1C1C14',
  muted: '#6B6B60', border: '#E8E8E0',
  green: '#16A34A'
}

export default function StorePage({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState(null)
  const [cart, setCart] = useState({})
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchStore()
    fetchCategories()
  }, [id])

  async function fetchStore() {
    try {
      const [vendorRes, productsRes] = await Promise.all([
        axios.get(`${API}/vendors/${id}`, { headers }),
        axios.get(`${API}/products?vendor_id=${id}`, { headers })
      ])
      setVendor(vendorRes.data.vendor)
      setProducts(productsRes.data.products)
    } catch (err) {
      console.error('Failed to fetch store:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API}/products/categories`, { headers })
      setCategories(res.data.categories)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  function addToCart(product) {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        ...product,
        qty: (prev[product.id]?.qty || 0) + 1
      }
    }))
  }

  function removeFromCart(productId) {
    setCart(prev => {
      const updated = { ...prev }
      if (updated[productId]?.qty > 1) {
        updated[productId] = { ...updated[productId], qty: updated[productId].qty - 1 }
      } else {
        delete updated[productId]
      }
      return updated
    })
  }

  const cartItems = Object.values(cart)
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  const filteredProducts = selectedCat
    ? products.filter(p => p.category_id === selectedCat)
    : products

  function goToCart() {
    localStorage.setItem('tokri_cart', JSON.stringify(cartItems))
    localStorage.setItem('tokri_vendor_id', id)
    navigate('/cart')
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ fontSize: 32 }}>🧺</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 8, padding: '6px 10px',
            color: 'white', fontSize: 16
          }}>←</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
              {vendor?.shop_name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              {vendor?.area} · Min ₹{vendor?.min_order_amt}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        overflowX: 'auto', background: C.white,
        borderBottom: `1px solid ${C.border}`
      }}>
        <button
          onClick={() => setSelectedCat(null)}
          style={{
            flexShrink: 0, padding: '6px 14px',
            borderRadius: 20, border: 'none',
            background: !selectedCat ? C.primary : C.bg,
            color: !selectedCat ? 'white' : C.muted,
            fontSize: 12, fontWeight: 600
          }}>All</button>
        {categories.map(cat => (
          <button key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            style={{
              flexShrink: 0, padding: '6px 14px',
              borderRadius: 20, border: 'none',
              background: selectedCat === cat.id ? C.primary : C.bg,
              color: selectedCat === cat.id ? 'white' : C.muted,
              fontSize: 12, fontWeight: 600
            }}>
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Products */}
      <div style={{ padding: '16px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            No products in this category
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} style={{
              background: C.white, borderRadius: 12,
              padding: '12px 14px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 32 }}>{product.emoji || '📦'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {product.unit}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.primary, marginTop: 2 }}>
                  ₹{product.price}
                </div>
              </div>

              {/* Add to cart controls */}
              {cart[product.id] ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#FFF0EA', borderRadius: 8, padding: '4px 8px'
                }}>
                  <button onClick={() => removeFromCart(product.id)} style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: 'none', background: C.primary,
                    color: 'white', fontSize: 16, fontWeight: 700
                  }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.primary, minWidth: 20, textAlign: 'center' }}>
                    {cart[product.id].qty}
                  </span>
                  <button onClick={() => addToCart(product)} style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: 'none', background: C.primary,
                    color: 'white', fontSize: 16, fontWeight: 700
                  }}>+</button>
                </div>
              ) : (
                <button onClick={() => addToCart(product)} style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: 'none', background: C.primary,
                  color: 'white', fontSize: 20, fontWeight: 700
                }}>+</button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cart Bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px',
          background: 'transparent'
        }}>
          <button onClick={goToCart} style={{
            width: '100%', background: C.primary,
            border: 'none', borderRadius: 12,
            padding: '14px 20px', color: 'white',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 14, fontWeight: 800
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 6, padding: '2px 8px'
            }}>{cartCount} items</span>
            <span>View Cart →</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}