import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: ({ req }: any) => !!req.user,
    update: ({ req }: any) => !!req.user,
    delete: ({ req }: any) => !!req.user,
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
