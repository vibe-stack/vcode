# Frontend Development Standards

## React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization when needed
- Follow component composition patterns
- Keep components focused and single-responsibility

## TypeScript Standards
- Use strict TypeScript configuration
- Define explicit types for props and state
- Use interfaces for object shapes
- Avoid `any` type - use proper typing
- Export types alongside components

## Code Organization
- Group related components in folders
- Use index.ts files for clean imports
- Separate business logic from presentation
- Keep components under 200 lines when possible
- Use custom hooks for shared logic

## Styling
- Use CSS modules or styled-components for scoped styles
- Follow BEM methodology for class names
- Use CSS variables for theme values
- Implement responsive design patterns
- Maintain consistent spacing and typography

## Performance
- Implement code splitting for large applications
- Use React.lazy for dynamic imports
- Optimize images and assets
- Minimize bundle size
- Use memoization appropriately