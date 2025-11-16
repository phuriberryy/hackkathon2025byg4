#!/usr/bin/env node

/**
 * ShareCycle Backend - Automated Test Runner
 * Runs a series of API tests to validate core functionality
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

  async test(name, method, endpoint, body = null, expectedStatus = 200, shouldHaveToken = false) {
    testResults.total++
    const url = `${this.baseUrl}${endpoint}`
    const options = {
      method,
      headers: { ...this.headers },
    }

    if (shouldHaveToken && tokens.user1) {
      options.headers.Authorization = `Bearer ${tokens.user1}`
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
  console.log(info('\n=== ShareCycle Backend Test Suite ===\n'))

  const runner = new TestRunner(BASE_URL)

  // Test 1: Register User 1
  console.log(info('\n--- Authentication Tests ---'))
  const registerUser1 = await runner.test(
    'Register User 1',
    'POST',
    '/api/auth/register',
    {
      name: 'Test User 1',
      email: `user${Date.now()}@cmu.ac.th`,
      password: 'TestPassword123',
      faculty: 'Engineering',
    },
    201
  )
  if (registerUser1 && registerUser1.user) {
    createdIds.user1 = registerUser1.user.id
  }

  // Test 2: Register User 2
  const registerUser2 = await runner.test(
    'Register User 2',
    'POST',
    '/api/auth/register',
    {
      name: 'Test User 2',
      email: `user${Date.now() + 1}@cmu.ac.th`,
      password: 'TestPassword123',
      faculty: 'Business',
    },
    201
  )
  if (registerUser2 && registerUser2.user) {
    createdIds.user2 = registerUser2.user.id
  }

  // Test 3: Login User 1
  const loginResponse = await runner.test(
    'Login User 1',
    'POST',
    '/api/auth/login',
    {
      email: registerUser1?.user?.email || 'user@cmu.ac.th',
      password: 'TestPassword123',
    },
    200
  )
  if (loginResponse && loginResponse.token) {
    tokens.user1 = loginResponse.token
  }

  // Test 4: Get All Items (Public)
  console.log(info('\n--- Item Tests ---'))
  await runner.test('Get All Items', 'GET', '/api/items', null, 200)

  // Test 5: Create Item
  const createItem = await runner.test(
    'Create Item',
    'POST',
    '/api/items',
    {
      title: 'Test Mountain Bike',
      category: 'sports',
      itemCondition: 'good',
      description: 'Test bike for exchange',
      lookupLocation: 'CMU',
    },
    201,
    true
  )
  if (createItem && createItem.id) {
    createdIds.item = createItem.id
  }

  // Test 6: Get Item By ID
  if (createdIds.item) {
    await runner.test(
      'Get Item By ID',
      'GET',
      `/api/items/${createdIds.item}`,
      null,
      200
    )
  }

  // Test 7: Create Exchange Request
  console.log(info('\n--- Exchange Tests ---'))
  if (createdIds.item) {
    const exchangeRequest = await runner.test(
      'Create Exchange Request',
      'POST',
      '/api/exchange',
      {
        itemId: createdIds.item,
        message: 'I am interested in this item',
        requesterItemName: 'Skateboard',
        requesterItemCategory: 'sports',
        requesterItemCondition: 'good',
      },
      201,
      true
    )
    if (exchangeRequest && exchangeRequest.id) {
      createdIds.exchangeRequest = exchangeRequest.id
    }
  }

  // Test 8: Get My Exchange Requests
  await runner.test(
    'Get My Exchange Requests',
    'GET',
    '/api/exchange/my-requests',
    null,
    200,
    true
  )

  // Test 9: Create Chat
  console.log(info('\n--- Chat Tests ---'))
  if (createdIds.item && createdIds.user2) {
    const createChat = await runner.test(
      'Create Chat',
      'POST',
      '/api/chats',
      {
        participantId: createdIds.user2,
        itemId: createdIds.item,
      },
      201,
      true
    )
    if (createChat && createChat.id) {
      createdIds.chat = createChat.id
    }
  }

  // Test 10: Get All Chats
  await runner.test('Get All Chats', 'GET', '/api/chats', null, 200, true)

  // Test 11: Error - Unauthorized Access
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

  // Test 12: Invalid Email Format
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

  // Test 13: Short Password
  await runner.test(
    'Register with Short Password',
    'POST',
    '/api/auth/register',
    {
      name: 'Test',
      email: `user${Date.now() + 2}@cmu.ac.th`,
      password: '123',
    },
    400
  )

  // Print summary
  runner.printSummary()

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error(fail('Test suite error:'), error)
  process.exit(1)
})
