import { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const RotrMedia: CollectionConfig = {
  slug: 'rotr_media',
  admin: {
    useAsTitle: 'filename',
    group: 'Reddy on the Road',
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
