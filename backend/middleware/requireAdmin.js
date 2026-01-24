const requireAdmin = (req, res, next) => {
  if (!req.user) {
    console.log('Admin check failed: No user object in request');
    return res.status(401).json({ message: 'Authentication required (user object missing from request).' });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const userEmail = (req.user.email || '').toLowerCase();

  // --- DEBUG LOGS ---
  console.log('--- Admin Middleware Check ---');
  console.log(`User Email: [${userEmail}]`);
  console.log(`Required Admin Email: [${adminEmail}]`);
  console.log(`Match: ${userEmail === adminEmail}`);
  console.log(`User ID: ${req.user._id}`);
  // --- END DEBUG LOGS ---

  if (userEmail !== adminEmail) {
    console.log('Result: Access DENIED - Not admin user.');
    return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
  }

  console.log('Result: Access GRANTED - Admin verified.');
  next();
};

module.exports = requireAdmin;