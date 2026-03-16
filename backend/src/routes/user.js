// backend/src/routes/user.js
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/user/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('id, name, phone, email, address, pincode, coins_balance, created_at')
      .eq('id', req.user.id)
      .single();

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PATCH /api/user/profile
router.patch('/profile', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'address', 'pincode'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    updates.updated_at = new Date();

    const { data } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;