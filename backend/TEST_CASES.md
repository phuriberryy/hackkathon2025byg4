# ShareCycle Backend TEST_CASES.md (Updated)

This document reflects the **latest version** of your automated test script (`run-tests.js`).  
All endpoints, roles, expectations, and execution flow now match the exact logic used in the script.

---

# ✅ 1. Authentication Tests

## **1.1 Register User 1 (Seller)**
- **Method:** POST  
- **Endpoint:** `/api/auth/register`  
- **Body:**  
  - name  
  - email  
  - password  
  - faculty  
- **Expected:** `201 Created`  
- **Purpose:** Create first test user (Seller)

## **1.2 Register User 2 (Buyer/Requester)**
- Same as User 1  
- **Expected:** `201 Created`  

## **1.3 Login User 1**
- **Method:** POST  
- **Endpoint:** `/api/auth/login`  
- **Body:** email + password  
- **Expected:** `200 OK`, returns **user1 token**  

## **1.4 Login User 2**
- Same logic  
- **Expected:** `200 OK`, returns **user2 token**

---

# ✅ 2. Item Tests

## **2.1 Get All Items (Public)**
- **Method:** GET  
- **Endpoint:** `/api/items`  
- **Expected:** `200 OK`

## **2.2 Create Item (User 1 only)**
- **Method:** POST  
- **Endpoint:** `/api/items`  
- **Auth:** `Bearer user1-token`  
- **Body:**  
  - title  
  - category  
  - itemCondition  
  - description  
  - pickupLocation  
  - lookingFor  
- **Expected:** `201 Created`  
- **Result Stored:** `createdIds.item`

## **2.3 Get Item by ID**
- **Method:** GET  
- **Endpoint:** `/api/items/:id`  
- **Expected:** `200 OK`

---

# ✅ 3. Exchange Request Tests  
(Updated to match your latest code — now only tests using **real created items**.)

## **3.1 Create Exchange Request (User 2 → User 1 item)**  
- **Method:** POST  
- **Endpoint:** `/api/exchange`  
- **Auth:** user2 token  
- **Body:**  
  - itemId (User 1 item)  
  - message  
  - requesterItemName  
  - requesterItemCategory  
  - requesterItemCondition  
  - requesterItemDescription  
  - requesterPickupLocation  
- **Expected:** `201 Created`  
- **Result Stored:** `createdIds.exchangeRequest`

## **3.2 Get Exchange Requests (User 1 is receiver)**  
- **Method:** GET  
- **Endpoint:** `/api/exchange/my-requests`  
- **Auth:** user1 token  
- **Expected:** `200 OK`

## **3.3 Get Exchange Request by ID**
- **Method:** GET  
- **Endpoint:** `/api/exchange/:id`  
- **Expected:** `200 OK`

## **3.4 Owner Accept Request**
- **Method:** POST  
- **Endpoint:** `/api/exchange/:id/accept-owner`  
- **Auth:** user1  
- **Expected:** `200 OK`

## **3.5 Requester Accept Request**
- **Method:** POST  
- **Endpoint:** `/api/exchange/:id/accept-requester`  
- **Auth:** user2  
- **Expected:** `200 OK`

## **3.6 Reject Exchange Request**
- **Method:** POST  
- **Endpoint:** `/api/exchange/:id/reject`  
- **Expected:** `200 OK`

---

# ✅ 4. Chat Tests  
(Executed only if both users + item + exchange request exist.)

## **4.1 Create Chat (User 1 initiates chat with User 2)**
- **Method:** POST  
- **Endpoint:** `/api/chats`  
- **Auth:** user1 token  
- **Body:**  
  - participantId (User 2)  
  - itemId (User 1 item)  
  - exchangeRequestId  
- **Expected:** `201 Created`

## **4.2 Get All Chats (User 1)**
- **Method:** GET  
- **Endpoint:** `/api/chats`  
- **Auth:** user1  
- **Expected:** `200 OK`

## **4.3 Get All Chats (User 2)**
- Same  
- **Expected:** `200 OK`

---

# ❌ 5. Error Handling Tests

## **5.1 Unauthorized Create Item Attempt**
- **Method:** POST  
- **Endpoint:** `/api/items`  
- **Body:** (title, category, itemCondition)  
- **No Token**  
- **Expected:** `401 Unauthorized`

## **5.2 Register with Invalid Email**
- **Method:** POST  
- **Endpoint:** `/api/auth/register`  
- **Body:** invalid email  
- **Expected:** `400 Bad Request`

## **5.3 Register with Too Short Password**
- **Method:** POST  
- **Endpoint:** `/api/auth/register`  
- **Body:** password = "123"  
- **Expected:** `400 Bad Request`

---

# 🎯 Final Notes
This test plan is **fully synchronized** with every step, object, and expectation from your latest `run-tests.js`.  
You can regenerate this document anytime when modifying tests.

