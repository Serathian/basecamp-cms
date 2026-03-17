import { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfPoi: CollectionConfig = {
  slug: 'nitf_poi',
  defaultSort: 'name',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'latitude', 'longitude'],
    group: 'Nerd in the Forest',
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
  timestamps: true,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'latitude', type: 'number', required: true },
    { name: 'longitude', type: 'number', required: true },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'nitf_poi_types',
    },
    {
      name: 'trips',
      type: 'relationship',
      relationTo: 'nitf_trips',
      hasMany: true,
    },
    {
      name: 'place',
      type: 'relationship',
      relationTo: 'nitf_places',
    },
  ],
}
