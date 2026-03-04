import type { Access } from 'payload'

const published: Access = ({ req: { user } }) => {
  if (!user) return { status: { equals: 'published' } }
  return true
}

export default published
