import type { User } from '@/payload-types'

export const checkRole = (allowedRoles: Array<'admin'>, user: User): boolean => {
  if (!user) return false
  // roles is now a single string 'admin' | null (not an array)
  return user.roles ? allowedRoles.includes(user.roles) : false
}
