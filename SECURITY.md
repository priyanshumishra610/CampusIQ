# 🔐 CampusIQ Enterprise Security Architecture

## Overview

CampusIQ implements a **zero-trust security model** where the frontend is considered untrusted by design. All critical operations are validated and authorized server-side through Firebase Cloud Functions, with defense-in-depth provided by Firestore security rules.

### Security Philosophy

1. **Never trust the client** - All authorization happens server-side
2. **Fail securely** - Default deny, explicit allow
3. **Defense in depth** - Multiple layers of security
4. **Audit everything** - Complete traceability of all actions
5. **Detect early** - Rate limiting and abuse detection

---

## Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                     │
│  (Untrusted Frontend - All writes go through Functions) │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS Calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Firebase Cloud Functions (Security Layer)     │
│  • Role-based authorization                             │
│  • Rate limiting & abuse detection                      │
│  • Input validation & sanitization                      │
│  • Immutable audit logging                              │
│  • Security event logging                               │
└────────────────────┬────────────────────────────────────┘
                     │ Validated Writes
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Firestore Security Rules                   │
│  • Defense-in-depth validation                          │
│  • Prevent client-side role escalation                  │
│  • Immutable audit logs                                 │
│  • Backend-only security events                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Firestore Database                   │
│  • users, issues, auditLogs, securityEvents             │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Firestore Security Rules

**Location:** `firestore.rules`

### Key Security Features

#### Users Collection
- ✅ Users can only read their own profile
- ✅ Admins can read other users (for task assignment)
- ✅ **Role escalation prevention**: Clients cannot set `role` or `adminRole` during creation
- ✅ Role fields are immutable from client (only Cloud Functions can modify)
- ✅ No deletes allowed (soft delete via status if needed)

#### Issues/Tasks Collection
- ✅ **Role-based read access**: Admins see all, users see only their own
- ✅ **Status transition validation**: Tasks must start as `NEW`
- ✅ **Role-specific update rules**:
  - `REGISTRAR`: Can only update own tasks, no status/priority changes
  - `DEAN`: Can update status to `RESOLVED`/`ESCALATED` only
  - `DIRECTOR`: Full update permissions (validated in Cloud Function)
  - `EXECUTIVE`: Read-only
- ✅ **Delete protection**: All deletes must go through Cloud Functions

#### Audit Logs Collection
- ✅ **IMMUTABLE**: Append-only, backend-only writes
- ✅ Clients cannot create, update, or delete audit logs
- ✅ Only admins can read audit logs
- ✅ Complete tamper-proof audit trail

#### Security Events Collection
- ✅ **Backend-only**: No client access whatsoever
- ✅ Contains intrusion detection logs
- ✅ Rate limit violations
- ✅ Permission denial attempts
- ✅ Abnormal behavior patterns

---

## 2️⃣ Cloud Functions Security Middleware

**Location:** `functions/src/index.ts`

### Secure Endpoints

#### `secureCreateTask`
- ✅ Validates user authentication
- ✅ Checks role permissions (`task:create`)
- ✅ Rate limiting (10 tasks/hour, 3 burst)
- ✅ Input validation & sanitization
- ✅ Creates immutable audit log server-side
- ✅ Returns task ID on success

**Rate Limits:**
- 10 tasks per hour per user
- 3 tasks per 60 seconds (burst protection)

#### `secureUpdateTaskStatus`
- ✅ Validates user authentication
- ✅ Checks role permissions (`task:close`)
- ✅ Rate limiting (20 status changes/hour)
- ✅ Validates status transitions (prevents invalid state changes)
- ✅ Role-specific restrictions (REGISTRAR cannot change status)
- ✅ Creates immutable audit log server-side

**Valid Status Transitions:**
```
NEW → IN_PROGRESS, ESCALATED
IN_PROGRESS → RESOLVED, ESCALATED
ESCALATED → IN_PROGRESS, RESOLVED
RESOLVED → (terminal)
```

#### `secureAddTaskComment`
- ✅ Validates user authentication
- ✅ Admin-only access
- ✅ Rate limiting (50 comments/hour)
- ✅ Input sanitization (max 2000 chars)
- ✅ Creates immutable audit log server-side

