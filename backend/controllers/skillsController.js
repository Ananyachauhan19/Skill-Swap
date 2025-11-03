const fetch = require('node-fetch');
const csv = require('csvtojson');
const SHEET_URL = process.env.GOOGLE_SHEET_CSV_URL;

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
    const topicsBySubject = {};

    rows.forEach(r => {
      const classOrCourse = (r['Class/Course'] || r.course || r.Course || '').trim();
      const subject = (r['Subject'] || r.subject || r.unit || r.Unit || '').trim();
      const topic = (r['Topics'] || r.topics || r.topic || r.Topic || '').trim();

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

      // Map topics under subject
      if (subject && topic) {
        topicsBySubject[subject] = topicsBySubject[subject] || [];
        if (!topicsBySubject[subject].includes(topic)) {
          topicsBySubject[subject].push(topic);
        }
      }
    });

    // Sort lists for consistent UI
    const classes = Array.from(classesSet).sort((a,b) => a.localeCompare(b));
    Object.keys(subjectsByClass).forEach(k => subjectsByClass[k].sort((a,b) => a.localeCompare(b)));
    Object.keys(topicsBySubject).forEach(k => topicsBySubject[k].sort((a,b) => a.localeCompare(b)));

    console.log('[Skills API] ✅ Processed:', classes.length, 'classes/courses');
    console.log('[Skills API] Sample classes:', classes.slice(0, 10).join(', '));
    console.log('[Skills API] Class->Subject mappings:', Object.keys(subjectsByClass).length);
    console.log('[Skills API] Subject->Topic mappings:', Object.keys(topicsBySubject).length);
    
    return res.json({ classes, subjectsByClass, topicsBySubject });
  } catch (err) {
    console.error('[Skills API] ❌ Error:', err.message);
    next(err);
  }
}

module.exports = { getSkillsList };
