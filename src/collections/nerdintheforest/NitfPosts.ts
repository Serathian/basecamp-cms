import type { CollectionConfig } from 'payload'
import getNearbyPosts from '@/lib/nearby'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfPosts: CollectionConfig = {
  slug: 'nitf_posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'published_at'],
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Adventure', value: 'adventure' },
        { label: 'Tips', value: 'tips' },
        { label: 'Recipe', value: 'recipe' },
        { label: 'Review', value: 'review' },
        { label: 'General', value: 'general' },
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
      filterOptions: { site: { equals: 'nerdintheforest' } },
    },
    {
      name: 'published_at',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'reading_time_minutes', type: 'number' },
    // Geo fields
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    { name: 'trail', type: 'relationship', relationTo: 'nitf_trails' },
    // Junction: ordered GPS stops per diary entry
    {
      name: 'locations',
      type: 'array',
      fields: [
        { name: 'location', type: 'relationship', relationTo: 'nitf_locations', required: true },
        { name: 'visit_date', type: 'date' },
      ],
    },
    // Type-specific meta (conditionally shown)
    {
      name: 'review_meta',
      type: 'json',
      admin: { condition: (data: any) => data.type === 'review' },
    },
    {
      name: 'recipe_meta',
      type: 'json',
      admin: { condition: (data: any) => data.type === 'recipe' },
    },
    { name: 'seo_title', type: 'text' },
    { name: 'seo_description', type: 'textarea' },
  ],
  endpoints: [
    {
      path: '/nearby',
      method: 'get',
      handler: async (req: any) => {
        const url = new URL(req.url || '', 'http://localhost')
        const lat = parseFloat(url.searchParams.get('lat') || '')
        const lon = parseFloat(url.searchParams.get('lon') || '')
        const radius = parseInt(url.searchParams.get('radius') || '50000', 10)

        if (isNaN(lat) || isNaN(lon)) {
          return Response.json(
            { error: 'lat and lon query parameters are required' },
            { status: 400 },
          )
        }

        return getNearbyPosts(lat, lon, radius, req.payload.db)
      },
    },
  ],
  timestamps: true,
}
