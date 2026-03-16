import { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfDestinations: CollectionConfig = {
  slug: 'nitf_destinations',
  defaultSort: 'name',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'difficulty', 'status'],
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
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    {
      name: 'featured_image',
      type: 'upload',
      relationTo: 'nitf_media',
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'url', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'difficulty',
      type: 'select',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Hard', value: 'hard' },
        { label: 'Expert', value: 'expert' },
      ],
    },
    { name: 'season_info', type: 'textarea' },
    {
      name: 'published_at',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
