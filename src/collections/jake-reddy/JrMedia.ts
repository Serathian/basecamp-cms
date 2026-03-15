import { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const JrMedia: CollectionConfig = {
  slug: 'jr_media',
  admin: {
    useAsTitle: 'filename',
    group: 'Jake Reddy',
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [{ name: 'alt', type: 'text', required: true }],
  upload: true,
}
