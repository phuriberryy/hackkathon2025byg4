# ShareCycle Backend - Test Cases

## 1. Authentication (Auth Routes)

### TC-AUTH-001: User Registration - Success
**Endpoint:** `POST /api/auth/register`
**Precondition:** None
**Test Data:**
```json
{
  "name": "John Doe",
  "email": "john.doe@cmu.ac.th",
  "password": "password123",
  "faculty": "Engineering"
}
```
**Expected Result:** 
- Status 200/201
- Response includes user ID, email, name, jwt token
- User created in database

**Postcondition:** User account exists and can login

---

### TC-AUTH-002: User Registration - Invalid Email
**Endpoint:** `POST /api/auth/register`
**Test Data:**
```json
{
  "name": "John Doe",
  "email": "invalid-email",
  "password": "password123"
}
```
**Expected Result:** 
- Status 400
- Error message: "Valid email required"

---

### TC-AUTH-003: User Registration - Short Password
**Endpoint:** `POST /api/auth/register`
**Test Data:**
```json
{
  "name": "John Doe",
  "email": "john@cmu.ac.th",
  "password": "123"
}
```
**Expected Result:** 
- Status 400
- Error message about password length (min 6)

---

### TC-AUTH-004: User Registration - Duplicate Email
**Endpoint:** `POST /api/auth/register`
**Precondition:** User with email john@cmu.ac.th already exists
**Test Data:**
```json
{
  "name": "Jane Doe",
  "email": "john@cmu.ac.th",
  "password": "password123"
}
```
**Expected Result:** 
- Status 409/400
- Error message: "Email already exists"

---

### TC-AUTH-005: User Login - Success
**Endpoint:** `POST /api/auth/login`
**Precondition:** User john@cmu.ac.th with password password123 exists
**Test Data:**
```json
{
  "email": "john@cmu.ac.th",
  "password": "password123"
}
```
**Expected Result:** 
- Status 200
- Response includes JWT token
- Token can be used for authenticated requests

---

### TC-AUTH-006: User Login - Wrong Password
**Endpoint:** `POST /api/auth/login`
**Test Data:**
```json
{
  "email": "john@cmu.ac.th",
  "password": "wrongpassword"
}
```
**Expected Result:** 
- Status 401
- Error message: "Invalid credentials"

---

### TC-AUTH-007: User Login - Non-existent Email
**Endpoint:** `POST /api/auth/login`
**Test Data:**
```json
{
  "email": "nonexistent@cmu.ac.th",
  "password": "password123"
}
```
**Expected Result:** 
- Status 401
- Error message: "Invalid credentials"

---

### TC-AUTH-008: Forgot Password - Valid Email
**Endpoint:** `POST /api/auth/forgot-password`
**Precondition:** User john@cmu.ac.th exists
**Test Data:**
```json
{
  "email": "john@cmu.ac.th"
}
```
**Expected Result:** 
- Status 200
- Message: "Password reset email sent"
- Reset token sent to email

---

