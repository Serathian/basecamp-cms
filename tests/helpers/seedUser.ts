import { getPayload } from 'payload'
import config from '../../src/payload.config'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Ensures test user exists for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Check if test user exists
  const existing = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
    limit: 1,
  })

  if (existing.docs.length === 0) {
    // Create fresh test user
    await payload.create({
      collection: 'users',
      data: {
        ...testUser,
        roles: 'admin',
      },
    })
  }
}

/**
 * Cleans up test user after tests if explicitly needed
 */
export async function cleanupTestUser(): Promise<void> {
  // Keep dev user intact for local dev and repeated testing
}
