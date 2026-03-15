import { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const RotrTags: CollectionConfig = {
  slug: 'rotr_tags',
  admin: {
    useAsTitle: 'name',
    group: 'Reddy on the Road',
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
