import type { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfGearReviews: CollectionConfig = {
  slug: 'nitf_gear_reviews',
  admin: {
    useAsTitle: 'title',
    group: 'Nerd in the Forest',
    defaultColumns: ['title', 'gear_item', 'topic', 'published_at'],
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
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'gear_item',
      type: 'relationship',
      relationTo: 'nitf_gear_items',
      required: true,
    },
    {
      name: 'topic',
      type: 'select',
      required: true,
      options: [
        { label: 'Durability & Wear', value: 'durability' },
        { label: 'Thermal Dynamics', value: 'thermal' },
        { label: 'Maintenance & Care', value: 'maintenance' },
        { label: 'Surveyor Philosophy', value: 'philosophy' },
      ],
    },
    {
      name: 'published_at',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'duration_tested', type: 'text' },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'verdict', type: 'textarea', required: true },
    {
      name: 'key_takeaways',
      type: 'array',
      fields: [
        { name: 'takeaway', type: 'text', required: true },
      ],
    },
    { name: 'hero_image', type: 'upload', relationTo: 'nitf_media' },
    { name: 'content', type: 'richText' },
  ],
  timestamps: true,
}
