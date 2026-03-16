// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(phone, otp) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    return;
  }
  const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  await twilio.messages.create({
    body: `Your Tokri OTP is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE,
    to: phone
  });
}

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, role = 'customer' } = req.body;

    if (!phone || !/^\+91[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number. Use format: +917XXXXXXXXX'
      });
    }

    if (role === 'vendor') {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, is_active')
        .eq('phone', phone)
        .single();

      if (!vendor) {
        return res.status(404).json({
          error: 'No vendor account found for this number.'
        });
      }
    }

    await supabase
      .from('otp_codes')
      .delete()
      .eq('phone', phone)
      .eq('is_used', false);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabase.from('otp_codes').insert({
      phone,
      code: otp,
      purpose: role === 'vendor' ? 'vendor_login' : 'login',
      expires_at: expiresAt.toISOString()
    });

    await sendOTP(phone, otp);

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, role = 'customer', name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required.' });
    }

    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', otp)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP.' });
    }

    await supabase
      .from('otp_codes')
      .update({ is_used: true })
      .eq('id', otpRecord.id);

    let userData, tokenPayload;

    if (role === 'vendor') {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('phone', phone)
        .single();

      tokenPayload = { id: vendor.id, phone, role: 'vendor' };
      userData = vendor;
    } else {
      let { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (!user) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({ phone, name: name || null, role: 'customer' })
          .select()
          .single();
        user = newUser;
      }

      tokenPayload = { id: user.id, phone, role: 'customer' };
      userData = user;
    }

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      token,
      user: userData,
      isNewUser: role === 'customer' && !userData.name
    });

  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const { id, role } = req.user;
    const table = role === 'vendor' ? 'vendors' : 'users';

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: data, role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

module.exports = router;