import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface CloudFrontConstructProps {
  webHostingBucket: s3.Bucket;
  apiGatewayUrl: string;
  environment: string;
  domainName?: string;
  certificateArn?: string;
}

export class CloudFrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly originAccessIdentity: cloudfront.OriginAccessIdentity;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    const { webHostingBucket, apiGatewayUrl, environment, domainName, certificateArn } = props;

    // Create Origin Access Identity for S3 bucket access
    this.originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for DocumentAnalysis ${environment}`,
    });

    // Grant CloudFront read access to the S3 bucket
    webHostingBucket.grantRead(this.originAccessIdentity);

    // Add bucket policy to allow CloudFront OAI
    webHostingBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [webHostingBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            this.originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // Cache policy for static assets (long cache)
    const staticAssetsCachePolicy = new cloudfront.CachePolicy(this, 'StaticAssetsCachePolicy', {
      cachePolicyName: `DocumentAnalysis-StaticAssets-${environment}`,
      comment: 'Cache policy for static assets (JS, CSS, images)',
      defaultTtl: cdk.Duration.days(30),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.days(1),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Cache policy for HTML (short cache for SPA)
    const htmlCachePolicy = new cloudfront.CachePolicy(this, 'HtmlCachePolicy', {
      cachePolicyName: `DocumentAnalysis-Html-${environment}`,
      comment: 'Cache policy for HTML files (short TTL for SPA)',
      defaultTtl: cdk.Duration.minutes(5),
      maxTtl: cdk.Duration.hours(1),
      minTtl: cdk.Duration.seconds(0),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Response headers policy for security
    const securityHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
      responseHeadersPolicyName: `DocumentAnalysis-Security-${environment}`,
      comment: 'Security headers for DocumentAnalysis',
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: {
          frameOption: cloudfront.HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
        xssProtection: {
          protection: true,
          modeBlock: true,
          override: true,
        },
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
            override: false,
          },
          {
            header: 'Pragma',
            value: 'no-cache',
            override: false,
          },
        ],
      },
    });

    // Certificate (if custom domain is provided)
    let certificate: certificatemanager.ICertificate | undefined;
    if (certificateArn) {
      certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'Certificate',
        certificateArn
      );
    }

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `DocumentAnalysis ${environment} distribution`,
      defaultRootObject: 'index.html',
      
      // Domain configuration
      ...(domainName && certificate
        ? {
            domainNames: [domainName],
            certificate,
          }
        : {}),

      // S3 origin for static assets (using S3BucketOrigin for proper REST endpoint)
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(webHostingBucket, {
          originAccessIdentity: this.originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: htmlCachePolicy,
        responseHeadersPolicy: securityHeadersPolicy,
      },

      // Additional behaviors for different file types
      additionalBehaviors: {
        // Static assets (JS, CSS, images) - long cache
        '/assets/*': {
          origin: origins.S3BucketOrigin.withOriginAccessIdentity(webHostingBucket, {
            originAccessIdentity: this.originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: staticAssetsCachePolicy,
          responseHeadersPolicy: securityHeadersPolicy,
        },
        
        // Static files (fonts, icons) - long cache
        '/static/*': {
          origin: origins.S3BucketOrigin.withOriginAccessIdentity(webHostingBucket, {
            originAccessIdentity: this.originAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: staticAssetsCachePolicy,
          responseHeadersPolicy: securityHeadersPolicy,
        },
      },

      // Error responses for SPA routing
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],

      // Price class (use PriceClass.PRICE_CLASS_ALL for global distribution)
      priceClass: environment === 'prod' 
        ? cloudfront.PriceClass.PRICE_CLASS_100 // US, Canada, Europe
        : cloudfront.PriceClass.PRICE_CLASS_100,

      // Enable IPv6
      enableIpv6: true,

      // Enable logging (optional)
      enableLogging: environment === 'prod',
      ...(environment === 'prod'
        ? {
            logBucket: new s3.Bucket(this, 'LogBucket', {
              bucketName: `document-analysis-cloudfront-logs-${cdk.Stack.of(this).account}-${environment}`,
              encryption: s3.BucketEncryption.S3_MANAGED,
              blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
              objectOwnership: s3.ObjectOwnership.OBJECT_WRITER, // Required for CloudFront logging
              removalPolicy: cdk.RemovalPolicy.RETAIN,
              lifecycleRules: [
                {
                  id: 'DeleteOldLogs',
                  enabled: true,
                  expiration: cdk.Duration.days(90),
                },
              ],
            }),
            logFilePrefix: 'cloudfront/',
          }
        : {}),

      // Minimum TLS version
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

      // HTTP version
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `${cdk.Stack.of(this).stackName}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `${cdk.Stack.of(this).stackName}-DistributionDomain`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront URL',
    });

    if (domainName) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${domainName}`,
        description: 'Custom Domain URL',
      });
    }

    // Add tags
    cdk.Tags.of(this.distribution).add('Purpose', 'WebDistribution');
  }
}
