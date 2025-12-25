# 🚀 CampusIQ Security Deployment Guide

## Quick Start

### Prerequisites

1. **Firebase CLI** installed and authenticated
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Node.js 18+** for Cloud Functions
   ```bash
   node --version  # Should be 18 or higher
   ```

3. **Firebase Project** created at [console.firebase.google.com](https://console.firebase.google.com)

---

## Step 1: Initialize Firebase Project

```bash
cd CampusIQ
firebase init
```

**Select:**
- ✅ Firestore
- ✅ Functions
- ✅ (Optional) Hosting

**When prompted:**
- Use existing project or create new
- Language: TypeScript
- ESLint: Yes
- Install dependencies: Yes

---

## Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

**Verify:**
- Go to Firebase Console → Firestore → Rules
- Confirm rules are deployed

---

## Step 3: Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

**Verify:**
- Go to Firebase Console → Firestore → Indexes
- Wait for indexes to build (may take a few minutes)

---

## Step 4: Install Cloud Functions Dependencies

```bash
cd functions
npm install
npm run build
cd ..
```

**Verify:**
- Check `functions/lib/` directory exists
- No TypeScript compilation errors

---

## Step 5: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

**This deploys:**
- `secureCreateTask`
- `secureUpdateTaskStatus`
- `secureAddTaskComment`
- `monitorSecurityEvents` (scheduled function)

**Verify:**
- Go to Firebase Console → Functions
- All functions show "Active" status

---

## Step 6: Update Frontend Dependencies

The frontend needs `@react-native-firebase/functions`:

```bash
npm install @react-native-firebase/functions
```

**Note:** If already installed, ensure it's version 20.0.0+ to match other Firebase packages.

---

## Step 7: Test Security

### Test 1: Role Escalation Prevention

1. Try to create a user with `role: 'ADMIN'` from client
2. **Expected:** Firestore rule should reject

### Test 2: Rate Limiting

1. Create 11 tasks rapidly
2. **Expected:** 11th task should fail with rate limit error
3. Check `securityEvents` collection for violation log

### Test 3: Permission Check

1. Login as REGISTRAR
2. Try to change task status
3. **Expected:** Should fail with permission denied

### Test 4: Audit Log Immutability

1. Try to delete an audit log from client
2. **Expected:** Firestore rule should reject

---

## Troubleshooting

### Cloud Functions Not Deploying

**Error:** `Functions did not deploy properly`

**Solution:**
```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Firestore Rules Syntax Error

**Error:** `Error parsing rules`

**Solution:**
- Check `firestore.rules` syntax
- Use Firebase Console → Firestore → Rules → Validate
- Fix any syntax errors

### Rate Limits Too Strict

**Issue:** Legitimate users hitting rate limits

**Solution:**
- Adjust limits in `functions/src/index.ts`:
  ```typescript
  const RATE_LIMITS = {
    'task:create': { max: 20, windowMinutes: 60 }, // Increase from 10
    // ...
  };
  ```
- Redeploy functions: `firebase deploy --only functions`

### Security Events Not Logging

**Issue:** No events in `securityEvents` collection

**Solution:**
- Check Cloud Functions logs: `firebase functions:log`
- Verify `logSecurityEvent` function is called
- Check Firestore rules allow Cloud Functions to write

---

## Monitoring

### View Security Events

```bash
# In Firebase Console
Firestore → securityEvents collection
```

### View Function Logs

```bash
firebase functions:log
```

### Monitor Rate Limits

```bash
# In Firebase Console
Firestore → rateLimits collection
```

---

## Production Checklist

- [ ] Firestore rules deployed
- [ ] Firestore indexes built
- [ ] Cloud Functions deployed and active
- [ ] Security events logging correctly
- [ ] Rate limits tested
- [ ] Audit logs immutable (test delete/update)
- [ ] Role escalation prevention tested
- [ ] Monitoring alerts configured
- [ ] Documentation reviewed

---

## Rollback Plan

If security deployment causes issues:

1. **Rollback Firestore Rules:**
   ```bash
   # Restore previous rules in Firebase Console
   # Or use git to restore firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Rollback Cloud Functions:**
   ```bash
   # Delete functions in Firebase Console
   # Or deploy previous version
   firebase deploy --only functions --force
   ```

3. **Disable Rate Limiting Temporarily:**
   - Comment out rate limit checks in Cloud Functions
   - Redeploy: `firebase deploy --only functions`

---

## Support

For security issues or questions:
1. Review `SECURITY.md` for architecture details
2. Check Cloud Functions logs
3. Review Firestore security events
4. Contact security team

---

*CampusIQ Security Deployment Guide v1.0*


