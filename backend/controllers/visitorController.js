const Visitor = require('../models/Visitor');
const crypto = require('crypto');

// Helper function to generate unique visitor ID
const generateVisitorId = (ip, userAgent) => {
  const hash = crypto.createHash('sha256');
  hash.update(ip + userAgent + Date.now().toString());
  return hash.digest('hex');
};

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
};

// Track new visitor or update existing
exports.trackVisitor = async (req, res) => {
  try {
    console.log('[VisitorController] trackVisitor called with body:', req.body);
    
    const {
      visitorId,
      device,
      browser,
      browserVersion,
      os,
      location,
      screenResolution,
      language,
      referrer,
      currentPage,
      consentGiven,
      analytics,
      enhanced,
    } = req.body;

    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const isEnhanced = enhanced === true;
    const hashSalt =
      process.env.IP_HASH_SALT ||
      process.env.VISITOR_IP_SALT ||
      'change-this-salt-in-production';
    
    console.log('[VisitorController] Extracted data:', { device, browser, os, hasIp: Boolean(ipAddress), isEnhanced });

    let visitor;
    let newVisitorId = visitorId;

    // Check if visitor exists
    console.log("[TRACK] saving visitor", {
      visitorId,
      analytics,
      enhanced
    });
    if (visitorId) {
      visitor = await Visitor.findOne({ visitorId });
    }

    // If visitor exists, update visit info
    if (visitor) {
      console.log('[VisitorController] Existing visitor found, updating...');
      await visitor.recordVisit();
      // Do not persist raw IPs for new updates. Use a
      // salted hash only when enhanced analytics are on.
      if (isEnhanced && ipAddress) {
        const hash = crypto.createHash('sha256');
        hash.update(ipAddress + hashSalt);
        visitor.ipHash = hash.digest('hex');
      }
      visitor.userAgent = userAgent;
      // Keep device/browser/OS info fresh for analytics.
      if (device) visitor.device = device;
      if (browser) visitor.browser = browser;
      if (browserVersion) visitor.browserVersion = browserVersion;
      if (os) visitor.os = os;
      if (location) visitor.location = location;
      if (screenResolution) visitor.screenResolution = screenResolution;
      if (language) visitor.language = language;
      if (referrer) visitor.referrer = referrer;
      if (currentPage) visitor.currentPage = currentPage;
      if (typeof consentGiven === 'boolean') {
        visitor.consentGiven = consentGiven;
      }
      if (typeof isEnhanced === 'boolean') {
        visitor.consentEnhanced = isEnhanced;
      }
      visitor.lastVisit = new Date();
      visitor.updatedAt = new Date();
      await visitor.save();
      console.log('[VisitorController] Visitor updated successfully');
    } else {
      // Create new visitor record. If the frontend already
      // generated a stable visitorId (stored in localStorage),
      // reuse that so we can reliably de-duplicate visits for
      // the same browser. Only fall back to a server-generated
      // ID when none was provided.
      newVisitorId = visitorId || generateVisitorId(ipAddress, userAgent);
      console.log('[VisitorController] Creating new visitor with ID:', newVisitorId);

      let ipHash;
      if (isEnhanced && ipAddress) {
        const hash = crypto.createHash('sha256');
        hash.update(ipAddress + hashSalt);
        ipHash = hash.digest('hex');
      }

      visitor = new Visitor({
        visitorId: newVisitorId,
        // Raw IP is intentionally not persisted; only
        // a salted hash is stored when enhanced is on.
        ipHash,
        device,
        browser,
        browserVersion,
        os,
        location,
        screenResolution,
        language,
        referrer,
        currentPage,
        userAgent,
        consentGiven,
        consentEnhanced: isEnhanced,
        consentDate: new Date(),
      });

      await visitor.save();
      console.log('[VisitorController] New visitor saved successfully');
    }

    console.log("[TRACK] saved visitor", visitor);
    console.log('[VisitorController] Sending response with visitorId:', newVisitorId);
    
    res.json({
      success: true,
      visitorId: newVisitorId,
      message: 'Visitor tracked successfully',
    });
  } catch (error) {
    console.error('[VisitorController] trackVisitor error:', error);
    console.error('[VisitorController] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to track visitor',
      error: error.message,
    });
  }
};

// Get visitor statistics for admin dashboard
exports.getVisitorStats = async (req, res) => {
  try {
    console.log('[VisitorController] getVisitorStats called with query:', req.query);
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }
    console.log('[VisitorController] Date filter:', JSON.stringify(dateFilter, null, 2));

    const [
      totalVisitors,
      todayVisitors,
      weekVisitors,
      monthVisitors,
      uniqueVisitors,
      returningVisitors,
      deviceStats,
      browserStats,
      topCountries,
    ] = await Promise.all([
      // Total visitors within date range
      Visitor.countDocuments(dateFilter),
      
      // Today's visitors (always shows today, not affected by date filter)
      Visitor.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      
      // This week's visitors  
      Visitor.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
      
      // This month's visitors
      Visitor.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      
      // Unique visitors (first-time) within date range
      Visitor.countDocuments({
        ...dateFilter,
        visitCount: 1,
      }),
      
      // Returning visitors within date range
      Visitor.countDocuments({
        ...dateFilter,
        visitCount: { $gt: 1 },
      }),
      
      // Device statistics
      Visitor.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // Browser statistics
      Visitor.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      
      // Top countries
      Visitor.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    console.log('[VisitorController] Stats fetched:', {
      totalVisitors,
      todayVisitors,
      weekVisitors,
      uniqueVisitors,
      returningVisitors,
      deviceStatsCount: deviceStats.length,
      browserStatsCount: browserStats.length,
      topCountriesCount: topCountries.length,
    });

    const response = {
      success: true,
      totalVisitors,
      todayVisitors,
      weekVisitors,
      uniqueVisitors,
      returningVisitors,
      deviceStats,
      browserStats,
      topCountries,
    };
    
    console.log('[VisitorController] Sending response:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('[VisitorController] getVisitorStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor stats',
    });
  }
};

// Get all visitors with pagination
exports.getAllVisitors = async (req, res) => {
  try {
    console.log('[VisitorController] getAllVisitors called with query:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || '-createdAt';
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }
    console.log('[VisitorController] Date filter:', dateFilter);

    const [visitors, total] = await Promise.all([
      Visitor.find(dateFilter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        // Never expose raw IPs to the admin UI. Historical
        // documents may still have ipAddress populated, but
        // it is excluded at query time.
        .select('-sessions -userAgent -ipAddress')
        .lean(),
      Visitor.countDocuments(dateFilter),
    ]);

    console.log('[VisitorController] Visitors fetched:', {
      count: visitors.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

    res.json({
      success: true,
      visitors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[VisitorController] getAllVisitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitors',
    });
  }
};

// Get visitor analytics by date range
exports.getVisitorAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default to last 30 days
      start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get daily visitor counts
    const dailyVisitors = await Visitor.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          unique: { $addToSet: '$visitorId' },
        },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          uniqueCount: { $size: '$unique' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        dateRange: { start, end },
        dailyVisitors,
      },
    });
  } catch (error) {
    console.error('[VisitorController] getVisitorAnalytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor analytics',
    });
  }
};

// Delete old visitor data (GDPR compliance - optional)
exports.deleteOldVisitors = async (req, res) => {
  try {
    const { days = 365 } = req.query;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Visitor.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old visitor records`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('[VisitorController] deleteOldVisitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old visitors',
    });
  }
};
