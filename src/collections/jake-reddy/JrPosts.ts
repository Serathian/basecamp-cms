import type { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const JrPosts: CollectionConfig = {
  slug: 'jr_posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'published_at'],
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
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'published_at',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'textarea' },
    { name: 'cover_image', type: 'upload', relationTo: 'jr_media' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'tags',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
      ],
    },
    { name: 'reading_time_minutes', type: 'number' },
    { name: 'seo_title', type: 'text' },
    { name: 'seo_description', type: 'textarea' },
  ],
  timestamps: true,
}
