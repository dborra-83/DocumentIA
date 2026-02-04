# Cognito User Pool Implementation

## Overview

This document describes the implementation of the Amazon Cognito User Pool for the Document Analysis system. The User Pool provides secure authentication and user management capabilities for the application.

## Implementation Details

### Task Reference
- **Task**: 2.3 Create Cognito User Pool stack
- **Requirements**: 1.1, 1.2, 1.4, 9.10

### Components Created

#### 1. Cognito User Pool
The User Pool is configured with the following features:

**Sign-in Configuration**
- Email-based sign-in (no username or phone)
- Email auto-verification enabled
- Self sign-up enabled

**Password Policy** (Requirement 9.10)
- Minimum length: 8 characters
- Requires uppercase letters
- Requires lowercase letters
- Requires numbers
- Requires special characters
- Temporary password validity: 7 days

**User Attributes**
- Standard attributes:
  - Email (required, mutable)
  - Given name (optional, mutable)
  - Family name (optional, mutable)
- Custom attributes:
  - Organization (optional, 1-256 characters)

**Multi-Factor Authentication** (Requirement 1.6)
- MFA: Optional
- TOTP (Time-based One-Time Password) enabled
- SMS disabled

**Account Recovery** (Requirement 1.7)
- Email-only recovery method

**Security Features**
- Deletion protection enabled in production
- Prevent user existence errors (security best practice)
- Token revocation enabled

**Email Configuration**
- Uses Cognito's built-in email service
- Custom email templates for:
  - User invitation
  - Email verification
  - Password reset

#### 2. User Pool Client (Web Application)
The app client is configured for web application access:

**Authentication Flows**
- USER_PASSWORD_AUTH: Username/password authentication
- USER_SRP_AUTH: Secure Remote Password protocol
- Custom and admin flows disabled

**Token Configuration** (Requirement 1.4)
- ID token validity: 1 hour
- Access token validity: 1 hour
- Refresh token validity: 30 days
- Token revocation enabled

**OAuth 2.0 Settings**
- Authorization code grant flow enabled
- Implicit grant flow disabled (security best practice)
- Scopes: email, openid, profile
- Callback URLs:
  - Development: localhost:3000, localhost:5173 (Vite/CRA)
  - Production: To be configured with CloudFront URL
- Logout URLs:
  - Development: localhost:3000, localhost:5173
  - Production: To be configured with CloudFront URL

**Attribute Permissions**
- Read attributes: email, emailVerified, givenName, familyName, organization
- Write attributes: email, givenName, familyName, organization

## Architecture Integration

### User Pool in System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  - Login/Register components                                │
│  - AuthContext for state management                         │
│  - Token storage and refresh                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Authentication requests
                     │ (login, register, refresh)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Cognito User Pool                       │
│  - User registration with email verification                │
│  - User login with password                                 │
│  - JWT token issuance (ID, Access, Refresh)                 │
│  - MFA (optional TOTP)                                      │
│  - Password reset via email                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ JWT tokens
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway                                │
│  - Cognito User Pool Authorizer                             │
│  - Validates JWT tokens on every request                    │
│  - Extracts userId from token claims                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Authorized requests
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Lambda Functions                               │
│  - DocumentUploadHandler                                    │
│  - BedrockProcessor                                         │
│  - HistoryManager                                           │
│  - MetricsAggregator                                        │
│  - ExportHandler                                            │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **User Registration** (Requirement 1.1)
   ```
   User → Frontend → Cognito.signUp()
   Cognito → Email verification code
   User → Frontend → Cognito.confirmSignUp(code)
   Cognito → User confirmed
   ```

2. **User Login** (Requirement 1.2)
   ```
   User → Frontend → Cognito.signIn(email, password)
   Cognito → [Optional MFA challenge]
   User → [Optional MFA code]
   Cognito → JWT tokens (ID, Access, Refresh)
   Frontend → Store tokens securely
   ```

3. **Protected API Request** (Requirement 1.5)
   ```
   Frontend → API Gateway (with ID token in Authorization header)
   API Gateway → Cognito (validate token)
   Cognito → Token valid, extract claims
   API Gateway → Lambda (with userId from token)
   Lambda → Process request
   ```

