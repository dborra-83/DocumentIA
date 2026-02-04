# Document Analysis Frontend

React + TypeScript frontend application for AI-powered document analysis with Amazon Bedrock.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API deployed and running

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API configuration
# VITE_API_URL=your-api-url
# VITE_USER_POOL_ID=your-user-pool-id
# VITE_USER_POOL_CLIENT_ID=your-client-id

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── contexts/       # React contexts
│   ├── routes/         # Route configuration
│   ├── config/         # App configuration
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🎨 Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ React Router for navigation
- ✅ AWS Amplify for authentication
- ✅ Axios for API calls
- ✅ Path aliases for clean imports
- ✅ ESLint for code quality
- ✅ Responsive design
- ✅ Code splitting and lazy loading

## 🔐 Authentication

The app uses AWS Cognito for authentication:
- Email/password login
- User registration with email verification
- Protected routes
- Token refresh
- Secure session management

## 📱 Pages

1. **Login** - User authentication
2. **Register** - New user registration
3. **Dashboard** - Overview with metrics and charts
4. **Analyze** - Document upload and analysis
5. **History** - Document history with search and filters

## 🎯 API Integration

The frontend communicates with the backend API:
- Base URL: Configured in `.env`
- Authentication: JWT tokens from Cognito
- Endpoints: Upload, Documents, Metrics, Export

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

The build output will be in the `dist/` directory, ready to deploy to S3.

## 🚀 Deployment

### Deploy to S3

```bash
# Build the application
npm run build

# Upload to S3 bucket
aws s3 sync dist/ s3://document-analysis-web-520754296204-dev/ --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=https://your-api-url.com/dev
VITE_USER_POOL_ID=us-east-1_xxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
```

### Path Aliases

The following path aliases are configured:

- `@/` → `src/`
- `@components/` → `src/components/`
- `@pages/` → `src/pages/`
- `@services/` → `src/services/`
- `@hooks/` → `src/hooks/`
- `@types/` → `src/types/`
- `@utils/` → `src/utils/`

## 📚 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **AWS Amplify** - Authentication
- **Axios** - HTTP client
- **Jest** - Testing framework
- **fast-check** - Property-based testing

## 🎨 Design System

- **Colors**: White background with blue accents
- **Typography**: Inter font family
- **Components**: Reusable, accessible components
- **Responsive**: Mobile-first design

## 🐛 Troubleshooting

### Common Issues

1. **API connection fails**
   - Check `.env` file has correct API URL
   - Verify backend is deployed and running
   - Check CORS configuration

2. **Authentication fails**
   - Verify Cognito User Pool ID and Client ID
   - Check user exists in Cognito
   - Verify password meets requirements

3. **Build fails**
   - Run `npm install` to ensure dependencies are installed
   - Check for TypeScript errors with `npm run type-check`
   - Clear node_modules and reinstall if needed

## 📞 Support

For issues or questions:
- Check the main project README
- Review API documentation
- Check CloudWatch logs for backend errors

## 🎉 Next Steps

After setup:
1. Implement authentication UI (Task 22)
2. Create document upload interface (Task 23)
3. Build results display (Task 24)
4. Add dashboard with metrics (Task 25)
5. Implement history page (Task 26)
