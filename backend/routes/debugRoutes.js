const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const csv = require('csvtojson');
const User = require('../models/User');

// Debug endpoint to see raw sheet data
router.get('/debug/sheet-columns', async (req, res) => {
  try {
    const SHEET_URL = process.env.GOOGLE_SHEET_CSV_URL;
    if (!SHEET_URL) {
      return res.status(400).json({ error: 'GOOGLE_SHEET_CSV_URL not configured' });
    }

    const resp = await fetch(SHEET_URL);
    if (!resp.ok) throw new Error('Failed fetching sheet');
    const text = await resp.text();
    const rows = await csv({ trim: true }).fromString(text);

    const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
    const sampleRows = rows.slice(0, 5);

    res.json({
      message: 'Sheet structure',
      totalRows: rows.length,
      columnNames,
      sampleRows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY DEBUG ROUTE - Check if email exists
router.get('/check-email/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const user = await User.findOne({ email }).select('-password -otp -otpExpires');
    
    if (user) {
      res.json({
        exists: true,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          // Campus ambassador profile is now stored in CampusAmbassador collection;
          // this legacy field is no longer present on User.
          createdAt: user.createdAt
        }
      });
    } else {
      res.json({ exists: false, message: 'Email not found in database' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEMPORARY DEBUG ROUTE - Delete user by email (use with caution!)
router.delete('/delete-user/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const result = await User.deleteOne({ email });
    
    if (result.deletedCount > 0) {
      res.json({ 
        success: true, 
        message: `User with email ${email} deleted successfully` 
      });
    } else {
      res.json({ 
        success: false, 
        message: `No user found with email ${email}` 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
