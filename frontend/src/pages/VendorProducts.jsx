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

export default function VendorProducts({ user }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', price: '', unit: '',
    category_id: '', emoji: '📦', description: ''
  })

  const token = localStorage.getItem('tokri_token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const userRes = await axios.get(`${API}/auth/me`, { headers })
      const vendorId = userRes.data.user.id

      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/products?vendor_id=${vendorId}`, { headers }),
        axios.get(`${API}/products/categories`, { headers })
      ])
      setProducts(productsRes.data.products)
      setCategories(categoriesRes.data.categories)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveProduct() {
    if (!form.name || !form.price || !form.unit) {
      alert('Name, price and unit are required')
      return
    }
    setSaving(true)
    try {
      await axios.post(`${API}/products`, {
        name: form.name,
        price: parseFloat(form.price),
        unit: form.unit,
        category_id: form.category_id || null,
        emoji: form.emoji || '📦',
        description: form.description
      }, { headers })

      setForm({ name: '', price: '', unit: '', category_id: '', emoji: '📦', description: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStock(productId, currentStatus) {
    try {
      await axios.patch(`${API}/products/${productId}`,
        { is_in_stock: !currentStatus }, { headers })
      fetchData()
    } catch (err) {
      console.error('Failed to toggle stock:', err)
    }
  }

  async function deleteProduct(productId) {
    if (!confirm('Delete this product?')) return
    try {
      await axios.delete(`${API}/products/${productId}`, { headers })
      fetchData()
    } catch (err) {
      console.error('Failed to delete product:', err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: C.primary, padding: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/vendor')} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none',
              borderRadius: 8, padding: '6px 10px',
              color: 'white', fontSize: 16
            }}>←</button>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
              My Products
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 8, padding: '8px 14px',
            color: 'white', fontSize: 13, fontWeight: 700
          }}>
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Add Product Form */}
        {showForm && (
          <div style={{
            background: C.white, borderRadius: 16,
            padding: '16px', marginBottom: 16,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>
              Add New Product
            </div>

            {[
              { label: 'Product Name *', key: 'name', placeholder: 'e.g. Toor Dal' },
              { label: 'Price (₹) *', key: 'price', placeholder: 'e.g. 89', type: 'number' },
              { label: 'Unit *', key: 'unit', placeholder: 'e.g. 1 kg, 500 g, 1 L' },
              { label: 'Emoji', key: 'emoji', placeholder: 'e.g. 🫘' },
              { label: 'Description', key: 'description', placeholder: 'Optional description' }
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                  {field.label}
                </div>
                <input
                  value={form[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  type={field.type || 'text'}
                  style={{
                    width: '100%', border: `1.5px solid ${C.border}`,
                    borderRadius: 8, padding: '10px 12px',
                    fontSize: 13, color: C.text
                  }}
                />
              </div>
            ))}

            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 }}>
                Category
              </div>
              <select
                value={form.category_id}
                onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                style={{
                  width: '100%', border: `1.5px solid ${C.border}`,
                  borderRadius: 8, padding: '10px 12px',
                  fontSize: 13, color: C.text, background: C.white
                }}>
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={saveProduct} disabled={saving} style={{
              width: '100%', background: C.primary,
              border: 'none', borderRadius: 10,
              padding: '12px', color: 'white',
              fontSize: 14, fontWeight: 800,
              opacity: saving ? 0.6 : 1
            }}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
            <div style={{ color: C.muted, marginBottom: 8 }}>No products yet</div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Tap + Add to add your first product
            </div>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} style={{
              background: C.white, borderRadius: 12,
              padding: '12px 14px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: product.is_in_stock ? 1 : 0.6,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 28 }}>{product.emoji || '📦'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {product.unit} · ₹{product.price}
                </div>
              </div>

              {/* Stock toggle */}
              <button
                onClick={() => toggleStock(product.id, product.is_in_stock)}
                style={{
                  padding: '4px 10px', borderRadius: 20,
                  border: 'none', fontSize: 11, fontWeight: 700,
                  background: product.is_in_stock ? C.greenBg || '#DCFCE7' : '#FEE2E2',
                  color: product.is_in_stock ? C.green : '#EF4444'
                }}>
                {product.is_in_stock ? 'In Stock' : 'Out'}
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteProduct(product.id)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 16, cursor: 'pointer', color: C.muted
                }}>🗑️</button>
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
              color: item.path === '/vendor/products' ? C.primary : C.muted,
              padding: '4px 0',
              fontWeight: item.path === '/vendor/products' ? 700 : 400
            }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}