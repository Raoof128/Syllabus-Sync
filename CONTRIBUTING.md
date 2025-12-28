# Contributing

Thanks for your interest in contributing to The Syllabus Sync.

## Quick Start

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

## Development Standards

- Use TypeScript and keep types explicit and accurate.
- Keep components small and focused.
- Avoid UI changes without updating screenshots or docs if needed.
- Keep changes minimal and aligned with existing design patterns.

## Required Checks

Run these before pushing:

```bash
npm run lint
npm run test
npm run format:check
```

`npm run lint` prints `Lint OK` on success.

## Commit Messages

Use Conventional Commits:

```
feat: add unit form validation
fix: handle empty deadlines in store
docs: update lint instructions
```

## Pull Requests

- Describe the change and motivation.
- Link relevant issues if applicable.
- Include screenshots for UI changes.
- Confirm lint/tests pass.

## Reporting Issues

Please include:

- Steps to reproduce
- Expected vs actual behavior
- Screenshots or logs if helpful

Thank you for contributing.
