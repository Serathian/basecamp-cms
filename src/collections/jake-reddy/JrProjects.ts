import type { CollectionConfig } from 'payload'

export const JrProjects: CollectionConfig = {
  slug: 'jr_projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'project_status', 'featured'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return { status: { equals: 'published' } }
      return true
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
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
    { name: 'summary', type: 'textarea' },
    { name: 'body', type: 'textarea' },
    { name: 'cover_image', type: 'upload', relationTo: 'media' },
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
    { name: 'start_date', type: 'date' },
    { name: 'end_date', type: 'date' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'sort', type: 'number' },
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      filterOptions: { site: { equals: 'jake-reddy' } },
    },
  ],
  timestamps: true,
}