### TC-AUTH-009: Forgot Password - Non-existent Email
**Endpoint:** `POST /api/auth/forgot-password`
**Test Data:**
```json
{
  "email": "nonexistent@cmu.ac.th"
}
```
**Expected Result:** 
- Status 200 (for security, should not reveal if email exists)
- Message: "Password reset email sent" (even if email doesn't exist)

---

### TC-AUTH-010: Reset Password - Valid Token
**Endpoint:** `POST /api/auth/reset-password`
**Precondition:** User requested password reset, valid token exists
**Test Data:**
```json
{
  "token": "valid_reset_token_here",
  "password": "newpassword123"
}
```
**Expected Result:** 
- Status 200
- Message: "Password reset successful"
- User can login with new password

---

### TC-AUTH-011: Reset Password - Invalid Token
**Endpoint:** `POST /api/auth/reset-password`
**Test Data:**
```json
{
  "token": "invalid_or_expired_token",
  "password": "newpassword123"
}
```
**Expected Result:** 
- Status 400/401
- Error message: "Invalid or expired token"

---

## 2. Items Management (Item Routes)

### TC-ITEM-001: Get All Items - No Authentication
**Endpoint:** `GET /api/items`
**Precondition:** Items exist in database
**Expected Result:** 
- Status 200
- Array of items with public fields (id, title, category, condition, imageUrl, owner info)

---

### TC-ITEM-002: Get Item By ID - Success
**Endpoint:** `GET /api/items/{itemId}`
**Precondition:** Item with ID exists
**Test URL:** `/api/items/550e8400-e29b-41d4-a716-446655440000`
**Expected Result:** 
- Status 200
- Item details including owner, images, exchange requests count

---

### TC-ITEM-003: Get Item By ID - Invalid UUID
**Endpoint:** `GET /api/items/{itemId}`
**Test URL:** `/api/items/invalid-uuid`
**Expected Result:** 
- Status 400
- Error message about invalid UUID format

---

### TC-ITEM-004: Get Item By ID - Not Found
**Endpoint:** `GET /api/items/{itemId}`
**Test URL:** `/api/items/99999999-9999-9999-9999-999999999999`
**Expected Result:** 
- Status 404
- Error message: "Item not found"

---

### TC-ITEM-005: Create Item - Success (Authenticated)
**Endpoint:** `POST /api/items`
**Precondition:** User authenticated with valid JWT token
**Headers:** `Authorization: Bearer {jwt_token}`
**Test Data:**
```json
{
  "title": "Mountain Bike",
  "category": "sports",
  "itemCondition": "good",
  "lookingFor": "skateboard",
  "description": "Barely used mountain bike",
  "availableUntil": "2025-12-31T23:59:59Z",
  "imageUrl": "https://example.com/bike.jpg",
  "pickupLocation": "CMU Campus"
}
```
**Expected Result:** 
- Status 201
- Response includes item ID, created timestamp, owner ID
- Item is active and visible in public list

---

### TC-ITEM-006: Create Item - Missing Required Field
**Endpoint:** `POST /api/items`
**Precondition:** User authenticated
**Test Data:**
```json
{
  "category": "sports",
  "itemCondition": "good"
}
```
**Expected Result:** 
- Status 400
- Error message: "Title is required" or validation error

---

### TC-ITEM-007: Create Item - Unauthenticated
**Endpoint:** `POST /api/items`
**Test Data:** (valid item data)
**Headers:** None (no JWT token)
**Expected Result:** 
- Status 401
- Error message: "Unauthorized"

---

### TC-ITEM-008: Update Item - Success
**Endpoint:** `PUT /api/items/{itemId}`
**Precondition:** User owns the item and is authenticated
**Test Data:**
```json
{
  "title": "Mountain Bike - Updated",
  "description": "Rarely used mountain bike"
}
```
**Expected Result:** 
- Status 200
- Item updated with new values
- Old values remain for non-updated fields

---

### TC-ITEM-009: Update Item - Unauthorized (Not Owner)
**Endpoint:** `PUT /api/items/{itemId}`
**Precondition:** Authenticated user does NOT own the item
**Expected Result:** 
- Status 403
- Error message: "Unauthorized to update this item"

---

### TC-ITEM-010: Update Item - Change Status to Exchanged
**Endpoint:** `PUT /api/items/{itemId}`
**Test Data:**
```json
{
  "status": "exchanged"
}
```
**Expected Result:** 
- Status 200
- Item status changed to "exchanged"
- Item should not appear in active items list

---

### TC-ITEM-011: Delete Item - Success
**Endpoint:** `DELETE /api/items/{itemId}`
**Precondition:** User owns the item
**Expected Result:** 
- Status 200/204
- Item deleted from database
- Item no longer appears in public list

---

### TC-ITEM-012: Delete Item - Unauthorized
**Endpoint:** `DELETE /api/items/{itemId}`
**Precondition:** User does NOT own the item
**Expected Result:** 
- Status 403
- Error message: "Unauthorized to delete this item"

---

### TC-ITEM-013: Get User's Items
**Endpoint:** `GET /api/items/user/{userId}`
**Precondition:** User is authenticated, userId is valid
**Expected Result:** 
- Status 200
- Array of items belonging to user
- All items visible (active and inactive)

---

### TC-ITEM-014: Get Item Exchange Requests
**Endpoint:** `GET /api/items/{itemId}/exchange-requests`
**Precondition:** User owns the item, item has exchange requests
**Expected Result:** 
- Status 200
- Array of exchange requests for the item
- Request details: requester, items offered, status

---

## 3. Exchange Management (Exchange Routes)

### TC-EXCHANGE-001: Create Exchange Request - Success
**Endpoint:** `POST /api/exchange`
**Precondition:** User authenticated, item exists
**Test Data:**
```json
{
  "itemId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "I'm interested in your bike!",
  "requesterItemName": "Skateboard",
  "requesterItemCategory": "sports",
  "requesterItemCondition": "like-new",
  "requesterItemDescription": "Brand new skateboard",
  "requesterItemImageUrl": "https://example.com/skateboard.jpg",
  "requesterPickupLocation": "CMU Campus"
}
```
**Expected Result:** 
- Status 201
- Response includes request ID, status "pending"
- Notification sent to item owner

---

### TC-EXCHANGE-002: Create Exchange Request - Item Not Found
**Endpoint:** `POST /api/exchange`
**Test Data:**
```json
{
  "itemId": "99999999-9999-9999-9999-999999999999",
  "message": "I'm interested!"
}
```
**Expected Result:** 
- Status 404
- Error message: "Item not found"

---

### TC-EXCHANGE-003: Create Exchange Request - Cannot Exchange Own Item
**Endpoint:** `POST /api/exchange`
**Precondition:** Requester is the item owner
**Test Data:** (valid but requester owns the item)
**Expected Result:** 
- Status 400
- Error message: "Cannot create exchange request for your own item"

---

### TC-EXCHANGE-004: Get User's Exchange Requests
**Endpoint:** `GET /api/exchange/my-requests`
**Precondition:** User authenticated, has exchange requests
**Expected Result:** 
- Status 200
- Array of requests where user is requester or owner
- Includes pending, accepted, rejected requests

---

### TC-EXCHANGE-005: Get Exchange Request Details
**Endpoint:** `GET /api/exchange/{requestId}`
**Precondition:** Request exists, user involved in exchange
**Expected Result:** 
- Status 200
- Request details: items, messages, timeline, status

---

### TC-EXCHANGE-006: Accept Exchange Request by Owner
**Endpoint:** `POST /api/exchange/{requestId}/accept-owner`
**Precondition:** User is item owner, request is pending
**Expected Result:** 
- Status 200
- Request status changed to "accepted-by-owner"
- Notification sent to requester
- Chat created between parties

---

### TC-EXCHANGE-007: Accept Exchange Request by Owner - Not Owner
**Endpoint:** `POST /api/exchange/{requestId}/accept-owner`
**Precondition:** User is NOT the item owner
**Expected Result:** 
- Status 403
- Error message: "Only item owner can accept"

---

### TC-EXCHANGE-008: Accept Exchange Request by Requester
**Endpoint:** `POST /api/exchange/{requestId}/accept-requester`
**Precondition:** User is requester, owner already accepted
**Expected Result:** 
- Status 200
- Request status changed to "accepted"
- Both parties notified
- Exchange marked as active/in-progress

---

### TC-EXCHANGE-009: Reject Exchange Request
**Endpoint:** `POST /api/exchange/{requestId}/reject`
**Precondition:** User is involved in exchange, request is pending
**Expected Result:** 
- Status 200
- Request status changed to "rejected"
- Other party notified

---

### TC-EXCHANGE-010: Get Item Exchange Requests (from Items route)
**Endpoint:** `GET /api/items/{itemId}/exchange-requests`
**Precondition:** User owns item, has exchange requests
**Expected Result:** 
- Status 200
- Array of all exchange requests for the item

---

## 4. Chat Management (Chat Routes)

### TC-CHAT-001: Create Chat - Success
**Endpoint:** `POST /api/chats`
**Precondition:** User authenticated, participant exists
**Test Data:**
```json
{
  "participantId": "550e8400-e29b-41d4-a716-446655440000",
  "itemId": "660e8400-e29b-41d4-a716-446655440000",
  "exchangeRequestId": "770e8400-e29b-41d4-a716-446655440000"
}
```
**Expected Result:** 
- Status 201
- Chat created with two participants
- Chat status "pending" or "active"

---

### TC-CHAT-002: Create Chat - With Email
**Endpoint:** `POST /api/chats`
**Precondition:** User authenticated
**Test Data:**
```json
{
  "participantEmail": "john@cmu.ac.th",
  "itemId": "660e8400-e29b-41d4-a716-446655440000"
}
```
**Expected Result:** 
- Status 201
- Chat created or invitation sent

---

### TC-CHAT-003: Create Chat - Missing Participant Info
**Endpoint:** `POST /api/chats`
**Test Data:**
```json
{
  "itemId": "660e8400-e29b-41d4-a716-446655440000"
}
```
**Expected Result:** 
- Status 400
- Error message: "participantId or participantEmail is required"

---

### TC-CHAT-004: Get All Chats
**Endpoint:** `GET /api/chats`
**Precondition:** User authenticated, has chats
**Expected Result:** 
- Status 200
- Array of chats for authenticated user
- Latest message preview included

---

### TC-CHAT-005: Get Chat Messages
**Endpoint:** `GET /api/chats/{chatId}/messages`
**Precondition:** User is participant in chat, chat exists
**Expected Result:** 
- Status 200
- Array of messages sorted by timestamp
- Message details: sender, content, timestamp, read status

---

### TC-CHAT-006: Get Chat Messages - Not Participant
**Endpoint:** `GET /api/chats/{chatId}/messages`
**Precondition:** User is NOT a participant in chat
**Expected Result:** 
- Status 403
- Error message: "Access denied"

---

### TC-CHAT-007: Accept Chat (WebSocket Expected)
**Endpoint:** `PATCH /api/chats/{chatId}/accept`
**Precondition:** User is participant, chat status "pending"
**Expected Result:** 
- Status 200
- Chat status changed to "active"
- Other participant notified via WebSocket

---

### TC-CHAT-008: Decline Chat
**Endpoint:** `PATCH /api/chats/{chatId}/decline`
**Precondition:** User is participant, chat status "pending"
**Expected Result:** 
- Status 200
- Chat status changed to "declined"
- Other participant notified

---

### TC-CHAT-009: Confirm Chat with QR Code
**Endpoint:** `POST /api/chats/{chatId}/confirm`
**Precondition:** Chat is active, QR code generated
**Test Data:**
```json
{
  "code": "QR_CODE_VALUE_12345"
}
```
**Expected Result:** 
- Status 200
- Exchange marked as confirmed/completed
- Both participants notified

---

## 5. Notification Management (Email Routes)

### TC-NOTIFICATION-001: Send Welcome Email
**Trigger:** User registration
**Expected Result:** 
- Welcome email sent to user's email
- Contains user name and quick start instructions

---

### TC-NOTIFICATION-002: Send Password Reset Email
**Trigger:** User requests password reset
**Expected Result:** 
- Password reset email sent
- Contains reset link/token valid for 24 hours

---

### TC-NOTIFICATION-003: Send Exchange Request Notification
**Trigger:** Exchange request created
**Expected Result:** 
- Email sent to item owner
- Contains: requester name, item name, offered item details

---

### TC-NOTIFICATION-004: Send Exchange Accepted Notification
**Trigger:** Exchange request accepted by owner
**Expected Result:** 
- Email sent to requester
- Contains: meeting details, owner info, next steps

---

### TC-NOTIFICATION-005: Send Exchange Completed Notification
**Trigger:** QR code confirmed (exchange completed)
**Expected Result:** 
- Email sent to both parties
- Contains: summary, CO2 saved, rating prompt

---

## 6. User Profile (Profile Routes)

### TC-PROFILE-001: Get User Profile
**Endpoint:** `GET /api/profile` (assumed)
**Precondition:** User authenticated
**Expected Result:** 
- Status 200
- User details: name, email, faculty, rating, items count, exchanges count

---

### TC-PROFILE-002: Update User Profile
**Endpoint:** `PUT /api/profile` (assumed)
**Precondition:** User authenticated
**Test Data:**
```json
{
  "name": "John Updated",
  "faculty": "Computer Science"
}
```
**Expected Result:** 
- Status 200
- Profile updated

---

## 7. Database Connection Tests

### TC-DB-001: Test Database Connection
**Command:** `npm run test:db` or `node scripts/test-db-connection.js`
**Expected Result:** 
- Connection successful
- Message: "Database connected successfully"

---

### TC-DB-002: Database Migration
**Command:** `npm run db:migrate` or `node scripts/migrate.js`
**Expected Result:** 
- All migration scripts executed
- Schema created/updated successfully
- No errors

---

## 8. Email Configuration Tests

### TC-EMAIL-001: Test Email Configuration
**Command:** `npm run test:email` or `node scripts/test-email.js`
**Expected Result:** 
- SMTP connection successful
- Test email received
- No authentication errors

---

### TC-EMAIL-002: Setup Email with Gmail
**Command:** `node scripts/setup-gmail.js`
**Expected Result:** 
- Gmail configuration verified
- App password validated
- Ready to send emails

---

## 9. Integration Tests

### TC-INT-001: Complete Exchange Flow
**Steps:**
1. User A creates item (bike)
2. User B creates exchange request (skateboard)
3. User A accepts request
4. User B accepts request
5. Chat created between parties
6. Both confirm via QR code
7. Exchange marked completed

**Expected Result:** 
- All steps succeed
- Both parties notified at each step
- Exchange history recorded

---

### TC-INT-002: Multiple Exchange Requests on Same Item
**Steps:**
1. Item posted
2. User B requests exchange
3. User C requests exchange
4. Item owner accepts User B's request
5. Reject User C's request

**Expected Result:** 
- Owner can manage multiple requests
- Rejected requester notified
- Item remains available if not confirmed

---

### TC-INT-003: Item Status Lifecycle
**Flow:** active → exchange accepted → confirmed/completed → exchanged

**Expected Result:** 
- Status transitions correctly
- Item not visible in active list after exchanged
- History preserved

---

## 10. Error Handling Tests

### TC-ERROR-001: Invalid JWT Token
**Endpoint:** Any protected endpoint
**Headers:** `Authorization: Bearer invalid_token`
**Expected Result:** 
- Status 401
- Error message: "Invalid token" or "Unauthorized"

---

### TC-ERROR-002: Expired JWT Token
**Headers:** `Authorization: Bearer expired_token`
**Expected Result:** 
- Status 401
- Error message: "Token expired"

---

### TC-ERROR-003: Missing Authorization Header
**Endpoint:** Any protected endpoint
**Headers:** None
**Expected Result:** 
- Status 401
- Error message: "Authorization header missing"

---

### TC-ERROR-004: Database Connection Error
**Precondition:** Database unavailable
**Action:** Try to access any endpoint
**Expected Result:** 
- Status 500 (or appropriate error)
- Error message: "Database connection failed" or similar

---

### TC-ERROR-005: Invalid Input Data Types
**Endpoint:** `POST /api/items`
**Test Data:**
```json
{
  "title": 123,
  "category": ["sports"],
  "itemCondition": null
}
```
**Expected Result:** 
- Status 400
- Validation error messages

---

## 11. Performance Tests

### TC-PERF-001: Get All Items - Large Dataset
**Scenario:** Database has 10,000+ items
**Expected Result:** 
- Response time < 1 second
- Pagination working
- Server doesn't crash

---

### TC-PERF-002: Concurrent Users
**Scenario:** 100 concurrent requests
**Expected Result:** 
- All requests served
- Response time acceptable
- No data corruption

---

## Test Execution Commands

```bash
# Run specific test
npm run test:db
npm run test:email

# Run migrations
npm run db:migrate

# Setup configurations
node scripts/setup-db.js
node scripts/setup-email.js
node scripts/setup-gmail.js

# Kill port if needed
node scripts/kill-port.js
```

---

## Notes for Testers

1. **JWT Token:** Save token from login response for testing protected endpoints
2. **IDs:** Use actual UUIDs generated during previous test steps
3. **Email Testing:** Use test inbox (Mailtrap) for development
4. **Database:** Fresh DB recommended for integration tests
5. **WebSocket:** Some tests require WebSocket connection (chat, real-time notifications)
