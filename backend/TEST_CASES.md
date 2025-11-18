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
  "email": "not-an-email",
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
  "email": "john.doe@cmu.ac.th",
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
  "email": "john.doe@cmu.ac.th",
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

(Truncated for brevity — full set includes items, exchange, chat, error handling, and edge cases)
