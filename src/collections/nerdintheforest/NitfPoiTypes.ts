import { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const NitfPoiTypes: CollectionConfig = {
  slug: 'nitf_poi_types',
  defaultSort: 'name',
  admin: {
    useAsTitle: 'name',
    group: 'Nerd in the Forest',
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
  ],
}
