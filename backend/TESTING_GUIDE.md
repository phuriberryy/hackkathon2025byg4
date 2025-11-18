# ShareCycle Backend - TESTING_GUIDE.md

## Overview
This guide provides step-by-step instructions for testing the ShareCycle backend API.  
It covers manual testing, automated tests, error handling, and best practices.

---

## 1. Quick Start

### 1.1 Ensure Backend is Running
```powershell
npm run start
```
Backend should be accessible at `http://localhost:4000`

### 1.2 Test Database Connection
```powershell
npm run db:test
```
or
```powershell
node scripts/test-db-connection.js
```

### 1.3 Test Email Configuration
```powershell
npm run test:email
```
or
```powershell
node scripts/test-email.js
```

---

## 2. Testing Methods

### 2.1 Postman (Manual Testing)
1. Import collection: `ShareCycle_Complete_API.postman_collection.json`
2. Set environment variables: `base_url`, `jwt_token`, `item_id`, `user_id`, etc.
3. Execute requests in order: authentication → items → exchange → chats → error handling
4. Copy JWT token after login and set in Authorization header

### 2.2 cURL (Command Line)

**Register User:**
```powershell
curl -X POST http://localhost:4000/api/auth/register   -H "Content-Type: application/json"   -d '{
    "name": "John Doe",
    "email": "john.doe@cmu.ac.th",
    "password": "password123",
    "faculty": "Engineering"
  }'
```

**Login User:**
```powershell
curl -X POST http://localhost:4000/api/auth/login   -H "Content-Type: application/json"   -d '{
    "email": "john.doe@cmu.ac.th",
    "password": "password123"
  }'
```

**Get Items (Authenticated):**
```powershell
curl -X GET http://localhost:4000/api/items   -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2.3 Automated Test Runner
```powershell
# Install dependencies
npm install

# Run full test suite
node scripts/run-tests.js
```

- Automatically tests registration, login, item CRUD, exchange requests, chats, and error handling.
- Produces pass/fail summary in console.

---

## 3. Test Case Categories

### 3.1 Authentication
- Valid registration/login
- Invalid email/password
- Duplicate emails
- Forgot/reset password flows

### 3.2 Item Management
- Get all items (public)
- Get item by ID
- Create, update, delete (owner only)
- List user’s items and related exchange requests

### 3.3 Exchange Requests
- Create request (cannot exchange own item)
- Accept/reject request (owner)
- Accept final exchange (requester)
- Status transitions: pending → accepted-by-owner → accepted → completed

### 3.4 Chat & Real-Time
- Create chat, get chat list
- Fetch messages, accept/decline invitations
- Real-time message updates (WebSocket)
- Typing indicators, online status

### 3.5 Error Handling
- Invalid/expired JWT token
- Unauthorized access
- Database connection issues
- Input validation failures

---

## 4. Database State Management

### 4.1 Reset Database
```powershell
npm run db:migrate
npm run start
```

### 4.2 Seed Test Data
```powershell
node scripts/setup-db.js
```
- Creates test users, items, exchange requests

---

## 5. Sample Test Data

**User:**
```json
{
  "name": "John Doe",
  "email": "john.doe@cmu.ac.th",
  "password": "password123",
  "faculty": "Engineering"
}
```

**Item:**
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

**Exchange Request:**
```json
{
  "itemId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Interested in your bike!",
  "requesterItemName": "Skateboard",
  "requesterItemCategory": "sports",
  "requesterItemCondition": "like-new"
}
```

---

## 6. HTTP Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET/PUT) |
| 201 | Created (POST) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## 7. Common Issues & Solutions

**Unauthorized Error:**
- Check JWT token in Authorization header
- Ensure token is valid/not expired

**Database Connection Failed:**
- Check database is running
- Verify `DATABASE_URL` in `.env`

**Email Sending Failed:**
- Check SMTP credentials
- Use Gmail App Password if needed

**CORS Errors:**
- Verify `CLIENT_ORIGIN` in `.env`
- Restart server

---

## 8. Performance & Load Testing

**Artillery Load Test:**
```powershell
npm install -g artillery
artillery quick --count 100 --num 50 http://localhost:4000/api/items
```

---

## 9. CI Integration (GitHub Actions)

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
      - run: node scripts/run-tests.js
```

---

## 10. Next Steps
1. Start backend: `npm run start`
2. Import Postman collection
3. Register test users
4. Login and retrieve JWT tokens
5. Test endpoints manually or via automated suite
6. Review console results for pass/fail summary

---

## 11. Support
- Check this guide first
- Review `TEST_CASES.md` for detailed scenarios
- Inspect server logs: `npm run start`
- Verify `.env` configuration
