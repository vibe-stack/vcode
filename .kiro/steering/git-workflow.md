# Git Workflow Standards

## Branch Strategy
- Use feature branches for all development work
- Follow naming convention: `feature/description`, `bugfix/description`, `hotfix/description`
- Keep branches focused on single features or fixes
- Delete branches after merging

## Commit Messages
- Use conventional commit format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Keep first line under 50 characters
- Use imperative mood ("add" not "added")
- Include detailed body for complex changes

## Pull Request Process
- Create PR from feature branch to main/develop
- Include clear description of changes
- Reference related issues or tickets
- Ensure CI/CD passes before requesting review
- Require at least one approval before merging

## Code Review Guidelines
- Review for logic, readability, and maintainability
- Check for proper error handling
- Verify tests are included and passing
- Ensure documentation is updated
- Leave constructive feedback

## Merge Strategy
- Use squash and merge for feature branches
- Use merge commits for release branches
- Maintain clean commit history
- Tag releases appropriately