import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'site',
      type: 'select',
      required: true,
      options: [
        { label: 'jake-reddy.com', value: 'jake-reddy' },
        { label: 'nerdintheforest.com', value: 'nerdintheforest' },
        { label: 'reddyontheroad.com', value: 'reddyontheroad' },
      ],
    },
  ],
}
