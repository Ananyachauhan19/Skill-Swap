const JobPosting = require('../models/JobPosting');
const JobApplication = require('../models/JobApplication');
const { supabase } = require('../utils/supabaseClient');

// Admin: Create new job posting
exports.createJobPosting = async (req, res) => {
  try {
    const { jobTitle, jobType, description, shortDescription, requirements, location, department, expiryDate } = req.body;

    if (!jobTitle || !jobType || !description || !shortDescription) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const jobPosting = new JobPosting({
      jobTitle,
      jobType,
      description,
      shortDescription,
      requirements,
      location,
      department,
      expiryDate: expiryDate || null,
      createdBy: req.user._id
    });

    await jobPosting.save();
    res.status(201).json({ message: 'Job posting created successfully', job: jobPosting });
  } catch (error) {
    console.error('Create job posting error:', error);
    res.status(500).json({ message: 'Error creating job posting', error: error.message });
  }
};

// Admin: Get all job postings (including inactive)
exports.getAllJobPostingsAdmin = async (req, res) => {
  try {
    const { status, jobType, search } = req.query;
    const query = {};

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (jobType) query.jobType = jobType;
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await JobPosting.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Get all jobs admin error:', error);
    res.status(500).json({ message: 'Error fetching job postings', error: error.message });
  }
};

// Admin: Update job posting
exports.updateJobPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Salary has been removed from the schema; ignore it if older clients still send it
    if (Object.prototype.hasOwnProperty.call(updateData, 'salary')) {
      delete updateData.salary;
    }

    const job = await JobPosting.findByIdAndUpdate(id, updateData, { new: true });

    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.status(200).json({ message: 'Job posting updated successfully', job });
  } catch (error) {
    console.error('Update job posting error:', error);
    res.status(500).json({ message: 'Error updating job posting', error: error.message });
  }
};

// Admin: Delete job posting
exports.deleteJobPosting = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await JobPosting.findByIdAndDelete(id);

    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    // Optionally delete all applications for this job
    await JobApplication.deleteMany({ jobPosting: id });

    res.status(200).json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('Delete job posting error:', error);
    res.status(500).json({ message: 'Error deleting job posting', error: error.message });
  }
};

// Admin: Toggle job active status
exports.toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await JobPosting.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    job.isActive = !job.isActive;
    await job.save();

    res.status(200).json({ message: `Job posting ${job.isActive ? 'activated' : 'deactivated'} successfully`, job });
  } catch (error) {
    console.error('Toggle job status error:', error);
    res.status(500).json({ message: 'Error toggling job status', error: error.message });
  }
};

// Public: Get all active job postings
exports.getActiveJobPostings = async (req, res) => {
  try {
    const { jobType, search, sortBy } = req.query;
    const query = { isActive: true };

    // Filter by expiry date - only show jobs that haven't expired
    query.$or = [
      { expiryDate: null },
      { expiryDate: { $gte: new Date() } }
    ];

    if (jobType && jobType !== 'all') {
      query.jobType = jobType;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { jobTitle: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { shortDescription: { $regex: search, $options: 'i' } }
        ]
      });
    }

    let sortOptions = { releaseDate: -1 };
    if (sortBy === 'oldest') sortOptions = { releaseDate: 1 };
    if (sortBy === 'title') sortOptions = { jobTitle: 1 };

    const jobs = await JobPosting.find(query).sort(sortOptions);

    res.status(200).json({ jobs });
  } catch (error) {
    console.error('Get active jobs error:', error);
    res.status(500).json({ message: 'Error fetching job postings', error: error.message });
  }
};

// Public: Get single job posting by ID
exports.getJobPostingById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await JobPosting.findById(id);

    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.status(200).json({ job });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'Error fetching job posting', error: error.message });
  }
};

