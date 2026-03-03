import type { CollectionConfig } from 'payload'

export const NitfLocations: CollectionConfig = {
  slug: 'nitf_locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'place_type', 'marker_type', 'country'],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'place_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Forest', value: 'forest' },
        { label: 'Lake', value: 'lake' },
        { label: 'Park', value: 'park' },
        { label: 'Viewpoint', value: 'viewpoint' },
        { label: 'Summit', value: 'summit' },
        { label: 'Town', value: 'town' },
        { label: 'Beach', value: 'beach' },
        { label: 'Island', value: 'island' },
        { label: 'Valley', value: 'valley' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'marker_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Camp (free)', value: 'camp' },
        { label: 'Cabin (free)', value: 'cabin' },
        { label: 'Cabin (paid)', value: 'cabin-paid' },
        { label: 'Camp (paid)', value: 'camp-paid' },
        { label: 'Laavu (shelter)', value: 'laavu' },
        { label: 'Motorhome', value: 'motorhome' },
        { label: 'Day visit', value: 'day-visit' },
        { label: 'Trailhead', value: 'trailhead' },
        { label: 'Viewpoint', value: 'viewpoint' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'latitude', type: 'number', required: true },
    { name: 'longitude', type: 'number', required: true },
    { name: 'country', type: 'text' },
  ],
}
