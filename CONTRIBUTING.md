# Contributing to Lucent

Thank you for your interest in contributing to Lucent! This document provides guidelines and instructions for contributing to our state management library.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Requests](#pull-requests)
- [Release Process](#release-process)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/lucent.git
   cd lucent
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- TypeScript (v4 or higher)

### Development Workflow

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run tests:
   ```bash
   npm test
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Project Structure

```
lucent/
├── src/
│   ├── core/         # Core state management logic
│   ├── utils/        # Utility functions and helpers
│   ├── types/        # TypeScript type definitions
│   ├── stores/       # Example store implementations
│   └── hooks/        # Custom React hooks
├── docs/             # Documentation
├── examples/         # Example applications
└── tests/            # Test files
```

## Making Changes

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use proper error handling

### TypeScript Guidelines

- Always provide type definitions
- Use strict mode
- Avoid `any` type
- Use proper generics
- Document complex types

### Example Contribution

```typescript
/**
 * Creates a new store with the given configuration
 * @param name - Unique identifier for the store
 * @param initialState - Initial state of the store
 * @param options - Configuration options
 */
export function createStore<T>(
  name: string,
  initialState: T,
  options?: StoreOptions
) {
  // Implementation
}
```

## Testing

### Writing Tests

- Use Jest for testing
- Follow AAA pattern (Arrange, Act, Assert)
- Test both success and error cases
- Mock external dependencies
- Use meaningful test names

### Example Test

```typescript
describe("createStore", () => {
  it("should create a store with initial state", () => {
    // Arrange
    const initialState = { count: 0 };

    // Act
    const store = createStore("test", initialState);

    // Assert
    expect(store.getState()).toEqual(initialState);
  });
});
```

## Documentation

### Writing Documentation

- Keep documentation up to date
- Use clear and concise language
- Include code examples
- Document edge cases
- Update README.md for major changes

### Example Documentation

````markdown
## Feature Name

Description of the feature.

### Usage

```typescript
// Example code
const store = createStore("example", initialState);
```
````

### Options

- `option1`: Description
- `option2`: Description

```

## Pull Requests

### Creating a Pull Request
1. Ensure your branch is up to date
2. Run tests and build
3. Create a detailed PR description
4. Reference related issues
5. Request reviews from maintainers

### PR Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] Build successful

## Release Process

### Versioning
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Update CHANGELOG.md
- Create release notes
- Tag the release

### Publishing
1. Update version in package.json
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Publish to npm

## Questions?

Feel free to open an issue or contact the maintainers if you have any questions about contributing to Lucent.

## License

By contributing to Lucent, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
```
