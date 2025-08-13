// src/test/test-utils-functions.ts

// Helper function to create mock service responses
export const createMockServiceResponse = <T,>(data: T, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Mock error',
});

export const createMockListResponse = <T,>(data: T[], success = true) => ({
  success,
  data: success ? data : undefined,
  total: success ? data.length : undefined,
  error: success ? undefined : 'Mock error',
});

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));