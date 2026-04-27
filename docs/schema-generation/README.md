# Schema Generation Documentation

Complete guide to the GraphQL schema generation system, including setup, workflow, and best practices.

## Overview

This folder contains comprehensive documentation for the automated GraphQL schema generation system that:
- Fetches schema from local/remote APIs
- Generates organized query/mutation/fragment files
- Provides type-safe GraphQL operations
- Ensures production safety with automatic cleanup in development only

## Documents

### 1. [QUICK_START.md](./QUICK_START.md)
**Start here if you're in a hurry**
- One-command setup
- File structure overview
- Usage examples
- Environment variables
- Troubleshooting

### 2. [COMPLETE_SYSTEM.md](./COMPLETE_SYSTEM.md)
**Comprehensive system documentation**
- System architecture
- All available scripts
- File structure details
- Production safety features
- Workflow examples
- Configuration files
- Best practices

### 3. [DETAILED_GUIDE.md](./DETAILED_GUIDE.md)
**Deep dive into implementation**
- Technical architecture
- How each script works
- Type system integration
- Error handling
- Advanced configuration

### 4. [WORKFLOW.md](./WORKFLOW.md)
**Daily development workflow**
- Common tasks
- Step-by-step procedures
- Integration with development
- CI/CD integration
- Team collaboration

### 5. [RULES.md](./RULES.md)
**Team standards and rules**
- 20 core team rules
- Naming conventions
- File organization standards
- Code quality standards
- Production safety rules

### 6. [VISUAL_GUIDE.md](./VISUAL_GUIDE.md)
**Visual diagrams and flowcharts**
- System architecture diagrams
- Data flow diagrams
- File structure trees
- Process flowcharts
- Decision trees

### 7. [CHECKLIST.md](./CHECKLIST.md)
**Quick reference checklist**
- Pre-generation checklist
- Post-generation checklist
- Troubleshooting checklist
- Production deployment checklist
- Quick reference tables

### 8. [CLEANUP_GUIDE.md](./CLEANUP_GUIDE.md)
**Cleanup and maintenance**
- When to clean up
- How cleanup works
- Manual cleanup procedures
- Troubleshooting cleanup issues
- Production considerations

## Quick Links

| Need | Document |
|------|----------|
| Get started quickly | [QUICK_START.md](./QUICK_START.md) |
| Understand everything | [COMPLETE_SYSTEM.md](./COMPLETE_SYSTEM.md) |
| Learn how it works | [DETAILED_GUIDE.md](./DETAILED_GUIDE.md) |
| Daily tasks | [WORKFLOW.md](./WORKFLOW.md) |
| Team standards | [RULES.md](./RULES.md) |
| Visual overview | [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) |
| Quick reference | [CHECKLIST.md](./CHECKLIST.md) |
| Cleanup issues | [CLEANUP_GUIDE.md](./CLEANUP_GUIDE.md) |

## Key Concepts

### One-Command Generation
```bash
pnpm run schema:fetch
```
This single command:
1. Fetches schema from API
2. Cleans old files (dev only)
3. Generates organized structure
4. Runs code generation

### File Organization
```
src/graphql/
├── queries/        (GET operations)
├── mutations/      (CREATE, UPDATE, DELETE)
└── fragments/      (Reusable field sets)
```

### Production Safety
- ✅ Development: Full cleanup and regeneration
- ✅ Production: Only code generation, no cleanup

## Getting Help

1. **Quick answer?** → [QUICK_START.md](./QUICK_START.md)
2. **How does it work?** → [DETAILED_GUIDE.md](./DETAILED_GUIDE.md)
3. **What's the process?** → [WORKFLOW.md](./WORKFLOW.md)
4. **Need a checklist?** → [CHECKLIST.md](./CHECKLIST.md)
5. **Cleanup issues?** → [CLEANUP_GUIDE.md](./CLEANUP_GUIDE.md)
6. **Team standards?** → [RULES.md](./RULES.md)

## Related Documentation

- **Utilities:** See [docs/utilities/](../utilities/) for data cleanup utilities
- **Getting Started:** See [docs/getting-started/](../getting-started/) for project overview
- **Data Validation:** See [docs/data-validation/](../data-validation/) for validation rules
