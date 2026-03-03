import { checkRole } from './checkrole'

const editor = ({ req: { user } }: any) => {
  if (user) {
    if (checkRole(['admin', 'editor'], user)) {
      return true
    }
  }

  return false
}

export default editor
