import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const NitfLoadouts: CollectionConfig = {
  slug: 'nitf_loadouts',
  admin: {
    useAsTitle: 'title',
    group: 'Nerd in the Forest',
    defaultColumns: ['title', 'season', 'temp_range'],
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'season',
      type: 'select',
      required: true,
      options: [
        { label: 'Spring / Thaw', value: 'spring' },
        { label: 'Summer / Boreal', value: 'summer' },
        { label: 'Autumn / Taiga', value: 'autumn' },
        { label: 'Winter / Sub-Zero', value: 'winter' },
      ],
    },
    { name: 'temp_range', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'item',
          type: 'relationship',
          relationTo: 'nitf_gear_items',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'packed',
          options: [
            { label: 'Packed (carried in rucksack)', value: 'packed' },
            { label: 'Essential (safety/nav gear)', value: 'essential' },
            { label: 'Worn (worn on body/boots)', value: 'worn' },
            { label: 'Consumable (food/fuel/water)', value: 'consumable' },
          ],
        },
        { name: 'custom_note', type: 'text' },
      ],
    },
    {
      name: 'dispatches',
      type: 'join',
      collection: 'nitf_dispatches',
      on: 'loadout',
      admin: {
        description: 'Field dispatches where this loadout was carried',
      },
    },
  ],
  timestamps: true,
}
