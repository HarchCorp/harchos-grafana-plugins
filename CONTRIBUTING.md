# Contributing to HarchOS Grafana Plugins

Thank you for your interest in contributing to HarchOS Grafana Plugins! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to uphold the [HarchCorp Code of Conduct](https://harchcorp.io/conduct). Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Grafana >= 10.0 (for testing)
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/<your-username>/harchos-grafana-plugins.git
cd harchos-grafana-plugins

# Install dependencies
npm install

# Create a branch for your changes
git checkout -b feature/your-feature-name
```

### Development Workflow

1. Make your changes in a feature branch
2. Ensure all checks pass:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
3. Commit your changes with a descriptive message
4. Push to your fork and open a Pull Request

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring without behavior change
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `ci`: CI/CD changes
- `chore`: Build process, dependencies, tooling

**Examples:**
```
feat(datasource): add support for SovereigntyQL queries
fix(gpu-panel): correct temperature threshold color mapping
docs(readme): update installation instructions
ci(workflow): add Node.js 20 to test matrix
```

## Pull Request Process

1. **Update documentation** if your changes affect user-facing features
2. **Add tests** for new functionality
3. **Ensure CI passes** — all checks must be green
4. **Request review** from the appropriate team (see CODEOWNERS)
5. **Squash commits** if requested during review

### PR Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Refactoring

## Testing
[How was this tested?]

## Checklist
- [ ] Code follows project style guidelines (lint passes)
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Code Style

### TypeScript

- Use strict TypeScript configuration
- Prefer `interface` for object types, `type` for unions/intersections
- Use `enum` for fixed sets of values
- Export all public types and interfaces
- Use `readonly` for immutable properties where appropriate

### React

- Use class components for panel/data source editors (Grafana SDK convention)
- Use functional components with hooks for simpler UI parts
- Keep component state minimal; derive from props when possible
- Use `@grafana/ui` components for consistency

### Naming Conventions

- Files: `kebab-case.tsx` or `kebab-case.ts`
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Enums: `PascalCase` for enum name, `PascalCase` for values

### File Organization

```
src/
├── datasource/          # Data source plugin files
│   ├── datasource.ts    # Main class
│   ├── types.ts         # Types and enums
│   ├── query.ts         # Query logic
│   ├── config-editor.tsx
│   ├── query-editor.tsx
│   ├── module.ts        # Entry point
│   └── plugin.json
├── panels/
│   └── panel-name/
│       ├── panel.tsx    # Main component
│       ├── types.ts     # Options and types
│       ├── module.tsx   # Entry point with options
│       └── plugin.json
└── dashboards/          # JSON dashboard templates
```

## Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Run tests in CI mode with coverage
npm run test:ci

# Run specific test file
npx jest src/datasource/query.test.ts
```

### Manual Testing

1. Build the plugin: `npm run build`
2. Copy `dist/` to your Grafana plugins directory
3. Configure the HarchOS data source
4. Test all panel plugins with real data

### Testing with Docker

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/dist:/var/lib/grafana/plugins/harchos-grafana-plugins \
  -e "GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=harchos-datasource,harchos-gpu-utilization-panel,harchos-carbon-metrics-panel,harchos-hub-health-panel,harchos-workload-distribution-panel" \
  grafana/grafana:latest
```

## Reporting Issues

### Bug Reports

Please include:
- Grafana version
- Plugin version
- Steps to reproduce
- Expected vs. actual behavior
- Browser console errors (if applicable)
- Screenshots (if applicable)

### Feature Requests

Please include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Additional context

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

## Questions?

- Open an issue on [GitHub](https://github.com/HarchCorp/harchos-grafana-plugins/issues)
- Join the [HarchCorp Community](https://community.harchcorp.io)
- Email: oss@harchcorp.io
