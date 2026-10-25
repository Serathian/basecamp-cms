import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const NitfLocations: CollectionConfig = {
  slug: 'nitf_locations',
  admin: {
    useAsTitle: 'name',
    group: 'Nerd in the Forest',
    defaultColumns: ['name', 'category', 'area', 'latitude', 'longitude'],
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'area',
      type: 'relationship',
      relationTo: 'nitf_areas',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Shelter / Gapahuk', value: 'shelter' },
        { label: 'Stone Hearth / Campfire', value: 'hearth' },
        { label: 'Potable Spring', value: 'springhead' },
        { label: 'Mountain Summit', value: 'summit' },
        { label: 'Viewpoint / Vista', value: 'viewpoint' },
      ],
    },
    { name: 'latitude', type: 'number', required: true },
    { name: 'longitude', type: 'number', required: true },
    { name: 'elevation', type: 'number' },
    {
      name: 'shelter_capacity',
      type: 'number',
      min: 0,
      admin: {
        description: 'Number of people who fit inside the shelter (0 or empty if no shelter)',
      },
    },
    {
      name: 'tent_spaces',
      type: 'number',
      min: 0,
      admin: {
        description: 'Approximate number of tent pitching spaces at the location',
      },
    },
    { name: 'summary', type: 'textarea' },
    {
      name: 'amenities',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Timber Shelter', value: 'timber_shelter' },
        { label: 'Stone Hearth', value: 'stone_hearth' },
        { label: 'Potable Spring Water', value: 'potable_water' },
        { label: 'Dry Firewood', value: 'dry_wood' },
        { label: 'Lake Vista / View', value: 'lake_view' },
        { label: 'Lake Water', value: 'lake_water' },
        { label: 'Tent Pitching Ground', value: 'tent_pitch' },
        { label: 'Parking / Trailhead', value: 'parking' },
      ],
    },
    {
      name: 'trailhead',
      type: 'relationship',
      relationTo: 'nitf_locations',
      filterOptions: {
        amenities: { contains: 'parking' },
      },
      admin: {
        description: 'Link to a location that has Parking / Trailhead amenity (leave empty if this location itself has parking)',
      },
    },
    { name: 'elevation_gain', type: 'number' },
    { name: 'elevation_loss', type: 'number' },
    { name: 'cover_image', type: 'upload', relationTo: 'nitf_media' },
  ],
  timestamps: true,
}
