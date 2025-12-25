# 🏆 CampusIQ Security - Judges Quick Reference

## 2-Minute Pitch

**CampusIQ implements zero-trust security** where the frontend is untrusted by design. All critical operations go through Firebase Cloud Functions that validate permissions, enforce rate limits, and create tamper-proof audit logs. Firestore security rules provide defense-in-depth, preventing role escalation and ensuring audit logs are immutable.

---

## Key Security Features (30 seconds each)

### 1. Server-Side Authorization ✅
- **What:** All task operations go through Cloud Functions
- **Why:** Client can be tampered with, server cannot
- **Proof:** Try to create task directly in Firestore → Blocked by rules

### 2. Rate Limiting ✅
- **What:** 10 tasks/hour, 20 status changes/hour per user
- **Why:** Prevents scraping and flooding
- **Proof:** Create 11 tasks rapidly → 11th fails with rate limit error

### 3. Role Escalation Prevention ✅
- **What:** Role fields immutable from client
- **Why:** Prevents users from granting themselves admin access
- **Proof:** Try to set `role: 'ADMIN'` in user profile → Firestore rule rejects

### 4. Immutable Audit Logs ✅
- **What:** Audit logs append-only, backend-only writes
- **Why:** Compliance and forensics - cannot delete history
- **Proof:** Try to delete audit log → Firestore rule rejects

### 5. Security Event Logging ✅
- **What:** All violations logged to `securityEvents` collection
- **Why:** Early detection of abuse patterns
- **Proof:** Check `securityEvents` collection after rate limit violation

---

## Demo Script (2 minutes)

### Demo 1: Role Escalation Prevention (30s)
1. Open Firebase Console → Firestore
2. Try to create user document with `role: 'ADMIN'`
3. **Result:** Firestore rule rejects (show error)
4. **Explain:** "Role fields can only be set by Cloud Functions, not clients"

### Demo 2: Rate Limiting (30s)
1. Open app, login as admin
2. Rapidly create 11 tasks
3. **Result:** 11th task fails with "Rate limit exceeded"
4. **Explain:** "Prevents scraping - 10 tasks per hour per user"

### Demo 3: Immutable Audit Logs (30s)
1. Open Firebase Console → Firestore → `auditLogs`
2. Try to delete an audit log document
3. **Result:** Firestore rule rejects (show error)
4. **Explain:** "Audit logs are append-only - cannot delete or modify"

### Demo 4: Security Events (30s)
1. Open Firebase Console → Firestore → `securityEvents`
2. Show recent events (rate limit violations, permission denials)
3. **Explain:** "All security violations are logged for monitoring"

---

## Architecture Diagram (Quick Draw)

```
Frontend (Untrusted)
    ↓
Cloud Functions (Security Layer)
    • Authorization
    • Rate Limiting
    • Audit Logging
    ↓
Firestore Rules (Defense-in-Depth)
    ↓
Firestore Database
```

**Key Point:** Multiple layers of security - if one fails, others protect.

---

## Threat Model Coverage

| Threat | Protection | Proof |
|--------|-----------|-------|
| **Client Tampering** | Server-side validation | Try role escalation → Fails |
| **API Abuse** | Rate limiting | Create 11 tasks → Rate limited |
| **Role Escalation** | Immutable role fields | Set role from client → Blocked |
| **Data Scraping** | Rate limits + role-based access | Bulk reads → Rate limited |
| **Injection** | Input validation | Invalid input → Rejected |
| **Flooding** | Burst detection | Rapid requests → Blocked |

---

## Code Highlights

### Firestore Rules (Defense-in-Depth)
```javascript
// Users cannot set their own role
allow create: if request.resource.data.role == 'USER'
  && !('adminRole' in request.resource.data);

// Audit logs are immutable
allow create: if false;  // Backend-only
allow update: if false;  // Never allowed
allow delete: if false;  // Never allowed
```

### Cloud Functions (Server-Side Authorization)
```typescript
// Validate permission
if (!hasPermission(profile.adminRole, 'task:create')) {
  throw new HttpsError('permission-denied', ...);
}

// Check rate limit
const rateLimitCheck = await checkRateLimit(userId, 'task:create');
if (!rateLimitCheck.allowed) {
  throw new HttpsError('resource-exhausted', ...);
}
```

---

## Success Criteria ✅

✅ **Zero-trust model**: Frontend untrusted, all authorization server-side  
✅ **Early detection**: Rate limits catch misuse immediately  
✅ **Fail safely**: Default deny, clear error messages  
✅ **Complete traceability**: Every action logged immutably  
✅ **Enterprise-aligned**: Production-ready architecture  

---

## Questions Judges Might Ask

**Q: What if a legitimate user hits rate limits?**  
A: Rate limits reset hourly. Legitimate users can continue after the window. Limits can be adjusted based on usage patterns.

**Q: How do you prevent someone from modifying Cloud Functions?**  
A: Cloud Functions are deployed server-side and require Firebase admin access. Code is version-controlled and reviewed before deployment.

**Q: What about SQL injection or XSS?**  
A: Firestore is NoSQL (no SQL injection). Input validation and sanitization prevent XSS. All text inputs are sanitized before storage.

**Q: Can users bypass rate limits by creating multiple accounts?**  
A: Rate limits are per-user. Multi-account abuse would require multiple authenticated accounts. Device fingerprinting (optional enhancement) can detect this pattern.

**Q: How do you handle security events in production?**  
A: Automated monitoring runs hourly, alerting on >10 HIGH/CRITICAL events. Security team reviews events weekly. Violation thresholds can trigger automated actions.

---

## Files to Show Judges

1. **`firestore.rules`** - Shows defense-in-depth rules
2. **`functions/src/index.ts`** - Shows server-side validation
3. **`SECURITY.md`** - Comprehensive documentation
4. **Firebase Console** - Live security events and audit logs

---

## Key Differentiators

1. **Zero-trust architecture** - Frontend is untrusted by design
2. **Multiple security layers** - Cloud Functions + Firestore rules
3. **Immutable audit trail** - Cannot delete or modify history
4. **Real-time abuse detection** - Rate limits + security events
5. **Production-ready** - Enterprise-grade security patterns

---

*CampusIQ Security - Enterprise-Grade Zero-Trust Architecture*


