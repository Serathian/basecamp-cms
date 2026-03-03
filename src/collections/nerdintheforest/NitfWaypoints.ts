import type { CollectionConfig } from 'payload'
import editor from '../users/access/editor'

export const NitfWaypoints: CollectionConfig = {
  slug: 'nitf_waypoints',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'trail'],
  },
  access: {
    read: () => true,
    create: editor,
    update: editor,
    delete: editor,
  },
  fields: [
    { name: 'trail', type: 'relationship', relationTo: 'nitf_trails', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Viewpoint', value: 'viewpoint' },
        { label: 'Summit', value: 'summit' },
        { label: 'Water source', value: 'water' },
        { label: 'Hazard', value: 'hazard' },
        { label: 'Camp', value: 'camp' },
        { label: 'Junction', value: 'junction' },
        { label: 'Trailhead', value: 'trailhead' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'latitude', type: 'number', required: true },
    { name: 'longitude', type: 'number', required: true },
    { name: 'altitude_m', type: 'number' },
    { name: 'sort', type: 'number' },
  ],
}
