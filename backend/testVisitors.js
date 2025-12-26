const mongoose = require('mongoose');
require('dotenv').config();

const Visitor = require('./models/Visitor');

async function testVisitors() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const count = await Visitor.countDocuments();
    console.log(`Total visitors in database: ${count}`);
    
    const visitors = await Visitor.find().limit(5).lean();
    console.log('\nSample visitors:');
    visitors.forEach((v, i) => {
      console.log(`${i + 1}. Device: ${v.device}, Browser: ${v.browser}, OS: ${v.os}, IP: ${v.ipAddress}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVisitors();
