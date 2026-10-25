import type { CollectionConfig } from 'payload'
import admin from '../users/access/admin'

export const NitfGearItems: CollectionConfig = {
  slug: 'nitf_gear_items',
  admin: {
    useAsTitle: 'name',
    group: 'Nerd in the Forest',
    defaultColumns: ['name', 'brand', 'category', 'weight_grams'],
  },
  access: {
    read: () => true,
    create: admin,
    update: admin,
    delete: admin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'brand', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Shelter & Sleep', value: 'shelter_sleep' },
        { label: 'Cook & Water', value: 'cook_water' },
        { label: 'Navigation & Tools', value: 'navigation_tools' },
        { label: 'Pack & Apparel', value: 'pack_apparel' },
        { label: 'Field Repair & Hygiene', value: 'hygiene_repair' },
      ],
    },
    { name: 'weight_grams', type: 'number', required: true },
    { name: 'spec_note', type: 'text' },
    { name: 'notes', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'nitf_media' },
    { name: 'product_url', type: 'text' },
    {
      name: 'reviews',
      type: 'join',
      collection: 'nitf_gear_reviews',
      on: 'gear_item',
      admin: {
        description: 'Field reviews and durability logs linked to this gear item',
      },
    },
  ],
  timestamps: true,
}
