const fetch = require('node-fetch');
const csv = require('csvtojson');

// Fetch Google Sheet as CSV and parse it
async function fetchGoogleData(req, res) {
  try {
    const csvUrl = process.env.GOOGLE_DATA_CSV_URL;
    if (!csvUrl) {
      return res.status(500).json({ message: 'GOOGLE_DATA_CSV_URL not configured' });
    }

    // Convert Google Sheets edit URL to export URL if needed
    let exportUrl = csvUrl;
    if (csvUrl.includes('/edit')) {
      exportUrl = csvUrl.replace('/edit?usp=sharing', '/export?format=csv');
    }

    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch CSV data');
    }

    const csvText = await response.text();
    const jsonArray = await csv({ noheader: false, output: 'json' }).fromString(csvText);

    // Parse columns: Assuming first row has headers
    // Column 1 = Exams, Column 2 = Organizations, Column 3 = Roles
    const exams = [];
    const organizations = [];
    const roles = [];

    jsonArray.forEach(row => {
      const values = Object.values(row);
      if (values[0] && values[0].trim()) exams.push(values[0].trim());
      if (values[1] && values[1].trim()) organizations.push(values[1].trim());
      if (values[2] && values[2].trim()) roles.push(values[2].trim());
    });

    return res.json({
      exams: [...new Set(exams)].filter(Boolean), // Remove duplicates and empty
      organizations: [...new Set(organizations)].filter(Boolean),
      roles: [...new Set(roles)].filter(Boolean)
    });
  } catch (error) {
    console.error('Error fetching Google Data CSV:', error);
    return res.status(500).json({ message: 'Failed to fetch data', error: error.message });
  }
}

module.exports = { fetchGoogleData };
