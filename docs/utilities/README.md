# Utilities Documentation

Helper utilities for data cleanup, testing, and development tasks.

## Documents

### 1. [CLEANUP_DATA.md](./CLEANUP_DATA.md)
**Data cleanup utility for development**
- Purpose and features
- Usage examples
- API reference
- Production safety
- Troubleshooting

### 2. [CASCADING_TEST_PLAN.md](./CASCADING_TEST_PLAN.md)
**Testing strategy and test plans**
- Test structure
- Test cases
- Execution procedures
- Validation steps

## Quick Links

| Utility | Purpose |
|---------|---------|
| Cleanup Data | Delete objectives, KPIs, submissions safely |
| Cascading Tests | Comprehensive test plan for features |

## Usage

### Data Cleanup
```typescript
import { cleanupAllData, quickCleanup } from '@/utils/cleanup-data';

// Quick cleanup everything
await quickCleanup(apolloClient);

// Or with options
await cleanupAllData(apolloClient, {
  deleteObjectives: true,
  deleteKpis: true,
  deleteSubmissions: true,
  verbose: true
});
```

## Related Documentation

- **Schema Generation:** See [docs/schema-generation/](../schema-generation/) for GraphQL setup
- **Getting Started:** See [docs/getting-started/](../getting-started/) for project overview
- **Data Validation:** See [docs/data-validation/](../data-validation/) for validation rules
