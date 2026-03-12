import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      saveToJWT: true,
      defaultValue: 'admin',
      options: [{ label: 'Admin', value: 'admin' }],
    },
  ],
}
