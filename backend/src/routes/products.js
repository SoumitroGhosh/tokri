// backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/products?vendor_id=xxx
router.get('/', async (req, res) => {
  try {
    const { vendor_id, category_id } = req.query;

    if (!vendor_id) {
      return res.status(400).json({ error: 'vendor_id is required' });
    }

    let query = supabase
      .from('products')
      .select('*, categories(name, emoji)')
      .eq('vendor_id', vendor_id)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (category_id) query = query.eq('category_id', category_id);

    const { data, error } = await query;
    if (error) throw error;

    const products = data.map(p => ({
      ...p,
      price: p.price / 100,
      mrp: p.mrp ? p.mrp / 100 : null
    }));

    res.json({ products });
  } catch (err) {
    console.error('get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    res.json({ categories: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// POST /api/products - vendor adds a product
router.post('/', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { name, price, unit, category_id, emoji, description, stock_qty, mrp } = req.body;

    if (!name || !price || !unit) {
      return res.status(400).json({ 
        error: 'name, price and unit are required.' 
      });
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        vendor_id: req.user.id,
        name,
        price: Math.round(price * 100),
        mrp: mrp ? Math.round(mrp * 100) : null,
        unit,
        category_id: category_id || null,
        emoji: emoji || '📦',
        description,
        stock_qty: stock_qty || 100,
        is_in_stock: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ 
      product: { ...data, price: data.price / 100 } 
    });
  } catch (err) {
    console.error('add product error:', err);
    res.status(500).json({ error: 'Failed to add product.' });
  }
});

// PATCH /api/products/:id - vendor updates product
router.patch('/:id', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', req.params.id)
      .single();

    if (!existing || existing.vendor_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only edit your own products.' 
      });
    }

    const allowed = ['name', 'unit', 'category_id', 'emoji', 
                     'description', 'is_in_stock', 'stock_qty', 
                     'sort_order', 'is_active'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    if (req.body.price) updates.price = Math.round(req.body.price * 100);
    updates.updated_at = new Date();

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ product: { ...data, price: data.price / 100 } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id - soft delete
router.delete('/:id', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('vendor_id', req.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;