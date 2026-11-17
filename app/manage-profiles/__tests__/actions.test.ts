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
  it('should accept valid data', async () => {
    const validData = {
      name: 'Raouf',
      faculty: 'Science',
      course: 'Cyber Security',
      year: '1st Year',
    };

    const result = await updateProfileAction('user-1', validData);

    expect(result.success).toBe(true);
  });
});
