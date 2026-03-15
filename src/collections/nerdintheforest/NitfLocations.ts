import type { CollectionConfig } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { anyone } from '../users/access/anyone'
import user from '../users/access/user'

export const NitfLocations: CollectionConfig = {
  slug: 'nitf_locations',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'place_type', 'marker_type', 'country'],
  },
  access: {
    read: anyone,
    create: user,
    update: user,
    delete: user,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }: any) => {
        if (doc.latitude != null && doc.longitude != null) {
          const db = (req.payload.db as any).drizzle
          await db.execute(sql`
            UPDATE nitf_locations
            SET geom = ST_SetSRID(ST_MakePoint(${doc.longitude}, ${doc.latitude}), 4326)
            WHERE id = ${doc.id}
          `)
        }
        return doc
      },
    ],
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
