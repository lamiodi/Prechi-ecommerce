# Test Suite Documentation

## Overview

This project has been restructured to provide a minimal but effective test suite that new clients can easily understand and extend. The test suite focuses on core functionality while removing client-specific data and configurations.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
├── integration/             # Integration tests for complete workflows
└── e2e/                     # End-to-end tests (placeholder for future expansion)
```

## Available Test Scripts

### Backend Tests

From the `Backend/` directory:

```bash
# Run size logic validation test
npm run test

# Run order creation test
npm run test:order

# Run comprehensive bundle test
npm run test:bundle

# Run all tests
npm run test:all
```

### Individual Test Files

#### 1. Size Logic Test (`tests/integration/test_size_logic.js`)
- **Purpose**: Validates that size and note logic works correctly from checkout to admin
- **What it tests**:
  - Sample order size data validation
  - Recent orders size completeness
  - Order notes functionality
- **Usage**: `npm run test`

#### 2. Order Creation Test (`tests/integration/test_order_creation.js`)
- **Purpose**: Tests the order creation process with bundle items
- **What it tests**:
  - Bundle processing logic
  - Order item structure
  - Database insertion preparation
- **Usage**: `npm run test:order`

#### 3. Comprehensive Bundle Test (`tests/integration/comprehensive_bundle_test.js`)
- **Purpose**: End-to-end testing of the complete bundle flow
- **What it tests**:
  - Cart to order workflow
  - Bundle item processing
  - Frontend to backend data flow
- **Usage**: `npm run test:bundle`

## Test Dependencies

### Backend Dependencies
- `jest`: Testing framework
- `supertest`: HTTP assertion library

### Frontend Dependencies
- No test dependencies currently configured (ready for client-specific setup)

## Running Tests

### Prerequisites
1. Ensure all environment variables are properly configured
2. Database connection is established
3. Required dependencies are installed: `npm install`

### Test Execution
```bash
# Install dependencies
cd Backend && npm install

# Run all tests
npm run test:all

# Run individual tests
npm run test         # Size logic test
npm run test:order   # Order creation test
npm run test:bundle  # Bundle flow test
```

## Test Results

All tests should pass with 100% success rate. If any test fails:

1. Check the console output for specific error messages
2. Verify database connection and data integrity
3. Ensure all required environment variables are set
4. Check that the database schema matches expected structure

## Extending the Test Suite

### Adding New Tests

1. **Unit Tests**: Add to `tests/unit/` directory
   ```javascript
   // Example unit test
   import { describe, test, expect } from '@jest/globals';
   
   describe('Your Function', () => {
     test('should do something specific', () => {
       expect(yourFunction(input)).toBe(expectedOutput);
     });
   });
   ```

2. **Integration Tests**: Add to `tests/integration/` directory
   ```javascript
   // Example integration test
   import sql from '../db/index.js';
   
   async function testYourFeature() {
     // Your test logic here
   }
   ```

### Test Naming Conventions

- Unit tests: `featureName.test.js`
- Integration tests: `featureNameIntegration.js`
- Use descriptive function names that explain what is being tested

## Mock Data Guidelines

When creating tests:

1. **Use generic data** instead of client-specific information
2. **Avoid hardcoded IDs** when possible
3. **Create fallback mock data** for cases where database records don't exist
4. **Use descriptive placeholder names** (e.g., "Test Product", "Test Bundle")

## Environment Configuration

Tests use the same environment configuration as the main application. Ensure your `.env` file contains:

- Database connection details
- API keys (if required for tests)
- Any other configuration needed for your specific setup

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check connection string in environment variables
   - Ensure database exists and is accessible

2. **Module Import Errors**
   - Check that all dependencies are installed
   - Verify file paths are correct
   - Ensure ES module syntax is used correctly

3. **Test Timeouts**
   - Increase timeout for database-heavy tests
   - Check network connectivity
   - Verify database performance

### Debug Mode

Run tests with debug output:
```bash
DEBUG=test* npm run test
```

## Security Considerations

- **Never commit sensitive data** to test files
- **Use environment variables** for configuration
- **Sanitize any proprietary information** before creating tests
- **Review test output** to ensure no sensitive data is logged

## Future Enhancements

The test suite is designed to be easily extensible. Consider adding:

- **Frontend component tests** using React Testing Library
- **API endpoint tests** using supertest
- **Performance tests** for critical workflows
- **Security tests** for authentication and authorization
- **Database migration tests** to ensure schema compatibility

## Support

For questions about the test suite or help with extending it:

1. Review this documentation first
2. Check existing test files for examples
3. Ensure your development environment matches the project requirements
4. Run tests individually to isolate issues

---

**Note**: This test suite represents approximately 10-20% of the original test scripts, focusing on core functionality that new clients need to verify system integrity. The modular structure allows for easy expansion based on specific client requirements.