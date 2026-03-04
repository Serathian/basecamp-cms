import type { CollectionConfig } from 'payload'
import editor from '../users/access/editor'
import published from '../users/access/published'

export const JrPosts: CollectionConfig = {
  slug: 'jr_posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'published_at'],
  },
  access: {
    read: published,
    create: editor,
    update: editor,
    delete: editor,
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
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'textarea' },
    { name: 'cover_image', type: 'upload', relationTo: 'media' },
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      filterOptions: { site: { equals: 'jake-reddy' } },
    },
    {
      name: 'published_at',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'reading_time_minutes', type: 'number' },
    { name: 'seo_title', type: 'text' },
    { name: 'seo_description', type: 'textarea' },
  ],
  timestamps: true,
}
