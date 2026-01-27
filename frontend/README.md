# Document Analysis Frontend

React 18+ application with TypeScript for the Document Analysis system.

## Features

- User authentication with Amazon Cognito
- Document upload with drag-and-drop
- Industry vertical selection (8 verticals)
- Real-time analysis results display
- Dashboard with usage metrics
- Document history with search and filters
- Export functionality (PDF, JSON, Excel, Word)
- Responsive design for desktop, tablet, and mobile

## Tech Stack

- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Authentication**: AWS Amplify Auth
- **Testing**: Jest + React Testing Library + fast-check
- **Styling**: CSS Modules (to be added)

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main App component
│   └── main.tsx           # Entry point
├── public/                # Static assets
└── index.html             # HTML template
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_ENDPOINT=https://your-api-gateway-url
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=us-east-1
VITE_CLOUDFRONT_DOMAIN=your-cloudfront-domain
```

## Color Palette

- **Background**: #FFFFFF (white)
- **Primary**: #000024 (dark blue)
- **Secondary**: #008FD0 (bright blue)
- **Accent**: #08BDBA (turquoise)

## Deployment

The frontend is deployed to S3 and distributed via CloudFront:

```bash
# Build the application
npm run build

# Deploy to S3 (done by CDK)
aws s3 sync dist/ s3://your-web-bucket-name/
```

## Testing Strategy

- **Unit Tests**: Test individual components and functions
- **Property-Based Tests**: Test universal properties with fast-check
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Test with jest-axe

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
