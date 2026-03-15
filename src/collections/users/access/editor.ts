import { checkRole } from './checkrole'

const editor = ({ req: { user } }: any) => {
  if (user) {
    // Only admin role exists now (editor role removed in Phase 1)
    if (checkRole(['admin'], user)) {
      return true
    }
  }

  return false
}

export default editor
