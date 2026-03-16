// backend/src/routes/vendors.js
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/vendors - list all open vendors
router.get('/', async (req, res) => {
  try {
    const { pincode, area } = req.query;

    let query = supabase
      .from('vendors')
      .select('id, shop_name, area, address, pincode, is_open, rating, total_orders, delivery_fee, min_order_amt, open_time, close_time')
      .eq('is_verified', true)
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (pincode) query = query.eq('pincode', pincode);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ vendors: data });
  } catch (err) {
    console.error('get vendors error:', err);
    res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
});

// GET /api/vendors/:id - single vendor
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_verified', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }

    res.json({ vendor: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor.' });
  }
});

// PATCH /api/vendors/me/toggle-open - vendor opens or closes shop
router.patch('/me/toggle-open', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('is_open')
      .eq('id', req.user.id)
      .single();

    const { data } = await supabase
      .from('vendors')
      .update({ 
        is_open: !vendor.is_open, 
        updated_at: new Date() 
      })
      .eq('id', req.user.id)
      .select('is_open')
      .single();

    res.json({ 
      is_open: data.is_open, 
      message: data.is_open ? 'Your shop is now open 🟢' : 'Your shop is now closed 🔴'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shop status.' });
  }
});

// PATCH /api/vendors/me - update vendor profile
router.patch('/me', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const allowed = ['shop_name', 'address', 'open_time', 'close_time', 'min_order_amt', 'delivery_fee'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    updates.updated_at = new Date();

    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ vendor: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;