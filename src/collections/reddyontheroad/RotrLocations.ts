import type { CollectionConfig } from 'payload'
import editor from '../users/access/editor'

export const RotrLocations: CollectionConfig = {
  slug: 'rotr_locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'place_type', 'marker_type', 'country'],
  },
  access: {
    read: () => true,
    create: editor,
    update: editor,
    delete: editor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'place_type',
      type: 'select',
      required: true,
      options: [
        { label: 'City', value: 'city' },
        { label: 'Town', value: 'town' },
        { label: 'Village', value: 'village' },
        { label: 'Beach', value: 'beach' },
        { label: 'Mountain', value: 'mountain' },
        { label: 'Park', value: 'park' },
        { label: 'Landmark', value: 'landmark' },
        { label: 'Accommodation', value: 'accommodation' },
        { label: 'Restaurant', value: 'restaurant' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'marker_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Hotel', value: 'hotel' },
        { label: 'Hostel', value: 'hostel' },
        { label: 'Airbnb / rental', value: 'airbnb' },
        { label: 'Campsite', value: 'camp' },
        { label: 'Parking / overnight', value: 'parking' },
        { label: 'City stop', value: 'city-stop' },
        { label: 'Viewpoint', value: 'viewpoint' },
        { label: 'Beach', value: 'beach' },
        { label: 'Restaurant', value: 'restaurant' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'latitude', type: 'number', required: true },
    { name: 'longitude', type: 'number', required: true },
    { name: 'country', type: 'text' },
  ],
}
