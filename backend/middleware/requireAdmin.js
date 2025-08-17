const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required (user object missing from request).' });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const userEmail = (req.user.email || '').toLowerCase();

  // --- START DEBUG LOGS ---
  console.log('--- Admin Middleware Check ---');
  console.log(`User Email: [${userEmail}]`);
  console.log(`Required Admin Email: [${adminEmail}]`);
  console.log(`Match: ${userEmail === adminEmail}`);
  // --- END DEBUG LOGS ---

  if (userEmail !== adminEmail) {
    console.log('Result: Access DENIED.');
    return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
  }

  console.log('Result: Access GRANTED.');
  next();
};

module.exports = requireAdmin;