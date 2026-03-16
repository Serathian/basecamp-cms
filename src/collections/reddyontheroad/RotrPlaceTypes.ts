import { CollectionConfig } from 'payload'
import published from '../users/access/published'
import admin from '../users/access/admin'

export const RotrPlaceTypes: CollectionConfig = {
  slug: 'rotr_place_types',
  admin: {
    useAsTitle: 'name',
    group: 'Reddy on the Road',
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
  ],
}
