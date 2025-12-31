const express = require('express');
const router = express.Router();
const axios = require('axios');

// Parse CSV text into array of rows
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/); // Handle both \n and \r\n
  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
    return values;
  });
}

// GET /api/google-data/exams - Fetch exams from column 1
router.get('/exams', async (req, res) => {
  try {
    const csvUrl = process.env.GOOGLE_DATA_CSV_URL;
    if (!csvUrl) {
      return res.status(500).json({ error: 'GOOGLE_DATA_CSV_URL not configured' });
    }

    console.log('Fetching exams from:', csvUrl);
    const response = await axios.get(csvUrl);
    const rows = parseCSV(response.data);
    
    console.log('Total rows fetched:', rows.length);
    console.log('Sample rows:', rows.slice(0, 3));
    
    // Extract column 1 (index 0), skip header row
    const exams = rows
      .slice(1) // Skip header
      .map(row => row[0])
      .filter(exam => exam && exam.trim() !== '');
    
    console.log('Exams extracted:', exams.length, exams.slice(0, 5));
    res.json({ exams });
  } catch (error) {
    console.error('Error fetching exams from Google CSV:', error.message);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/google-data/orgs-roles - Fetch organizations (column 2) and roles (column 3)
router.get('/orgs-roles', async (req, res) => {
  try {
    const csvUrl = process.env.GOOGLE_DATA_CSV_URL;
    if (!csvUrl) {
      console.error('GOOGLE_DATA_CSV_URL not configured');
      return res.status(500).json({ error: 'GOOGLE_DATA_CSV_URL not configured' });
    }

    console.log('Fetching orgs/roles from:', csvUrl);
    const response = await axios.get(csvUrl);
    console.log('Response received, status:', response.status);
    console.log('Data length:', response.data?.length);
    
    const rows = parseCSV(response.data);
    
    console.log('Total rows fetched:', rows.length);
    console.log('Sample rows:', rows.slice(0, 3));
    
    // Extract column 2 (index 1) for organizations
    const organizations = rows
      .slice(1) // Skip header
      .map(row => row[1])
      .filter(org => org && org.trim() !== '');
    
    // Extract column 3 (index 2) for roles
    const roles = rows
      .slice(1) // Skip header
      .map(row => row[2])
      .filter(role => role && role.trim() !== '');
    
    console.log('Organizations extracted:', organizations.length, organizations.slice(0, 5));
    console.log('Roles extracted:', roles.length, roles.slice(0, 5));
    
    res.json({ organizations, roles });
  } catch (error) {
    console.error('Error fetching orgs/roles from Google CSV:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch organizations and roles', details: error.message });
  }
});

module.exports = router;
