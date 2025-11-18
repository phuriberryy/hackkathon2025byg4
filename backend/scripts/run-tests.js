#!/usr/bin/env node

/**
 * ShareCycle Backend - Automated Test Runner
 * Runs a series of API tests to validate core functionality using real user/item data
 * 
 * Usage: node scripts/run-tests.js
 */

import fetch from 'node-fetch'
import chalk from 'chalk'

const BASE_URL = process.env.API_URL || 'http://localhost:4000'
let testResults = { passed: 0, failed: 0, total: 0 }
let tokens = {}
let createdIds = {}

// Color output helpers
const pass = chalk.green
const fail = chalk.red
const info = chalk.blue
const warn = chalk.yellow

class TestRunner {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.headers = {
      'Content-Type': 'application/json',
    }
  }

  async test(name, method, endpoint, body = null, expectedStatus = 200, tokenKey = null) {
    testResults.total++
    const url = `${this.baseUrl}${endpoint}`
    const options = {
      method,
      headers: { ...this.headers },
    }

    // Support multiple user tokens
    if (tokenKey && tokens[tokenKey]) {
      options.headers.Authorization = `Bearer ${tokens[tokenKey]}`
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)
      const data = await response.json()

      if (response.status === expectedStatus) {
        console.log(pass(`✓ ${name}`))
        testResults.passed++
        return data
      } else {
        console.log(fail(`✗ ${name} - Expected ${expectedStatus}, got ${response.status}`))
        console.log(fail(`  Response: ${JSON.stringify(data)}`))
        testResults.failed++
        return null
      }
    } catch (error) {
      console.log(fail(`✗ ${name} - ${error.message}`))
      testResults.failed++
      return null
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50))
    console.log('TEST SUMMARY')
    console.log('='.repeat(50))
    console.log(info(`Total: ${testResults.total}`))
    console.log(pass(`Passed: ${testResults.passed}`))
    console.log(fail(`Failed: ${testResults.failed}`))
    console.log(
      info(
        `Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`
      )
    )
  }
}

