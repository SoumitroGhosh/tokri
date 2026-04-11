// backend/src/routes/orders.js
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/orders - customer places order
router.post('/', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const { vendor_id, items, delivery_address, payment_method = 'cod', customer_note } = req.body;

    if (!vendor_id || !items?.length || !delivery_address) {
      return res.status(400).json({ 
        error: 'vendor_id, items and delivery_address are required.' 
      });
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, is_open, min_order_amt, delivery_fee')
      .eq('id', vendor_id)
      .single();

    if (!vendor?.is_open) {
      return res.status(400).json({ error: 'This store is currently closed.' });
    }

    const productIds = items.map(i => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, unit, price, is_in_stock')
      .in('id', productIds)
      .eq('vendor_id', vendor_id)
      .eq('is_active', true);

    if (products.length !== productIds.length) {
      return res.status(400).json({ 
        error: 'Some products are no longer available.' 
      });
    }

    const outOfStock = products.filter(p => !p.is_in_stock);
    if (outOfStock.length > 0) {
      return res.status(400).json({
        error: `Out of stock: ${outOfStock.map(p => p.name).join(', ')}`
      });
    }

    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: product.name,
        product_unit: product.unit,
        qty: item.qty,
        unit_price: product.price,
        total_price: product.price * item.qty
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.total_price, 0);
    const deliveryFee = vendor.delivery_fee * 100;
    const totalAmt = subtotal + deliveryFee;

    if (subtotal < vendor.min_order_amt * 100) {
      return res.status(400).json({
        error: `Minimum order is ₹${vendor.min_order_amt}. Your order is ₹${subtotal / 100}.`
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: req.user.id,
        vendor_id,
        status: 'pending',
        payment_method,
        subtotal,
        delivery_fee: deliveryFee,
        total_amt: totalAmt,
        delivery_address,
        customer_note
      })
      .select()
      .single();

    if (orderError) throw orderError;

    await supabase
      .from('order_items')
      .insert(orderItems.map(i => ({ ...i, order_id: order.id })));

    res.status(201).json({
      success: true,
      order: {
        ...order,
        subtotal: order.subtotal / 100,
        delivery_fee: order.delivery_fee / 100,
        total_amt: order.total_amt / 100
      },
      message: 'Order placed successfully!'
    });

  } catch (err) {
    console.error('place order error:', err);
    res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
});

// GET /api/orders/my - customer order history
router.get('/my', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, payment_method, total_amt,
        created_at, accepted_at, delivered_at,
        vendors(shop_name, area),
        order_items(product_name, product_unit, qty, unit_price, total_price)
      `)
      .eq('customer_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const orders = data.map(o => ({
      ...o,
      total_amt: o.total_amt / 100
    }));

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/vendor - vendor incoming orders
router.get('/vendor', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        id, order_number, status, payment_method, total_amt,
        delivery_address, customer_note, created_at,
        users(name, phone),
        order_items(product_name, product_unit, qty, unit_price)
      `)
      .eq('vendor_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json({
      orders: data.map(o => ({
        ...o,
        total_amt: o.total_amt / 100
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// PATCH /api/orders/:id/accept - vendor accepts order
router.patch('/:id/accept', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('id, vendor_id, status')
      .eq('id', req.params.id)
      .single();

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (order.vendor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your order.' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot accept a ${order.status} order.` 
      });
    }

    const { data } = await supabase
      .from('orders')
      .update({ status: 'confirmed', accepted_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    res.json({ success: true, order: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept order.' });
  }
});

// PATCH /api/orders/:id/reject - vendor rejects order
router.patch('/:id/reject', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { reason } = req.body;

    const { data: order } = await supabase
      .from('orders')
      .select('vendor_id, status')
      .eq('id', req.params.id)
      .single();

    if (order.vendor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your order.' });
    }

    await supabase
      .from('orders')
      .update({
        status: 'rejected',
        reject_reason: reason || 'Vendor unavailable',
        cancelled_at: new Date()
      })
      .eq('id', req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject order.' });
  }
});

// PATCH /api/orders/:id/status - update delivery status
router.patch('/:id/status', authenticate, requireRole('vendor'), async (req, res) => {
  try {
    const { status } = req.body;

    const validTransitions = {
      confirmed: 'packing',
      packing: 'out_for_delivery',
      out_for_delivery: 'delivered'
    };

    const { data: order } = await supabase
      .from('orders')
      .select('vendor_id, status')
      .eq('id', req.params.id)
      .single();

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (order.vendor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your order.' });
    }
    if (!validTransitions[order.status] || validTransitions[order.status] !== status) {
      return res.status(400).json({ error: 'Invalid status transition.' });
    }

    await supabase
      .from('orders')
      .update({ status, delivered_at: status === 'delivered' ? new Date() : null })
      .eq('id', req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;