4. **Token Refresh** (Requirement 1.8)
   ```
   Frontend → Detect token expiration
   Frontend → Cognito.refreshSession(refreshToken)
   Cognito → New ID and Access tokens
   Frontend → Update stored tokens
   ```

5. **Password Reset** (Requirement 1.7)
   ```
   User → Frontend → Cognito.forgotPassword(email)
   Cognito → Email reset code
   User → Frontend → Cognito.confirmPassword(code, newPassword)
   Cognito → Password updated
   ```

## CloudFormation Outputs

The construct exports the following values:

1. **UserPoolId**: The unique identifier of the User Pool
   - Used by: Frontend configuration, API Gateway authorizer
   - Export name: `{StackName}-UserPoolId`

2. **UserPoolArn**: The ARN of the User Pool
   - Used by: IAM policies, CloudWatch logs

3. **UserPoolClientId**: The app client ID
   - Used by: Frontend configuration (AWS Amplify, Cognito SDK)
   - Export name: `{StackName}-UserPoolClientId`

4. **UserPoolProviderUrl**: The OIDC provider URL
   - Format: `cognito-idp.{region}.amazonaws.com/{userPoolId}`
   - Used by: API Gateway authorizer configuration

## Frontend Integration

### Configuration
The frontend will need these values from CloudFormation outputs:

```typescript
// src/config/cognito.ts
export const cognitoConfig = {
  region: process.env.REACT_APP_AWS_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
};
```

### AWS Amplify Integration
```typescript
import { Amplify } from 'aws-amplify';
import { cognitoConfig } from './config/cognito';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolWebClientId,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
});
```

### Authentication Service Example
```typescript
import { signIn, signUp, signOut, confirmSignUp, resetPassword } from 'aws-amplify/auth';

export class AuthService {
  async login(email: string, password: string) {
    const { isSignedIn, nextStep } = await signIn({ username: email, password });
    return { isSignedIn, nextStep };
  }

  async register(email: string, password: string) {
    const { userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: { email },
      },
    });
    return { userId, nextStep };
  }

  async confirmRegistration(email: string, code: string) {
    await confirmSignUp({ username: email, confirmationCode: code });
  }

  async logout() {
    await signOut();
  }

  async resetPassword(email: string) {
    await resetPassword({ username: email });
  }
}
```

## API Gateway Integration

The User Pool will be used as an authorizer for API Gateway:

```typescript
// In API Gateway construct (future task)
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
  cognitoUserPools: [cognitoUserPool.userPool],
  authorizerName: 'CognitoAuthorizer',
  identitySource: 'method.request.header.Authorization',
});

// Apply to API methods
api.root.addMethod('GET', lambdaIntegration, {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO,
});
```

## Security Considerations

### Password Policy Compliance
The password policy meets Requirement 9.10:
- ✅ Minimum 8 characters
- ✅ Uppercase letter required
- ✅ Lowercase letter required
- ✅ Number required
- ✅ Special character required

### Token Security
- ID and Access tokens expire after 1 hour (Requirement 1.4)
- Refresh tokens expire after 30 days (Requirement 1.4)
- Token revocation enabled for immediate invalidation
- Tokens transmitted over HTTPS only (Requirement 9.1)

### User Data Protection
- Email addresses verified before account activation
- Prevent user existence errors (prevents user enumeration attacks)
- Advanced security mode in production (adaptive authentication)
- Account recovery via email only (no SMS)

### Session Management
- User sessions maintained for 24 hours unless explicitly logged out (Requirement 1.8)
- Automatic token refresh using refresh token
- Logout invalidates all tokens

## Monitoring and Logging

### CloudWatch Integration
Cognito automatically logs the following events to CloudWatch:
- Authentication attempts (success/failure) - Requirement 9.6
- User registration events
- Password reset requests
- MFA challenges
- Token refresh events

### Metrics to Monitor
- Sign-in success rate
- Sign-in failure rate (potential security issues)
- MFA adoption rate
- Password reset frequency
- Token refresh rate

### Alarms (to be configured in Task 18)
- High authentication failure rate (potential brute force attack)
- Unusual sign-in patterns (adaptive authentication)
- High password reset rate (potential account compromise)

