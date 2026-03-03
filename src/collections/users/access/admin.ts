import { checkRole } from './checkrole'

const admin = ({ req: { user } }: any) => {
  if (user) {
    if (checkRole(['admin'], user)) {
      return true
    }
  }

  return false
}

export default admin
