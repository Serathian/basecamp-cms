import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const JrTechnologies: CollectionConfig = {
  slug: 'jr_technologies',
  defaultSort: 'name',
  admin: {
    useAsTitle: 'name',
    group: 'Jake Reddy',
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'icon', type: 'upload', relationTo: 'jr_media' },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Language', value: 'language' },
        { label: 'Framework', value: 'framework' },
        { label: 'Database', value: 'database' },
        { label: 'Infrastructure', value: 'infrastructure' },
        { label: 'Tool', value: 'tool' },
        { label: 'Library', value: 'library' },
      ],
    },
    { name: 'description', type: 'textarea' },
  ],
}
