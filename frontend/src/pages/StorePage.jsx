import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL
const C = {
  primary: '#0c8a3f', primaryLight: '#e8f5e9',
  bg: '#f5f5f0', white: '#FFFFFF',
  text: '#111111', muted: '#777777', border: '#e8e8e8'
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
      [product.id]: { ...product, qty: (prev[product.id]?.qty || 0) + 1 }
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
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 100, fontFamily: "'Outfit', sans-serif" }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '14px 14px 16px' }}>
        <button onClick={() => navigate('/')} style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: 'white', fontSize: 14, marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}>←</button>
        <div style={{ fontSize: 19, fontWeight: 900, color: 'white' }}>
          {vendor?.shop_name}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          {vendor?.area} · Pincode {vendor?.pincode || '411018'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {[
            `⭐ ${vendor?.rating || '4.5'}`,
            `🕐 20–30 min`,
            `🛵 ₹${vendor?.delivery_fee || 8}`
          ].map(pill => (
            <div key={pill} style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 20, padding: '4px 10px',
              fontSize: 10, fontWeight: 600, color: 'white'
            }}>{pill}</div>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 14px',
        overflowX: 'auto', background: C.white,
        borderBottom: `1px solid ${C.border}`
      }}>
        {[{ id: null, name: 'All', emoji: '' }, ...categories].map(cat => (
          <button key={cat.id ?? 'all'}
            onClick={() => setSelectedCat(cat.id)}
            style={{
              flexShrink: 0, padding: '6px 14px',
              borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1.5px solid ${selectedCat === cat.id ? C.primary : C.border}`,
              background: selectedCat === cat.id ? C.primary : C.white,
              color: selectedCat === cat.id ? 'white' : '#555',
              cursor: 'pointer'
            }}>
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div style={{ padding: '14px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            No products in this category
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10
          }}>
            {filteredProducts.map(product => (
              <div key={product.id} style={{
                background: C.white, borderRadius: 14,
                padding: '10px', border: `1px solid ${C.border}`,
                position: 'relative'
              }}>
                <div style={{
                  width: '100%', height: 80,
                  background: '#f8f8f8', borderRadius: 10,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 32,
                  marginBottom: 8
                }}>{product.emoji || '📦'}</div>

                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>
                  {product.unit}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 4 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.primary }}>
                  ₹{product.price}
                </div>

                {cart[product.id] ? (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: C.primaryLight, borderRadius: 8, padding: '4px 8px'
                  }}>
                    <button onClick={() => removeFromCart(product.id)} style={{
                      width: 22, height: 22, borderRadius: 6,
                      border: 'none', background: C.primary,
                      color: 'white', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', lineHeight: 1
                    }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.primary, minWidth: 16, textAlign: 'center' }}>
                      {cart[product.id].qty}
                    </span>
                    <button onClick={() => addToCart(product)} style={{
                      width: 22, height: 22, borderRadius: 6,
                      border: 'none', background: C.primary,
                      color: 'white', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', lineHeight: 1
                    }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(product)} style={{
                    position: 'absolute', bottom: 10, right: 10,
                    width: 28, height: 28, borderRadius: 8,
                    border: 'none', background: C.primary,
                    color: 'white', fontSize: 18, fontWeight: 700,
                    cursor: 'pointer', lineHeight: 1
                  }}>+</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px',
          background: 'transparent'
        }}>
          <button onClick={goToCart} style={{
            width: '100%', background: C.primary,
            border: 'none', borderRadius: 14,
            padding: '14px 20px', color: 'white',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: 14, fontWeight: 800,
            cursor: 'pointer'
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 6, padding: '2px 8px', fontSize: 13
            }}>{cartCount} items</span>
            <span>View Cart →</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  )
}