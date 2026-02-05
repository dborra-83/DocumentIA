import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface CognitoUserPoolConstructProps {
  environment: string;
}

export class CognitoUserPoolConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoUserPoolConstructProps) {
    super(scope, id);

    const { environment } = props;

    // Cognito User Pool - handles user authentication
    // Requirements: 1.1, 1.2, 1.4, 9.10
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `DocumentAnalysisUserPool-${environment}`,
      
      // Sign-in configuration - email only (Requirement 1.1, 1.2)
      signInAliases: {
        email: true,
        username: false,
        phone: false,
      },
      
      // Auto-verify email addresses (Requirement 1.1)
      autoVerify: {
        email: true,
      },
      
      // Standard attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      
      // Custom attributes (optional)
      customAttributes: {
        organization: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 256,
          mutable: true,
        }),
      },
      
      // Password policy - Requirement 9.10
      // Minimum 8 characters, uppercase, lowercase, number, special character
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      
      // Account recovery - email only (Requirement 1.7)
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      
      // MFA configuration - optional TOTP (Requirement 1.6)
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true, // TOTP (Time-based One-Time Password)
      },
      
      // Email configuration
      email: cognito.UserPoolEmail.withCognito(),
      
      // User invitation settings
      userInvitation: {
        emailSubject: 'Welcome to Document Analysis Platform',
        emailBody: 'Hello {username}, your temporary password is {####}',
      },
      
      // User verification settings
      userVerification: {
        emailSubject: 'Verify your email for Document Analysis Platform',
        emailBody: 'Thank you for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      
      // Self sign-up enabled
      selfSignUpEnabled: true,
      
      // Deletion protection for production
      deletionProtection: environment === 'prod',
      
      // Removal policy
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // App Client for web application - Requirement 1.4
    this.userPoolClient = new cognito.UserPoolClient(this, 'WebClient', {
      userPool: this.userPool,
      userPoolClientName: `DocumentAnalysisWebClient-${environment}`,
      
      // Authentication flows
      authFlows: {
        userPassword: true,      // USER_PASSWORD_AUTH
        userSrp: true,           // USER_SRP_AUTH (Secure Remote Password)
        custom: false,
        adminUserPassword: false,
      },
      
      // Token expiration - Requirement 1.4
      // ID token: 1 hour
      // Access token: 1 hour
      // Refresh token: 30 days
      idTokenValidity: cdk.Duration.hours(1),
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      
      // Token revocation
      enableTokenRevocation: true,
      
      // Prevent user existence errors (security best practice)
      preventUserExistenceErrors: true,
      
      // OAuth settings (for future Hosted UI integration)
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        // Callback URLs - temporary placeholder for prod, will be updated with CloudFront URL
        callbackUrls: environment === 'prod' 
          ? ['https://example.com/callback'] // Temporary placeholder, update after CloudFront deployment
          : ['http://localhost:3000/callback', 'http://localhost:5173/callback'], // Vite and CRA dev servers
        logoutUrls: environment === 'prod'
          ? ['https://example.com/logout'] // Temporary placeholder, update after CloudFront deployment
          : ['http://localhost:3000/logout', 'http://localhost:5173/logout'],
      },
      
      // Read and write attributes
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          givenName: true,
          familyName: true,
        })
        .withCustomAttributes('organization'),
      
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
        })
        .withCustomAttributes('organization'),
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'ID of the Cognito User Pool',
      exportName: `${cdk.Stack.of(this).stackName}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'ARN of the Cognito User Pool',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'ID of the Cognito User Pool Client',
      exportName: `${cdk.Stack.of(this).stackName}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'UserPoolProviderUrl', {
      value: this.userPool.userPoolProviderUrl,
      description: 'Provider URL of the Cognito User Pool',
    });

    // Create Admins group
    const adminsGroup = new cognito.CfnUserPoolGroup(this, 'AdminsGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Admins',
      description: 'Administrators with full access to all documents',
      precedence: 1,
    });

    // Add tags
    cdk.Tags.of(this.userPool).add('Purpose', 'Authentication');
    cdk.Tags.of(this.userPoolClient).add('Purpose', 'WebApplication');
  }
}
