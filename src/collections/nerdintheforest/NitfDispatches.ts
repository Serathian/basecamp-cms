import type { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const NitfDispatches: CollectionConfig = {
  slug: 'nitf_dispatches',
  admin: {
    useAsTitle: 'title',
    group: 'Nerd in the Forest',
    defaultColumns: ['title', 'status', 'published_at', 'locations'],
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
      admin: {
        description: 'Date and time the article was published',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'start_date',
      type: 'date',
      admin: {
        description: 'Start date of the field expedition / hike',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'end_date',
      type: 'date',
      admin: {
        description: 'End date of the field expedition (leave empty or same as start date for single-day outings)',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'nitf_locations',
      hasMany: true,
      admin: {
        description: 'Select all surveyed locations passed or visited during this hike',
      },
    },
    {
      name: 'loadout',
      type: 'relationship',
      relationTo: 'nitf_loadouts',
      admin: {
        description: 'Optional: Gear loadout carried during this field expedition',
      },
    },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'weather', type: 'text' },
    { name: 'hero_image', type: 'upload', relationTo: 'nitf_media' },
    {
      name: 'gallery',
      type: 'array',
      label: 'Trip Gallery & Survey Photos',
      admin: {
        description: 'Photos taken during this outing. Tag individual locations to link them to location dossiers.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'nitf_media',
          required: true,
        },
        {
          name: 'location',
          type: 'relationship',
          relationTo: 'nitf_locations',
          admin: {
            description: 'Optional: Surveyed location shown in this photo',
          },
        },
        {
          name: 'caption',
          type: 'text',
          admin: {
            placeholder: 'e.g., Early morning frost on the timber lean-to',
          },
        },
      ],
    },
    { name: 'content', type: 'richText' },
  ],
  timestamps: true,
}
