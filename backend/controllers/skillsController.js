const fetch = require('node-fetch');
const csv = require('csvtojson');
const SHEET_URL = process.env.GOOGLE_SHEET_CSV_URL;
const DEGREE_SHEET_URL = process.env.GOOGLE_DEGREE_CSV_URL;

async function getSkillsList(req, res, next) {
  try {
    console.log('[Skills API] Fetching from Google Sheet...');
    if (!SHEET_URL) {
      console.error('[Skills API] ❌ GOOGLE_SHEET_CSV_URL not configured in .env');
      return res.status(400).json({ message: 'Google sheet CSV URL not configured' });
    }
    
    console.log('[Skills API] Sheet URL:', SHEET_URL);
    const resp = await fetch(SHEET_URL);
    if (!resp.ok) throw new Error('Failed fetching sheet');
    const text = await resp.text();
    console.log('[Skills API] Downloaded CSV, size:', text.length, 'bytes');
    
    const rows = await csv({ trim: true }).fromString(text);
    console.log('[Skills API] Parsed', rows.length, 'rows from CSV');
    
    // Log first row to see column names
    if (rows.length > 0) {
      console.log('[Skills API] Column names detected:', Object.keys(rows[0]));
      console.log('[Skills API] First row sample:', rows[0]);
    }

    const classesSet = new Set();
    const subjectsByClass = {};
    const topicsByClassAndSubject = {}; // Changed: now nested by class first, then subject

    rows.forEach(r => {
      const classOrCourse = (r['Class/Course'] || r.course || r.Course || '').trim();
      const subject = (r['Subject'] || r.subject || r.unit || r.Unit || '').trim();
      const topicsString = (r['Topics'] || r.topics || r.topic || r.Topic || '').trim();

      // Add to classes set 
      if (classOrCourse) {
        classesSet.add(classOrCourse);
      }

      if (classOrCourse && subject) {
        subjectsByClass[classOrCourse] = subjectsByClass[classOrCourse] || [];
        if (!subjectsByClass[classOrCourse].includes(subject)) {
          subjectsByClass[classOrCourse].push(subject);
        }
      }

      // Parse comma-separated topics from the Topics column
      // FIXED: Store topics by class AND subject to avoid mixing different classes
      if (classOrCourse && subject && topicsString) {
        // Initialize nested structure: class -> subject -> topics array
        topicsByClassAndSubject[classOrCourse] = topicsByClassAndSubject[classOrCourse] || {};
        topicsByClassAndSubject[classOrCourse][subject] = topicsByClassAndSubject[classOrCourse][subject] || [];
        
        // Split topics by comma, trim whitespace, and filter empty values
        const topicsArray = topicsString
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        
        // Add each individual topic to the specific class-subject combination
        topicsArray.forEach(topic => {
          if (!topicsByClassAndSubject[classOrCourse][subject].includes(topic)) {
            topicsByClassAndSubject[classOrCourse][subject].push(topic);
          }
        });
      }
    });

    // Sort lists for consistent UI
    const classes = Array.from(classesSet).sort((a,b) => a.localeCompare(b));
    Object.keys(subjectsByClass).forEach(k => subjectsByClass[k].sort((a,b) => a.localeCompare(b)));
    
    // Sort topics within each class-subject combination
    Object.keys(topicsByClassAndSubject).forEach(classKey => {
      Object.keys(topicsByClassAndSubject[classKey]).forEach(subjectKey => {
        topicsByClassAndSubject[classKey][subjectKey].sort((a,b) => a.localeCompare(b));
      });
    });

    console.log('[Skills API] ✅ Processed:', classes.length, 'classes/courses');
    console.log('[Skills API] Sample classes:', classes.slice(0, 10).join(', '));
    console.log('[Skills API] Class->Subject mappings:', Object.keys(subjectsByClass).length);
    console.log('[Skills API] Class->Subject->Topic mappings:', Object.keys(topicsByClassAndSubject).length);

    // Optionally load degree options from a separate Google Sheet
    let degrees = [];
    if (DEGREE_SHEET_URL) {
      try {
        console.log('[Skills API] Fetching degrees from Google Sheet...');
        console.log('[Skills API] Degree sheet URL:', DEGREE_SHEET_URL);
        const resp2 = await fetch(DEGREE_SHEET_URL);
        if (!resp2.ok) throw new Error('Failed fetching degree sheet');
        const text2 = await resp2.text();
        console.log('[Skills API] Downloaded degree CSV, size:', text2.length, 'bytes');

        const rows2 = await csv({ trim: true }).fromString(text2);
        console.log('[Skills API] Parsed', rows2.length, 'rows from degree CSV');

        const degreeSet = new Set();
        rows2.forEach(r => {
          const vals = Object.values(r || {});
          const fallback = (vals[0] || '').toString().trim();
          const name = (
            r.Degree ||
            r.degree ||
            r['Degree Name'] ||
            r['degree_name'] ||
            fallback
          ).toString().trim();
          if (name) {
            degreeSet.add(name);
          }
        });
        degrees = Array.from(degreeSet).sort((a, b) => a.localeCompare(b));
        console.log('[Skills API] ✅ Degrees processed:', degrees.length);
      } catch (degErr) {
        console.error('[Skills API] ❌ Error loading degrees sheet:', degErr.message);
      }
    }

    return res.json({ classes, subjectsByClass, topicsByClassAndSubject, degrees });
  } catch (err) {
    console.error('[Skills API] ❌ Error:', err.message);
    next(err);
  }
}

module.exports = { getSkillsList };
