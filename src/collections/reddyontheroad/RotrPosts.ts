import type { CollectionConfig } from 'payload'

export const RotrPosts: CollectionConfig = {
  slug: 'rotr_posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'published_at'],
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
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Story', value: 'story' },
        { label: 'Guide', value: 'guide' },
        { label: 'Tips', value: 'tips' },
        { label: 'Listicle', value: 'listicle' },
      ],
    },
    { name: 'excerpt', type: 'textarea' },
    { name: 'body', type: 'textarea' },
    { name: 'cover_image', type: 'upload', relationTo: 'media' },
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      filterOptions: { site: { equals: 'reddyontheroad' } },
    },
    // Geo fields
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    // Junction: ordered GPS stops for the week
    {
      name: 'locations',
      type: 'array',
      fields: [
        { name: 'location', type: 'relationship', relationTo: 'rotr_locations', required: true },
        { name: 'visit_date', type: 'date' },
      ],
    },
    {
      name: 'published_at',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'seo_title', type: 'text' },
    { name: 'seo_description', type: 'textarea' },
    { name: 'wp_post_id', type: 'number' },
  ],
  timestamps: true,
}
