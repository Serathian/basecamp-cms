import { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfTrips: CollectionConfig = {
  slug: 'nitf_trips',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'destination', 'status', 'date_range__start_date'],
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
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'body', type: 'textarea' },
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'nitf_destinations',
    },
    {
      name: 'cover_image',
      type: 'upload',
      relationTo: 'nitf_media',
    },
    {
      name: 'date_range',
      type: 'group',
      fields: [
        { name: 'start_date', type: 'date' },
        { name: 'end_date', type: 'date' },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'nitf_tags',
      hasMany: true,
    },
    {
      name: 'pois',
      type: 'relationship',
      relationTo: 'nitf_poi',
      hasMany: true,
    },
    {
      name: 'published_at',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