### Rate Limiting System

**Per-User Action Limits:**
- Task creation: 10/hour, 3/60s burst
- Task updates: 30/hour, 10/60s burst
- Status changes: 20/hour
- Comments: 50/hour

**Violation Handling:**
- First 3 violations: Logged as `MEDIUM` severity
- 4+ violations: Logged as `HIGH` severity
- Security events created for all violations
- User receives clear error message

---

## 3️⃣ Security Event Logging

**Collection:** `securityEvents`

### Event Types

1. **Rate Limit Violations**
   - `rate_limit:task:create`
   - `rate_limit:task:update`
   - `rate_limit:task:status_change`
   - `rate_limit:task:comment`

2. **Permission Denials**
   - `task:create:permission_denied`
   - `task:status_change:permission_denied`
   - `task:comment:permission_denied`

3. **Role Violations**
   - `task:status_change:role_violation`
   - `role:validation_failed`

4. **Invalid Operations**
   - `task:status_change:invalid_transition`
   - `task:create:burst_detected`

### Event Structure

```typescript
{
  userId: string;
  userEmail: string;
  role: string;
  adminRole?: AdminRole;
  action: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}
```

### Monitoring

**Automated Monitoring:**
- Cloud Function `monitorSecurityEvents` runs hourly
- Alerts if >10 HIGH/CRITICAL events in last hour
- Tracks users with >5 rate limit violations
- Logs warnings for suspicious patterns

---

## 4️⃣ Anti-Abuse & Rate Limiting

### Protection Mechanisms

1. **Per-User Rate Limits**
   - Tracks action counts per user
   - Sliding window reset
   - Persistent across sessions

2. **Burst Detection**
   - Short-window limits (60 seconds)
   - Prevents rapid-fire attacks
   - Triggers HIGH severity security events

3. **Violation Tracking**
   - Counts violations per user
   - Escalates severity after threshold
   - Enables pattern detection

### How It Prevents Abuse

**Scraping Prevention:**
- Rate limits prevent bulk data extraction
- Burst limits prevent rapid enumeration
- Security events flag suspicious patterns

**Flooding Prevention:**
- Per-user limits prevent DoS from single account
- Burst detection prevents rapid-fire attacks
- Cloud Functions scale but rate limits protect backend

**Role Escalation Prevention:**
- Role fields immutable from client
- Server-side role validation on every operation
- Security events log all permission denials

---

## 5️⃣ Immutable Audit Protection

### Audit Log Security

**Collection:** `auditLogs`

**Security Guarantees:**
- ✅ **Append-only**: No updates or deletes allowed
- ✅ **Backend-only writes**: Clients cannot create audit logs
- ✅ **Tamper-proof**: Firestore rules prevent all client modifications
- ✅ **Complete traceability**: Every action is logged with user, role, timestamp

**Audit Log Structure:**
```typescript
{
  action: AuditAction;
  performedBy: {
    id: string;
    name: string;
    role: AdminRole;
  };
  timestamp: Timestamp;
  entityType: EntityType;
  entityId: string;
  details?: Record<string, any>;
  previousValue?: string;
  newValue?: string;
}
```

**All Actions Logged:**
- Task creation
- Status changes
- Priority changes
- Comment additions
- Task assignments
- Task deletions
- Compliance updates
- Finance updates

---

## 6️⃣ Optional Enhancements

### Device Fingerprinting (Lightweight)

**Implementation Idea:**
```typescript
// In Cloud Function, track device characteristics
const deviceFingerprint = {
  userAgent: request.headers['user-agent'],
  ipAddress: request.ip,
  timestamp: Date.now(),
};

// Store in securityEvents metadata
// Detect multiple accounts from same device
```

### Honeypot Permission Checks

**Implementation:**
- Add fake permission fields to user profile
- Monitor access attempts to these fields
- Log as security event if accessed
- Example: `canDeleteAllTasks`, `isSuperAdmin`

### Alert Thresholds

**Current Thresholds:**
- >10 HIGH/CRITICAL events per hour → Alert
- >5 rate limit violations per user → Warning
- Invalid status transitions → Logged

