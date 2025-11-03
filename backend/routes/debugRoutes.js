const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const csv = require('csvtojson');

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

module.exports = router;
