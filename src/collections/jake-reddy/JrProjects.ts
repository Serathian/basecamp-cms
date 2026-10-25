import type { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const JrProjects: CollectionConfig = {
  slug: 'jr_projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'featured', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    {
      name: 'tags',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true },
      ],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
  timestamps: true,
}
