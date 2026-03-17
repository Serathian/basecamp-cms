import { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfPlaces: CollectionConfig = {
  slug: 'nitf_places',
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'poi', 'status'],
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
      name: 'cover_image',
      type: 'upload',
      relationTo: 'nitf_media',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'nitf_tags',
      hasMany: true,
    },
    {
      name: 'poi',
      type: 'relationship',
      relationTo: 'nitf_poi',
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
