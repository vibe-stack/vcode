# Development Environment Standards

## Required Tools
- Node.js (latest LTS version)
- npm or pnpm for package management
- Git for version control
- VS Code or WebStorm as IDE
- Docker for containerization

## IDE Configuration
- Install recommended extensions
- Use workspace settings for consistency
- Configure linting and formatting on save
- Set up debugging configurations
- Use consistent tab/space settings

## Local Development Setup
- Use environment variables for configuration
- Set up local database instances
- Configure hot reload for development
- Use local SSL certificates for HTTPS
- Implement proper logging levels

## Testing Environment
- Separate test database from development
- Use test fixtures and factories
- Mock external services in tests
- Run tests in CI/CD pipeline
- Maintain test data cleanup

## Build Process
- Use consistent build scripts across projects
- Implement proper environment configurations
- Use sourcemaps for debugging
- Optimize for different deployment targets
- Cache dependencies appropriately

## Common Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript checks