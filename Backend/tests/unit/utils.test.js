// Basic test example for backend functionality
describe('Basic Backend Tests', () => {
  test('should pass a simple test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle string operations', () => {
    const testString = 'Hello World';
    expect(testString.toUpperCase()).toBe('HELLO WORLD');
  });

  test('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    const doubled = numbers.map(n => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });
});