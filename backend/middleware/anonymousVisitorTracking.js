const AnonymousVisitor = require('../models/AnonymousVisitor');
const crypto = require('crypto');

// Generate a unique visitor ID
function generateVisitorId() {
  return `v_${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;
}

// Parse device info from user agent
function parseDeviceInfo(userAgent) {
  const ua = userAgent || '';
  let platform = 'Unknown';
  let browser = 'Unknown';

  // Simple platform detection
  if (/Windows/.test(ua)) platform = 'Windows';
  else if (/Mac OS/.test(ua)) platform = 'MacOS';
  else if (/Android/.test(ua)) platform = 'Android';
  else if (/iPhone|iPad/.test(ua)) platform = 'iOS';
  else if (/Linux/.test(ua)) platform = 'Linux';

  // Simple browser detection
  if (/Chrome/.test(ua) && !/Edge/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edge/.test(ua)) browser = 'Edge';
  else if (/MSIE|Trident/.test(ua)) browser = 'IE';

  return { userAgent: ua, platform, browser };
}

// Determine traffic source from referrer
function determineSource(referrer) {
  if (!referrer) return 'direct';
  try {
    const refHost = new URL(referrer).hostname;
    if (/google/.test(refHost)) return 'organic_google';
    if (/bing|yahoo|duckduckgo/.test(refHost)) return 'organic_search';
    if (/facebook|twitter|linkedin|instagram/.test(refHost)) return 'social';
    return 'referral';
  } catch {
    return 'referral';
  }
}

async function anonymousVisitorTracking(req, res, next) {
  try {
    // Only track non-authenticated visitors
    if (req.user) {
      return next();
    }

    // Focus on GET requests for meaningful page views
    if (req.method !== 'GET') {
      return next();
    }

    // Skip API endpoints and static assets
    const path = req.originalUrl || req.url || '/';
    if (path.startsWith('/api/') || /\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/i.test(path)) {
      return next();
    }

    // Get or generate visitor ID
    let visitorId = req.cookies?.visitor_id;
    const isNewVisitor = !visitorId;
    
    if (!visitorId) {
      visitorId = generateVisitorId();
      res.cookie('visitor_id', visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });
    }

    // Extract device and source info
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceInfo = parseDeviceInfo(userAgent);
    const referrer = req.get('referer') || req.get('referrer') || null;
    const source = determineSource(referrer);
    
    const ipHeader = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(ipHeader)
      ? ipHeader[0]
      : (ipHeader || req.ip || req.connection?.remoteAddress || '').split(',')[0].trim();

    const now = new Date();

    // Get timeSpent from query param (sent by frontend tracking)
    const timeSpent = parseInt(req.query.timeSpent, 10) || 0;

    // Update or create visitor record
    if (isNewVisitor) {
      await AnonymousVisitor.create({
        visitorId,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        pageViews: [{ path, timestamp: now, timeSpent }],
        totalTimeSpent: timeSpent,
        deviceInfo,
        ipAddress,
        referrer,
        source,
      });
    } else {
      await AnonymousVisitor.findOneAndUpdate(
        { visitorId },
        {
          $set: {
            lastSeenAt: now,
            deviceInfo, // update in case device changes
            ipAddress,
          },
          $inc: {
            visitCount: 1,
            totalTimeSpent: timeSpent,
          },
          $push: {
            pageViews: {
              $each: [{ path, timestamp: now, timeSpent }],
              $slice: -100, // Keep last 100 page views per visitor
            },
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('[AnonymousVisitorTracking] Non-fatal error:', err && err.message ? err.message : err);
  }

  return next();
}

module.exports = anonymousVisitorTracking;