async function runTests() {
  console.log(info('\n=== ShareCycle Backend Test Suite (Using Real Data) ===\n'))

  const runner = new TestRunner(BASE_URL)

  // Test 1: Register User 1 (Seller)
  console.log(info('\n--- Authentication Tests ---'))
  const timestamp = Date.now()
  const registerUser1 = await runner.test(
    'Register User 1 (Seller)',
    'POST',
    '/api/auth/register',
    {
      name: `Seller ${timestamp}`,
      email: `seller${timestamp}@cmu.ac.th`,
      password: 'TestPassword123',
      faculty: 'Engineering',
    },
    201
  )
  if (registerUser1 && registerUser1.user) {
    createdIds.user1 = registerUser1.user.id
    createdIds.user1Email = registerUser1.user.email
  }

  // Test 2: Register User 2 (Buyer/Requester)
  const registerUser2 = await runner.test(
    'Register User 2 (Buyer)',
    'POST',
    '/api/auth/register',
    {
      name: `Buyer ${timestamp}`,
      email: `buyer${timestamp}@cmu.ac.th`,
      password: 'TestPassword123',
      faculty: 'Business',
    },
    201
  )
  if (registerUser2 && registerUser2.user) {
    createdIds.user2 = registerUser2.user.id
    createdIds.user2Email = registerUser2.user.email
  }

  // Test 3: Login User 1 (Seller)
  const loginUser1 = await runner.test(
    'Login User 1 (Seller)',
    'POST',
    '/api/auth/login',
    {
      email: createdIds.user1Email,
      password: 'TestPassword123',
    },
    200
  )
  if (loginUser1 && loginUser1.token) {
    tokens.user1 = loginUser1.token
  }

  // Test 4: Login User 2 (Buyer)
  const loginUser2 = await runner.test(
    'Login User 2 (Buyer)',
    'POST',
    '/api/auth/login',
    {
      email: createdIds.user2Email,
      password: 'TestPassword123',
    },
    200
  )
  if (loginUser2 && loginUser2.token) {
    tokens.user2 = loginUser2.token
  }

  // Test 5: Get All Items (Public)
  console.log(info('\n--- Item Tests ---'))
  const allItems = await runner.test('Get All Items', 'GET', '/api/items', null, 200)

  console.log(info("\n--- Item Tests ---"));

await runner.test("Get All Items", "GET", "/api/items", null, 200);

// Create Item (User 1)
const createItem = await runner.test(
  "Create Item",
  "POST",
  "/api/items",
  {
    title: "Test Mountain Bike",
    category: "Sports Gear",
    itemCondition: "Good",
    description: "Test bike for exchange",
    pickupLocation: "CMU",
    lookingFor: "Any sports equipment",
  },
  201,
  "user1"   // ← FIXED
);

if (!createItem || !createItem.id) {
  console.log(fail("Item creation failed — Cannot continue tests"));
  runner.printSummary();
  process.exit(1);
}

createdIds.item = createItem.id;

// Get Item by ID
await runner.test(
  "Get Item by ID",
  "GET",
  `/api/items/${createdIds.item}`,
  null,
  200
);


  // Test 9: Create Exchange Request with Real Item Data
  console.log(info('\n--- Exchange Tests (Using Real Items) ---'))
  if (createdIds.itemUser1 && createdIds.itemUser2) {
    const exchangeRequest = await runner.test(
      'Create Exchange Request (User 2 requesting User 1 item)',
      'POST',
      '/api/exchange',
      {
        itemId: createdIds.itemUser1,
        message: 'I have a skateboard and would like to exchange it for your bike',
        requesterItemName: itemData2.title,
        requesterItemCategory: itemData2.category,
        requesterItemCondition: itemData2.itemCondition,
        requesterItemDescription: itemData2.description,
        requesterPickupLocation: itemData2.pickupLocation,
      },
      201,
      'user2'
    )
    if (exchangeRequest && exchangeRequest.id) {
      createdIds.exchangeRequest = exchangeRequest.id
      console.log(info(`  Exchange Request ID: ${exchangeRequest.id}`))
    }
  }

  // Test 10: Get My Exchange Requests (User 1 - should see as receiver)
  await runner.test(
    'Get Exchange Requests (User 1 as Receiver)',
    'GET',
    '/api/exchange/my-requests',
    null,
    200,
    'user1'
  )

  // Test 11: Create Chat (User 1 initiates chat with User 2 about the exchange)
  console.log(info('\n--- Chat Tests (Using Real Users/Items) ---'))
  if (createdIds.itemUser1 && createdIds.user2 && createdIds.exchangeRequest) {
    const createChat = await runner.test(
      'Create Chat (between User 1 & 2)',
      'POST',
      '/api/chats',
      {
        participantId: createdIds.user2,
        itemId: createdIds.itemUser1,
        exchangeRequestId: createdIds.exchangeRequest,
      },
      201,
      'user1'
    )
    if (createChat && createChat.id) {
      createdIds.chat = createChat.id
      console.log(info(`  Chat ID: ${createChat.id}`))
    }
  }

  // Test 12: Get All Chats (User 1)
  await runner.test(
    'Get All Chats (User 1)',
    'GET',
    '/api/chats',
    null,
    200,
    'user1'
  )

  // Test 13: Get All Chats (User 2)
  await runner.test(
    'Get All Chats (User 2)',
    'GET',
    '/api/chats',
    null,
    200,
    'user2'
  )

  // Test 14: Error - Unauthorized Access
  console.log(info('\n--- Error Handling Tests ---'))
  await runner.test(
    'Get Protected Endpoint Without Token',
    'POST',
    '/api/items',
    {
      title: 'Should Fail',
      category: 'sports',
      itemCondition: 'good',
    },
    401
  )

  // Test 15: Invalid Email Format
  await runner.test(
    'Register with Invalid Email',
    'POST',
    '/api/auth/register',
    {
      name: 'Test',
      email: 'invalid-email',
      password: 'password123',
    },
    400
  )

  // Test 16: Short Password
  await runner.test(
    'Register with Short Password',
    'POST',
    '/api/auth/register',
    {
      name: 'Test',
      email: `user${Date.now() + 999}@cmu.ac.th`,
      password: '123',
    },
    400
  )

  // Print summary with created IDs
  console.log(info('\n--- Test Data Created ---'))
  console.log(info(`User 1 (Seller) ID: ${createdIds.user1}`))
  console.log(info(`User 2 (Buyer) ID: ${createdIds.user2}`))
  console.log(info(`Item 1 (by User 1) ID: ${createdIds.itemUser1}`))
  console.log(info(`Item 2 (by User 2) ID: ${createdIds.itemUser2}`))
  console.log(info(`Exchange Request ID: ${createdIds.exchangeRequest}`))
  console.log(info(`Chat ID: ${createdIds.chat}`))

  runner.printSummary()

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error(fail('Test suite error:'), error)
  process.exit(1)
})
