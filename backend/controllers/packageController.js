const Package = require('../models/Package');

// Get all active packages (public endpoint)
exports.getActivePackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching active packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
};

// Get all packages (admin only)
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching all packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
};

// Get single package by ID
exports.getPackageById = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id).select('-__v');
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      data: package
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package',
      error: error.message
    });
  }
};

// Create new package (admin only)
exports.createPackage = async (req, res) => {
  try {
    const { name, description, type, silverCoins, bronzeCoins, silverCoinPrice, bronzeCoinPrice, displayOrder } = req.body;

    // Validation
    if (!name || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and type are required'
      });
    }

    // Validate coin counts based on type
    if (type === 'ONLY_SILVER' && (!silverCoins || silverCoins <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'ONLY_SILVER packages must have silver coins'
      });
    }

    if (type === 'ONLY_BRONZE' && (!bronzeCoins || bronzeCoins <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'ONLY_BRONZE packages must have bronze coins'
      });
    }

    if (type === 'COMBO' && (!silverCoins || silverCoins <= 0 || !bronzeCoins || bronzeCoins <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'COMBO packages must have both silver and bronze coins'
      });
    }

    const newPackage = new Package({
      name,
      description,
      type,
      silverCoins: silverCoins || 0,
      bronzeCoins: bronzeCoins || 0,
      silverCoinPrice: silverCoinPrice || 0.25,
      bronzeCoinPrice: bronzeCoinPrice || 0.5,
      displayOrder: displayOrder || 0
    });

    await newPackage.save();

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: newPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
};

// Update package (admin only)
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, silverCoins, bronzeCoins, silverCoinPrice, bronzeCoinPrice, displayOrder, isActive } = req.body;

    const package = await Package.findById(id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Update fields if provided
    if (name) package.name = name;
    if (description) package.description = description;
    if (type) package.type = type;
    if (silverCoins !== undefined) package.silverCoins = silverCoins;
    if (bronzeCoins !== undefined) package.bronzeCoins = bronzeCoins;
    if (silverCoinPrice !== undefined) package.silverCoinPrice = silverCoinPrice;
    if (bronzeCoinPrice !== undefined) package.bronzeCoinPrice = bronzeCoinPrice;
    if (displayOrder !== undefined) package.displayOrder = displayOrder;
    if (isActive !== undefined) package.isActive = isActive;

    await package.save();

    res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: package
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update package',
      error: error.message
    });
  }
};

// Deactivate package (admin only)
exports.deactivatePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const package = await Package.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package deactivated successfully',
      data: package
    });
  } catch (error) {
    console.error('Error deactivating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate package',
      error: error.message
    });
  }
};

// Delete package (admin only)
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const package = await Package.findByIdAndDelete(id);

    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete package',
      error: error.message
    });
  }
};
