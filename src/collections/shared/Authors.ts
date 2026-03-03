import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
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
    { name: 'bio', type: 'textarea' },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    {
      name: 'sites',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'jake-reddy.com', value: 'jake-reddy' },
        { label: 'nerdintheforest.com', value: 'nerdintheforest' },
        { label: 'reddyontheroad.com', value: 'reddyontheroad' },
      ],
    },
  ],
}
