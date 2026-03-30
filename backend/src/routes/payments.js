// backend/src/routes/payments.js
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('KEY CHECK:', {
  key_id_length: process.env.RAZORPAY_KEY_ID?.length,
  secret_length: process.env.RAZORPAY_KEY_SECRET?.length,
});

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { order_id, amount } = req.body;

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `tok_${order_id.substring(0, 35)}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order_id);

    res.json({
      success: true,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error('create-order error:', err);
    res.status(500).json({ error: 'Failed to create payment order.' });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature.' });
    }

    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
        status: 'confirmed'
      })
      .eq('id', order_id);

    res.json({ success: true, message: 'Payment verified successfully!' });

  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

module.exports = router;