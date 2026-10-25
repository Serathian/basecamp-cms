import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const NitfMedia: CollectionConfig = {
  slug: 'nitf_media',
  admin: {
    useAsTitle: 'filename',
    group: 'Nerd in the Forest',
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
  timestamps: true,
}
