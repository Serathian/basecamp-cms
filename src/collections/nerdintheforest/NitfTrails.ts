import type { CollectionConfig } from 'payload'

export const NitfTrails: CollectionConfig = {
  slug: 'nitf_trails',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'difficulty', 'distance_km'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return { status: { equals: 'published' } }
      return true
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
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
    { name: 'gpx_file', type: 'upload', relationTo: 'media' },
    { name: 'distance_km', type: 'number' },
    { name: 'elevation_gain_m', type: 'number' },
    { name: 'elevation_loss_m', type: 'number' },
    { name: 'duration_hours', type: 'number' },
    {
      name: 'difficulty',
      type: 'select',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Hard', value: 'hard' },
        { label: 'Expert', value: 'expert' },
      ],
    },
    {
      name: 'trail_type',
      type: 'select',
      options: [
        { label: 'Loop', value: 'loop' },
        { label: 'Out and back', value: 'out-and-back' },
        { label: 'Point to point', value: 'point-to-point' },
      ],
    },
    { name: 'latitude_start', type: 'number' },
    { name: 'longitude_start', type: 'number' },
    { name: 'bounding_box', type: 'json' },
    { name: 'country', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'season_start', type: 'text' },
    { name: 'season_end', type: 'text' },
  ],
  timestamps: true,
}
