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
    // Metadata
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

    // Content
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'textarea' },

    // Media
    { name: 'cover_image', type: 'upload', relationTo: 'jr_media' },

    // Project-specific fields (all optional)
    {
      name: 'project_type',
      type: 'select',
      options: [
        { label: 'Open Source', value: 'open-source' },
        { label: 'Personal', value: 'personal' },
        { label: 'Home Lab', value: 'home-lab' },
        { label: 'Professional', value: 'professional' },
      ],
    },
    {
      name: 'project_status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'tech_stack', type: 'json' },
    { name: 'github_url', type: 'text' },
    { name: 'live_url', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'sort', type: 'number' },

    // Taxonomy
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'jr_tags',
      hasMany: true,
    },

    // SEO
    { name: 'reading_time_minutes', type: 'number' },
    { name: 'seo_title', type: 'text' },
    { name: 'seo_description', type: 'textarea' },
  ],
  timestamps: true,
}
