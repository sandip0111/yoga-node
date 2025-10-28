/**
 * Test script for Meta Conversions API implementation
 * Run this script to test the Meta Conversions API integration
 */

// Load environment variables
require('dotenv').config();

const metaConversionsService = require('./services/metaConversionsService');
const paymentTrackingService = require('./services/paymentTrackingService');

// Test data
const testPurchaseData = {
  transactionId: 'test_transaction_123',
  paymentId: 'test_payment_123',
  amount: 99.99,
  currency: 'USD',
  clientIp: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  fbc: 'fb.1.1234567890.1234567890',
  fbp: 'fb.1.1234567890.1234567890'
};

const testUserData = {
  email: 'test@example.com',
  phoneNumber: '1234567890',
  firstName: 'Test User',
  name: 'Test User'
};

const testCourseData = {
  courseId: 'test_course_123',
  courseName: 'Test Yoga Course',
  courseType: 'yoga_course'
};

async function testMetaConversionsAPI() {
  console.log('🧪 Testing Meta Conversions API Implementation...\n');

  // Test 1: Validate configuration
  console.log('1. Testing configuration validation...');
  const isValidConfig = metaConversionsService.validateConfig();
  console.log(`   Configuration valid: ${isValidConfig ? '✅' : '❌'}\n`);

  // Test 2: Test purchase event tracking
  console.log('2. Testing purchase event tracking...');
  try {
    const result = await metaConversionsService.trackPurchase(
      testPurchaseData,
      testUserData,
      testCourseData
    );
    console.log('   Purchase event tracking: ✅');
    console.log(`   Result: ${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.log('   Purchase event tracking: ❌');
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Test custom event tracking
  console.log('3. Testing custom event tracking...');
  try {
    const customEventData = {
      eventId: 'custom_test_123',
      customData: {
        event_type: 'test_event',
        test_value: 100
      }
    };
    
    const result = await metaConversionsService.trackCustomEvent(
      'TestEvent',
      customEventData,
      testUserData
    );
    console.log('   Custom event tracking: ✅');
    console.log(`   Result: ${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    console.log('   Custom event tracking: ❌');
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 4: Test payment tracking service
  console.log('4. Testing payment tracking service...');
  try {
    await paymentTrackingService.trackRazorpayPurchase(testPurchaseData, testUserData);
    console.log('   Razorpay purchase tracking: ✅\n');
  } catch (error) {
    console.log('   Razorpay purchase tracking: ❌');
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 5: Test different course types
  console.log('5. Testing different course types...');
  const courseTypes = [
    { name: 'Pranic Purification', type: 'pranayama_course' },
    { name: '200 TTC', type: 'teacher_training' },
    { name: 'Rishikesh Course', type: 'rishikesh_course' },
    { name: 'Live Classes', type: 'live_yoga_classes' }
  ];

  for (const course of courseTypes) {
    try {
      const courseData = {
        courseId: `test_${course.type}`,
        courseName: course.name,
        courseType: course.type
      };
      
      await metaConversionsService.trackPurchase(
        testPurchaseData,
        testUserData,
        courseData
      );
      console.log(`   ${course.name} tracking: ✅`);
    } catch (error) {
      console.log(`   ${course.name} tracking: ❌`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n🎉 Meta Conversions API testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Add environment variables to your .env file');
  console.log('2. Test with real payment flows');
  console.log('3. Monitor Events Manager for tracked events');
  console.log('4. Remove test_event_code when ready for production');
}

// Run the test
testMetaConversionsAPI().catch(console.error);