// User: Submit job application
exports.submitJobApplication = async (req, res) => {
  try {
    const applicationData = req.body;

    console.log('📝 New application submission:', {
      jobPosting: applicationData.jobPosting,
      applicantEmail: applicationData.email,
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      hasUser: !!req.user,
      userId: req.user?._id,
      userEmail: req.user?.email
    });

    if (!applicationData.jobPosting || !applicationData.firstName || !applicationData.email || !applicationData.resumeUrl) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if job exists and is active
    const job = await JobPosting.findById(applicationData.jobPosting);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }
    if (!job.isActive) {
      return res.status(400).json({ message: 'This job posting is no longer accepting applications' });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      jobPosting: applicationData.jobPosting,
      email: applicationData.email
    });

    if (existingApplication) {
      console.log('⚠️ Duplicate application attempt:', applicationData.email);
      return res.status(400).json({ message: 'You have already applied for this position' });
    }

    // Add user ID if logged in
    if (req.user) {
      applicationData.user = req.user._id;
      console.log('✅ Linking application to user:', req.user._id);
    }

    const application = new JobApplication(applicationData);
    await application.save();

    console.log('✅ Application saved successfully:', application._id);

    // Increment application count
    job.applicationCount += 1;
    await job.save();

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Submit job application error:', error);
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
};

// Admin: Get all applications for a specific job
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.query;

    const query = { jobPosting: jobId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const applications = await JobApplication.find(query)
      .populate('jobPosting', 'jobTitle jobType')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

// Admin: Get all applications (across all jobs)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, jobType } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    let applications = await JobApplication.find(query)
      .populate('jobPosting', 'jobTitle jobType department')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Filter by job type if provided
    if (jobType && jobType !== 'all') {
      applications = applications.filter(app => app.jobPosting && app.jobPosting.jobType === jobType);
    }

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

// Admin: Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    application.reviewNotes = reviewNotes || application.reviewNotes;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();

    await application.save();

    res.status(200).json({ message: 'Application status updated successfully', application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
};

// Admin: Delete job application
exports.deleteJobApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('🗑️ Deleting application:', {
      id: application._id,
      email: application.email,
      jobPosting: application.jobPosting
    });

    // Decrement application count on the job posting
    if (application.jobPosting) {
      await JobPosting.findByIdAndUpdate(
        application.jobPosting,
        { $inc: { applicationCount: -1 } },
        { new: true }
      );
    }

    // Delete the application
    await JobApplication.findByIdAndDelete(id);

    console.log('✅ Application deleted successfully');

    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: 'Error deleting application', error: error.message });
  }
};

// Admin: Get career statistics
exports.getCareerStats = async (req, res) => {
  try {
    const totalJobs = await JobPosting.countDocuments();
    const activeJobs = await JobPosting.countDocuments({ isActive: true });
    const totalApplications = await JobApplication.countDocuments();
    const pendingApplications = await JobApplication.countDocuments({ status: 'pending' });
    const shortlistedApplications = await JobApplication.countDocuments({ status: 'shortlisted' });

    const jobsByType = await JobPosting.aggregate([
      { $group: { _id: '$jobType', count: { $sum: 1 } } }
    ]);

    const applicationsByStatus = await JobApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        shortlistedApplications
      },
      jobsByType,
      applicationsByStatus
    });
  } catch (error) {
    console.error('Get career stats error:', error);
    res.status(500).json({ message: 'Error fetching career statistics', error: error.message });
  }
};

// User: Get my job applications
exports.getMyApplications = async (req, res) => {
  try {
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('✅ Fetching applications for user:', req.user._id, 'Email:', req.user.email);

    // First, let's check ALL applications in the database
    const allApplications = await JobApplication.find({});
    console.log(`📊 Total applications in database: ${allApplications.length}`);
    allApplications.forEach((app, idx) => {
      console.log(`  App ${idx + 1}:`, {
        id: app._id,
        email: app.email,
        userId: app.user,
        jobPosting: app.jobPosting
      });
    });

    // Find applications by user ID or email
    const applications = await JobApplication.find({
      $or: [
        { user: req.user._id },
        { email: req.user.email }
      ]
    })
      .populate('jobPosting', 'jobTitle jobType location department shortDescription _id')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${applications.length} applications for user ${req.user.email}`);

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Error fetching your applications', error: error.message });
  }
};
