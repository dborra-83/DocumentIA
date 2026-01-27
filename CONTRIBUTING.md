# Contributing to DocumentIA

Thank you for your interest in contributing to DocumentIA! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/DocumentIA.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## Development Setup

See the [README.md](README.md) for detailed setup instructions.

### Prerequisites

- Node.js 18+
- Python 3.12+
- AWS CLI configured
- AWS CDK CLI

### Install Dependencies

```bash
# Infrastructure
cd infrastructure && npm install

# Backend
cd ../backend && pip install -r requirements.txt

# Frontend
cd ../frontend && npm install
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write tests for new features

### Python

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions and classes
- Write tests for new features
- Use meaningful variable and function names

### Testing

- Write unit tests for all new code
- Write property-based tests for universal properties
- Ensure all tests pass before submitting PR
- Aim for 80%+ code coverage

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add document export functionality
fix: Resolve authentication token refresh issue
docs: Update deployment guide
test: Add property tests for file validation
refactor: Simplify Bedrock prompt construction
```

Prefixes:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or changes
- `refactor`: Code refactoring
- `style`: Code style changes (formatting, etc.)
- `chore`: Maintenance tasks

## Pull Request Process

1. **Update Documentation**: Update README.md and relevant docs if needed
2. **Add Tests**: Include tests for new features or bug fixes
3. **Run Tests**: Ensure all tests pass locally
4. **Update CHANGELOG**: Add entry describing your changes
5. **Request Review**: Tag relevant maintainers for review
6. **Address Feedback**: Respond to review comments promptly
7. **Squash Commits**: Squash commits before merging if requested

### PR Title Format

```
[Type] Brief description of changes

Example:
[Feature] Add PDF export functionality
[Fix] Resolve authentication timeout issue
[Docs] Update API documentation
```

## Testing Guidelines

### Unit Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Infrastructure tests
cd infrastructure
npm test
```

### Property-Based Tests

- Use `hypothesis` for Python
- Use `fast-check` for TypeScript
- Run minimum 100 iterations
- Include property reference in comments

### Integration Tests

```bash
cd tests
pytest integration/ -v
```

### E2E Tests

```bash
cd tests/e2e
npm test
```

## Documentation

- Update README.md for user-facing changes
- Update docs/ for architectural or deployment changes
- Add inline comments for complex logic
- Update API documentation for endpoint changes

## Issue Reporting

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and benefits
- Proposed implementation (optional)
- Alternatives considered

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

### Review Criteria

- Code quality and style
- Test coverage
- Documentation completeness
- Performance considerations
- Security implications
- Backward compatibility

## Release Process

1. Update version in package.json files
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Deploy to staging
6. Perform manual testing
7. Create GitHub release
8. Deploy to production
9. Announce release

## Questions?

- Open an issue for questions
- Join our discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to DocumentIA!
