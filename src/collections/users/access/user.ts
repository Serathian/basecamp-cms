import { checkRole } from './checkrole'

// In user.ts, the checkRole function is used to determine if the current user is an admin or editor. If so, they’re granted full access; otherwise, access is limited to their own user record.

const user = ({ req: { user } }: any) => {
  if (user) {
    if (checkRole(['admin', 'editor'], user)) {
      return true
    }

    return {
      id: { equals: user.id },
    }
  }

  return false
}

export default user
