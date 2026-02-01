import { describe, it, expect, vi } from 'vitest';
import { updateProfileAction } from '../actions';

// Mock the DB call delay and revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: () => Promise.resolve({ get: () => '127.0.0.1' }),
}));

describe('Profile Server Actions', () => {
  it('should reject invalid student IDs', async () => {
    const invalidData = {
      name: 'Raouf',
      studentId: '123', // Too short (needs 8 digits)
      course: 'Cyber Security',
      year: '1st Year',
    };

    const result = await updateProfileAction('user-1', invalidData);

    expect(result.success).toBe(false);
    expect(result).toHaveProperty('error');
    if ('error' in result && typeof result.error === 'object' && result.error) {
      expect(result.error).toHaveProperty('studentId');
    }
  });

  it('should accept valid data', async () => {
    const validData = {
      name: 'Raouf',
      studentId: '12345678',
      course: 'Cyber Security',
      year: '1st Year',
    };

    const result = await updateProfileAction('user-1', validData);

    expect(result.success).toBe(true);
  });
});