## Cost Considerations

### Pricing Model
- **MAU (Monthly Active Users)**: First 50,000 MAUs free, then tiered pricing
- **Advanced Security**: Additional cost per MAU when enforced
- **SMS MFA**: Per message cost (not used in this implementation)
- **Email**: Free with Cognito's built-in email (50 emails/day limit)

### Cost Optimization
- TOTP MFA instead of SMS (no per-message cost)
- Cognito's built-in email for development
- Consider Amazon SES for production (higher email limits)
- Advanced security in AUDIT mode for development (no cost)

## Testing Considerations

### Manual Testing Checklist
- [ ] User registration with email verification
- [ ] User login with valid credentials
- [ ] User login with invalid credentials (should fail)
- [ ] Password reset flow
- [ ] MFA enrollment and login
- [ ] Token expiration and refresh
- [ ] Logout functionality
- [ ] Password policy enforcement (weak passwords rejected)

### Integration Testing
- [ ] API Gateway authorizer validates tokens correctly
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected
- [ ] User ID extracted from token claims correctly

## Future Enhancements

### Potential Improvements
1. **Social Sign-In**: Add Google, Facebook, or other identity providers
2. **Custom Domain**: Use custom domain for Hosted UI
3. **Lambda Triggers**: Add pre/post authentication triggers for custom logic
4. **User Groups**: Implement role-based access control (RBAC)
5. **Amazon SES**: Replace Cognito email with SES for higher limits
6. **Custom UI**: Build fully custom authentication UI instead of Hosted UI

### Lambda Triggers (Optional)
Cognito supports Lambda triggers for custom workflows:
- Pre sign-up: Custom validation logic
- Post confirmation: Welcome email, create user profile
- Pre authentication: Additional security checks
- Post authentication: Logging, analytics
- Pre token generation: Add custom claims to tokens

## Deployment

### Prerequisites
- AWS CDK installed and configured
- AWS account with appropriate permissions
- Environment variable set: `ENVIRONMENT=dev|staging|prod`

### Deployment Commands
```bash
# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy DocumentAnalysis-dev

# View outputs
aws cloudformation describe-stacks \
  --stack-name DocumentAnalysis-dev \
  --query 'Stacks[0].Outputs'
```

### Post-Deployment
1. Copy User Pool ID and Client ID from CloudFormation outputs
2. Configure frontend environment variables
3. Test authentication flow manually
4. Update callback URLs when CloudFront domain is available

## Troubleshooting

### Common Issues

**Issue**: Email verification not received
- Check spam folder
- Verify email configuration in User Pool
- Check CloudWatch logs for delivery failures
- Consider using Amazon SES for production

**Issue**: Token validation fails in API Gateway
- Verify authorizer configuration
- Check token expiration
- Ensure correct User Pool ID in authorizer
- Verify Authorization header format: `Bearer <token>`

**Issue**: Password policy too strict
- Review Requirement 9.10 - policy is intentionally strict
- Provide clear password requirements in UI
- Show password strength indicator

**Issue**: MFA not working
- Verify TOTP app (Google Authenticator, Authy) time is synchronized
- Check MFA configuration in User Pool
- Ensure user has enrolled in MFA

## References

### AWS Documentation
- [Amazon Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito User Pool Authentication Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
- [AWS Amplify Auth](https://docs.amplify.aws/javascript/build-a-backend/auth/)

### Requirements Mapping
- Requirement 1.1: User registration with email verification ✅
- Requirement 1.2: User login with username and password ✅
- Requirement 1.4: JWT token issuance ✅
- Requirement 1.6: Optional MFA support ✅
- Requirement 1.7: Password reset via email ✅
- Requirement 1.8: Session management (24 hours) ✅
- Requirement 9.10: Password complexity requirements ✅

## Conclusion

The Cognito User Pool construct provides a secure, scalable authentication solution for the Document Analysis system. It meets all specified requirements and follows AWS best practices for security and cost optimization.

Next steps:
- Task 2.4: Create IAM roles for Lambda functions
- Task 16: Integrate with API Gateway
- Task 22: Implement frontend authentication module
