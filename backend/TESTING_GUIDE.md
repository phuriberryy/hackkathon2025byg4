# ShareCycle Backend - Testing Guide

## Overview

This document provides comprehensive guidance on testing the ShareCycle backend API. The test suite covers authentication, item management, exchange requests, chat functionality, and error handling.

## Quick Start

### 1. Ensure Backend is Running
```powershell
npm run start
```
Backend should be listening on `http://localhost:4000`

### 2. Test Database Connection
```powershell
npm run db:test
```
or
```powershell
node scripts/test-db-connection.js
```

### 3. Test Email Configuration
```powershell
npm run test:email
```
or
```powershell
node scripts/test-email.js
```

## Testing Methods

### Method 1: Using Postman (Recommended for Manual Testing)

1. **Import Collection**
   - Open Postman
   - Click `Import` → `Upload Files`
   - Select `ShareCycle_Complete_API.postman_collection.json`

2. **Set Environment Variables**
   - After import, click on collection → `Variables`
   - Update variables:
     - `base_url`: http://localhost:4000
     - `jwt_token`: (will be filled after login)
     - `item_id`, `user_id`, etc.: (fill as you create resources)

3. **Run Requests**
   - Start with authentication requests (Register/Login)
   - Copy JWT token from response
   - Paste into `jwt_token` variable
   - Use in Authorization headers for protected routes

### Method 2: Using cURL (Command Line)

**Register User:**
```powershell
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@cmu.ac.th",
    "password": "password123",
    "faculty": "Engineering"
  }'
```

**Login:**
```powershell
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@cmu.ac.th",
    "password": "password123"
  }'
```

**Get Items (with Token):**
```powershell
curl -X GET http://localhost:4000/api/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Method 3: Using Automated Test Runner

```powershell
# Install dependencies (if not already done)
npm install

# Run automated test suite (unit + api)
node scripts/run-tests.js
```

This will:
- Create test users
- Test registration and login
- Create items
- Test item operations
- Create exchange requests
- Test exchange flow
- Create chats
- Test error handling
- Generate test report

## Test Case Categories

### 1. Authentication Tests (TC-AUTH-001 to TC-AUTH-011)

**Key Flows:**
- Register with valid data
- Register with invalid email/password
- Detect duplicate emails
- Login with correct credentials
- Login with wrong password
- Forgot password workflow
- Reset password with token

**Running:**
```powershell
# Manual: Use Postman collection → Authentication folder
# Automated: node scripts/run-tests.js
```

### 2. Item Management Tests (TC-ITEM-001 to TC-ITEM-014)

**Key Flows:**
- Get all items (public)
- Get item details
- Create item (authenticated)
- Update item (owner only)
- Delete item (owner only)
- Get user's items
- List exchange requests on item

**Important Notes:**
- Public endpoints don't require authentication
- Creation/update/delete require valid JWT token
- Must be item owner to modify/delete

### 3. Exchange Request Tests (TC-EXCHANGE-001 to TC-EXCHANGE-010)

**Key Flows:**
- Create exchange request on item
- Cannot exchange own item
- Owner accepts/rejects requests
- Requester accepts final exchange
- Status transitions: pending → accepted-by-owner → accepted → completed

### 4. Chat & Real-Time Tests (TC-CHAT-001 to TC-CHAT-009)

**Key Features:**
- Create chat with participant (by ID or email)
- Get all chats for user
- Get messages in chat
- Accept/decline chat invitation
- Confirm exchange with QR code
- Real-time message updates via WebSocket

**Note:** Some features require WebSocket connection:
- Real-time messages
- Typing indicators
- Online status

### 5. Error Handling Tests (TC-ERROR-001 to TC-ERROR-005)

**Coverage:**
- Invalid JWT tokens
- Expired tokens
- Missing authorization
- Database connection errors
- Invalid input validation

## Database State Management

### Reset Database

To start with a fresh database:

```powershell
# 1. Stop the server
# Ctrl+C

# 2. Run migrations (creates schema)
npm run db:migrate

# 3. Restart server
npm run start
```

### Seed Test Data

Create test data quickly:
```powershell
node scripts/setup-db.js
```

This creates:
- Test users
- Sample items
- Sample exchange requests

## Test Data Reference

### Sample User Data
```json
{
  "name": "John Doe",
  "email": "john.doe@cmu.ac.th",
  "password": "password123",
  "faculty": "Engineering"
}
```

### Sample Item Data
```json
{
  "title": "Mountain Bike",
  "category": "sports",
  "itemCondition": "good",
  "lookingFor": "skateboard",
  "description": "Barely used",
  "availableUntil": "2025-12-31T23:59:59Z",
  "imageUrl": "https://example.com/bike.jpg",
  "pickupLocation": "CMU Campus"
}
```

### Sample Exchange Request Data
```json
{
  "itemId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Interested in your bike!",
  "requesterItemName": "Skateboard",
  "requesterItemCategory": "sports",
  "requesterItemCondition": "like-new"
}
```

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not authorized for resource) |
| 404 | Not Found |
| 409 | Conflict (duplicate email, etc.) |
| 500 | Server Error |

## Common Issues & Solutions

### Issue: "Unauthorized" on protected routes
**Solution:** 
- Verify JWT token is valid and not expired
- Include token in Authorization header: `Bearer {token}`
- Re-login to get new token

### Issue: "Database connection failed"
**Solution:**
```powershell
# Check database is running
npm run test:db

# Verify DATABASE_URL in .env
Get-Content .env | Select-String -Pattern "DATABASE_URL"

# If remote DB, check network connectivity
```

### Issue: Email tests fail with "Invalid login"
**Solution:**
```powershell
# Verify SMTP settings
npm run test:email

# Update .env with correct credentials
# For Gmail: use App Password (not regular password)
# For Office365: verify credentials and 2FA
```

### Issue: CORS errors on frontend
**Solution:**
- Verify `CLIENT_ORIGIN` in `.env` matches frontend URL
- Example: `CLIENT_ORIGIN=http://localhost:3000`
- Restart server after changing

## Performance Testing

### Load Testing with Artillery

1. Install Artillery:
```powershell
npm install -g artillery
```

2. Create test scenario:
```powershell
artillery quick --count 100 --num 50 http://localhost:4000/api/items
```

This sends 50 requests from 100 concurrent users.

## Continuous Integration Testing

### GitHub Actions Example
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:api
```

## Next Steps

1. **Start Backend**: `npm run start`
2. **Import Postman Collection**: Get from `ShareCycle_Complete_API.postman_collection.json`
3. **Register Test User**: Use `/api/auth/register`
4. **Login**: Use `/api/auth/login` and copy token
5. **Run API Requests**: Start with GET endpoints, then POST/PUT
6. **Run Full Test Suite**: `node scripts/run-tests.js`
7. **Review Results**: Check console output for pass/fail summary

## Support

For issues or questions about testing:
1. Check this guide
2. Review `test_cases.md` for detailed scenarios
3. Check server logs: `npm run start`
4. Verify `.env` configuration
5. Test database: `npm run db:test`
