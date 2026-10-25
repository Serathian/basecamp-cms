import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const NitfAreas: CollectionConfig = {
  slug: 'nitf_areas',
  admin: {
    useAsTitle: 'name',
    group: 'Nerd in the Forest',
    defaultColumns: ['name', 'slug', 'country'],
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
    { name: 'country', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'center_latitude', type: 'number', required: true },
    { name: 'center_longitude', type: 'number', required: true },
    { name: 'default_zoom', type: 'number', defaultValue: 10 },
    { name: 'hero_image', type: 'upload', relationTo: 'nitf_media' },
  ],
  timestamps: true,
}
