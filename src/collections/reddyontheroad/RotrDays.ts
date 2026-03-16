import { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const RotrDays: CollectionConfig = {
  slug: 'rotr_days',
  defaultSort: '-date',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'location_name', 'status'],
    group: 'Reddy on the Road',
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
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
    { name: 'date', type: 'date' },
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    { name: 'location_name', type: 'text' },
    {
      name: 'location_type',
      type: 'relationship',
      // rotr_place_types will be in CollectionSlug after types are regenerated (04-02/04-03)
      relationTo: 'rotr_place_types' as any,
    },
    { name: 'weather', type: 'text' },
    { name: 'temperature', type: 'number' },
    { name: 'summary', type: 'textarea' },
    { name: 'content', type: 'textarea' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'rotr_tags',
      hasMany: true,
    },
  ],
  timestamps: true,
}
