import { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const JrTags: CollectionConfig = {
  slug: 'jr_tags',
  admin: {
    useAsTitle: 'name',
    group: 'Jake Reddy',
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
}
