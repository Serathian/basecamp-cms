import type { CollectionConfig } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const RotrPosts: CollectionConfig = {
  slug: 'rotr_posts',
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
  hooks: {
    afterChange: [
      async ({ doc, req }: any) => {
        if (doc.latitude != null && doc.longitude != null) {
          const txID = req.transactionID
          const db = txID
            ? ((req.payload.db as any).sessions[await txID]?.db ?? (req.payload.db as any).drizzle)
            : (req.payload.db as any).drizzle
          await db.execute(sql`
            UPDATE rotr_posts
            SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
            WHERE id = ${doc.id}
          `)
        }
        return doc
      },
    ],
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
    { name: 'cover_image', type: 'upload', relationTo: 'rotr_media' },
    { name: 'author', type: 'relationship', relationTo: 'authors' },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'rotr_tags',
      hasMany: true,
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
