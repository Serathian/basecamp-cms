import { checkRole } from './checkrole'

// In user.ts, the checkRole function is used to determine if the current user is an admin. If so, they're granted full access; otherwise, access is limited to their own user record.

const user = ({ req: { user } }: any) => {
  if (user) {
    // Only admin role exists now (editor role removed in Phase 1)
    if (checkRole(['admin'], user)) {
      return true
    }

    return {
      id: { equals: user.id },
    }
  }

  return false
}

export default user
