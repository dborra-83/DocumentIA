# Quick Reference: Admin Functionality

## Add User to Admins Group

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_OLdguEFy6 \
  --username <user-email> \
  --group-name Admins
```

## Remove User from Admins Group

```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_OLdguEFy6 \
  --username <user-email> \
  --group-name Admins
```

## List All Users in Admins Group

```bash
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_OLdguEFy6 \
  --group-name Admins
```

## Check User's Groups

```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_OLdguEFy6 \
  --username <user-email>
```

---

## What Admins Can Do

✅ View all documents from all users in History page
✅ View analysis of any document (regardless of owner)
✅ See which user uploaded each document
✅ All standard user features

## What Admins Cannot Do (Yet)

❌ Delete other users' documents (only their own)
❌ Manage user accounts
❌ View user statistics dashboard

---

## Testing

1. **Add yourself as admin**:
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_OLdguEFy6 \
     --username your-email@example.com \
     --group-name Admins
   ```

2. **Login**: https://d2twnt4egn896m.cloudfront.net/login

3. **Go to History**: You should see all documents from all users

4. **Check console**: Open browser DevTools and check the user object - should have `isAdmin: true`

---

## Troubleshooting

### Admin not seeing all documents?
- Check user is in Admins group: `aws cognito-idp admin-list-groups-for-user --user-pool-id us-east-1_OLdguEFy6 --username <email>`
- Logout and login again to refresh JWT token
- Check browser console for `isAdmin: true` in user object

### Lambda errors?
- Check CloudWatch logs: `/aws/lambda/HistoryManager-dev`
- Verify Lambda function updated: `aws lambda get-function --function-name HistoryManager-dev`

---

**User Pool ID**: us-east-1_OLdguEFy6
**Group Name**: Admins
**Lambda Function**: HistoryManager-dev
**Frontend**: https://d2twnt4egn896m.cloudfront.net
