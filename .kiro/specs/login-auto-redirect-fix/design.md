# Design Document: Login Auto-Redirect Fix

## Overview

This design addresses the critical issue where the login page automatically redirects to the landing page even when users don't have a valid session, preventing new user registration and existing user login. The root cause is an overly aggressive session check in the `LoginFormContent` component that doesn't properly validate session state before triggering redirects.

The solution involves:
1. Adding robust session validation with timeout mechanisms
2. Implementing proper error handling for session checks
3. Adding a redirect guard to prevent duplicate redirects
4. Clearing invalid session data proactively
5. Improving logging for debugging

## Architecture

### Current Flow (Problematic)

```
User visits /login
  ↓
useEffect runs checkExistingSession()
  ↓
supabase.auth.getSession() called
  ↓
If ANY data.session exists → Immediate redirect
  ↓
User redirected before they can interact
```

### Proposed Flow (Fixed)

```
User visits /login
  ↓
useEffect runs checkExistingSession() with timeout
  ↓
Validate session thoroughly:
  - Check session exists
  - Check session is not expired
  - Verify user data is present
  - Verify user can be fetched
  ↓
If validation fails → Clear session data
  ↓
If validation succeeds → Set redirect flag → Redirect
  ↓
User can interact with login form
```

## Components and Interfaces

### 1. Enhanced Session Validation

**Location:** `app/login/page.tsx` - `LoginFormContent` component

**New Interface:**
```typescript
interface SessionValidationResult {
  isValid: boolean;
  session: Session | null;
  error?: string;
}
```

**New Function:**
```typescript
async function validateSession(
  supabase: SupabaseClient,
  timeout: number = 2000
): Promise<SessionValidationResult>
```

**Validation Steps:**
1. Call `getSession()` with timeout wrapper
2. Check if session exists and is not null
3. Check if session.expires_at is in the future
4. Verify session.user exists and has an id
5. Attempt to fetch user data with `getUser()`
6. Return validation result

### 2. Timeout Wrapper

**Purpose:** Prevent hanging on slow/failed Supabase requests

**Implementation:**
```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), timeoutMs))
  ]);
}
```

### 3. Redirect Guard

**Purpose:** Prevent duplicate redirects from multiple sources (useEffect + auth listener)

**Implementation:**
```typescript
const isRedirectingRef = useRef(false);

function attemptRedirect(destination: string) {
  if (isRedirectingRef.current) {
    console.log('Redirect already in progress, skipping');
    return;
  }
  isRedirectingRef.current = true;
  window.location.href = destination;
}
```

### 4. Session Cleanup

**Purpose:** Clear invalid session data to prevent confusion

**Implementation:**
```typescript
async function clearInvalidSession(supabase: SupabaseClient) {
  try {
    await supabase.auth.signOut();
    console.log('Invalid session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
    // Don't block user even if cleanup fails
  }
}
```

## Data Models

### SessionValidationResult

```typescript
interface SessionValidationResult {
  isValid: boolean;          // Overall validation result
  session: Session | null;   // The session object if valid
  error?: string;            // Error message if validation failed
  reason?: string;           // Specific reason for failure (for logging)
}
```

### Validation Failure Reasons