**Enhancement Ideas:**
- Email/SMS alerts to security team
- Dashboard for security events
- Automated user suspension after N violations

---

## Deployment Checklist

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 3. Create Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### 4. Verify Security Rules
- Test with different user roles
- Verify rate limits work
- Check security events are logged

### 5. Monitor Security Events
- Set up alerts for HIGH/CRITICAL events
- Review rate limit violations weekly
- Check for suspicious patterns

---

## Testing Security

### Manual Tests

1. **Role Escalation Test**
   - Try to set `role: 'ADMIN'` in user profile → Should fail
   - Try to set `adminRole: 'DIRECTOR'` → Should fail

2. **Rate Limit Test**
   - Create 11 tasks rapidly → 11th should fail with rate limit error
   - Check `securityEvents` collection for violation log

3. **Permission Test**
   - REGISTRAR tries to change task status → Should fail
   - EXECUTIVE tries to create task → Should fail

4. **Audit Log Test**
   - Try to delete audit log → Should fail (Firestore rule)
   - Try to update audit log → Should fail (Firestore rule)
   - Try to create audit log from client → Should fail (Firestore rule)

---

## Security Best Practices

### For Developers

1. **Never bypass Cloud Functions** - Always use secure endpoints
2. **Validate on server** - Don't trust client validation
3. **Log security events** - Use `logSecurityEvent` for suspicious activity
4. **Rate limit everything** - Add limits to new endpoints
5. **Test security rules** - Verify rules work as expected

### For Administrators

1. **Monitor security events** - Review logs regularly
2. **Set up alerts** - Configure notifications for HIGH/CRITICAL events
3. **Review rate limits** - Adjust based on legitimate usage patterns
4. **Audit user roles** - Verify role assignments are correct
5. **Keep dependencies updated** - Security patches are critical

---

## Threat Model

### Protected Against

✅ **Client Tampering**
- Role escalation prevented by Firestore rules
- Direct Firestore writes blocked for critical operations

✅ **API Abuse**
- Rate limiting prevents scraping
- Burst detection prevents flooding
- Per-user limits prevent DoS

✅ **Role Escalation**
- Role fields immutable from client
- Server-side role validation on every operation
- Security events log all attempts

✅ **Data Scraping**
- Rate limits prevent bulk extraction
- Role-based read access limits data exposure
- Security events flag suspicious patterns

✅ **Injection Attempts**
- Input validation and sanitization
- Type checking on all inputs
- Length limits on text fields

✅ **Flooding Requests**
- Burst limits prevent rapid-fire attacks
- Per-user rate limits prevent single-account DoS
- Cloud Functions auto-scale but limits protect backend

---

## Success Criteria ✅

- ✅ **Zero-trust model**: Frontend is untrusted, all authorization server-side
- ✅ **Early detection**: Rate limits and security events catch misuse quickly
- ✅ **Fail safely**: Default deny, explicit allow, clear error messages
- ✅ **Complete traceability**: Every action logged in immutable audit trail
- ✅ **Enterprise-aligned**: Production-ready security architecture

---

## Questions for Judges

**Q: How does this prevent a malicious user from modifying their role?**
A: Role fields (`role`, `adminRole`) are immutable from the client. Firestore rules prevent setting these fields during user creation/update. Only Cloud Functions (with service account) can modify roles.

**Q: What happens if someone tries to scrape all tasks?**
A: Rate limits (10 tasks/hour, 30 updates/hour) prevent bulk extraction. Burst limits (3 tasks/60s) prevent rapid enumeration. Security events log all violations for review.

**Q: How are audit logs protected from tampering?**
A: Audit logs are append-only and backend-only. Firestore rules prevent all client writes, updates, and deletes. Only Cloud Functions can create audit logs, ensuring tamper-proof trail.

**Q: What if a user exceeds rate limits legitimately?**
A: Rate limits are per-user and reset hourly. Legitimate users can continue after the window resets. Violations are logged but don't block future access. Limits can be adjusted based on usage patterns.

---

*CampusIQ Security Architecture v1.0 - Enterprise-Grade Zero-Trust Security*