```typescript
type ValidationFailureReason =
  | 'no_session'           // No session found
  | 'session_expired'      // Session exists but expired
  | 'no_user_data'         // Session exists but no user data
  | 'user_fetch_failed'    // Could not fetch user from Supabase
  | 'timeout'              // Validation timed out
  | 'error';               // Other error occurred
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid sessions never cause redirects

*For any* session state that fails validation (null, expired, missing user data, or fetch failure), the login page should remain displayed without performing a redirect.

**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Invalid sessions are cleaned up

*For any* session that fails validation, the system should call signOut() to clear session-related cookies and data.

**Validates: Requirements 1.2, 4.1**

### Property 3: Valid sessions always redirect

*For any* session that passes all validation checks (exists, not expired, has user data, user fetch succeeds), the system should redirect to either the redirectedFrom parameter or the default landing page.

**Validates: Requirements 2.1**

### Property 4: Session validation checks both session and user

*For any* session validation attempt, the system should verify both that the session object exists and that the user data can be fetched from Supabase.

**Validates: Requirements 2.2**

### Property 5: Redirect parameters are preserved

*For any* valid session with a redirectedFrom query parameter, the redirect destination should match the redirectedFrom value.

**Validates: Requirements 2.4**

### Property 6: Race conditions are prevented

*For any* sequence of multiple session check operations triggered concurrently, only one redirect should occur.

**Validates: Requirements 3.3**

### Property 7: Cleanup errors don't block users

*For any* session cleanup operation that encounters an error, the user should still be able to interact with the login form.

**Validates: Requirements 4.3**

### Property 8: Multiple auth events trigger single redirect

*For any* sequence of multiple SIGNED_IN auth events, only the first event should trigger a redirect.

**Validates: Requirements 6.3**

## Error Handling

### Session Validation Errors

| Error Type | Handling Strategy | User Impact |
|------------|------------------|-------------|
| Timeout | Treat as no session, allow login | User sees login form |
| Network error | Treat as no session, log error | User sees login form |
| Expired session | Clear session, allow login | User sees login form |
| Missing user data | Clear session, allow login | User sees login form |
| Supabase error | Treat as no session, log error | User sees login form |

### Cleanup Errors

- Log error but don't block user
- User can proceed with login even if cleanup fails
- Next successful login will overwrite bad session data

### Redirect Errors

- If redirect fails, log error
- Show error message to user
- Allow user to manually navigate

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Session validation with null session**
   - Input: null session
   - Expected: isValid = false, reason = 'no_session'

2. **Session validation with expired session**
   - Input: session with expires_at in the past
   - Expected: isValid = false, reason = 'session_expired'

3. **Session validation with missing user data**
   - Input: session without user object
   - Expected: isValid = false, reason = 'no_user_data'

4. **Timeout mechanism**
   - Input: Promise that never resolves
   - Expected: Returns timeout value after specified duration

5. **Redirect guard prevents duplicate**
   - Input: Two rapid redirect attempts
   - Expected: Only first redirect executes

6. **Component cleanup**
   - Input: Component mount then unmount
   - Expected: Auth listener subscription is cleaned up

### Property-Based Tests

Property tests will verify universal properties across all inputs:

1. **Property 1: Invalid sessions never cause redirects**
   - Generate: Various invalid session states
   - Verify: No redirect occurs for any invalid state

2. **Property 2: Invalid sessions are cleaned up**
   - Generate: Various invalid session states
   - Verify: signOut() is called for each

3. **Property 3: Valid sessions always redirect**
   - Generate: Various valid session states
   - Verify: Redirect occurs for each

4. **Property 4: Session validation checks both session and user**
   - Generate: Sessions with various combinations of session/user data
   - Verify: Validation fails if either is missing

5. **Property 5: Redirect parameters are preserved**
   - Generate: Various redirectedFrom parameter values
   - Verify: Redirect destination matches parameter

6. **Property 6: Race conditions are prevented**
   - Generate: Multiple concurrent session checks
   - Verify: Only one redirect occurs

7. **Property 7: Cleanup errors don't block users**
   - Generate: Various cleanup error scenarios
   - Verify: User can still interact with form

8. **Property 8: Multiple auth events trigger single redirect**
   - Generate: Multiple SIGNED_IN events
   - Verify: Only one redirect occurs

### Testing Configuration

- Property tests should run minimum 100 iterations
- Each test should reference its design property
- Tag format: **Feature: login-auto-redirect-fix, Property {number}: {property_text}**

### Integration Tests

1. **Full login flow with invalid session**
   - Start with invalid session cookie
   - Visit /login
   - Verify login form is displayed
   - Verify session is cleared

2. **Full login flow with valid session**
   - Start with valid session
   - Visit /login
   - Verify redirect to landing page

3. **Login flow with redirectedFrom parameter**
   - Start with valid session
   - Visit /login?redirectedFrom=/settings
   - Verify redirect to /settings

## Implementation Notes

### Logging Strategy

All session validation steps should be logged:
```typescript
console.log('[Session Check] Starting validation');
console.log('[Session Check] Session exists:', !!session);
console.log('[Session Check] Session expired:', isExpired);
console.log('[Session Check] User data present:', !!session?.user);
console.log('[Session Check] Validation result:', result.isValid);
```

### Performance Considerations

- Timeout set to 2000ms to balance responsiveness and reliability
- Session validation runs only once on component mount
- Auth listener is properly cleaned up to prevent memory leaks

### Backward Compatibility

- Changes are isolated to login page component
- No changes to auth callback or middleware
- Existing session management unchanged
- No database schema changes required

## Deployment Considerations

1. **Testing in Development**
   - Test with various session states
   - Test with slow network (throttling)
   - Test with Supabase errors (disconnect)

2. **Monitoring in Production**
   - Monitor session validation failure rates
   - Track redirect success rates
   - Alert on high timeout rates

3. **Rollback Plan**
   - Keep previous version of login page
   - Can quickly revert if issues arise
   - No data migration needed
