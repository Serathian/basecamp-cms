import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll } from 'vitest'

let payload: Payload
let db: any

describe('Phase 3: Site-Specific Media & Tags', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    db = (payload.db as any).drizzle
  })

  afterAll(async () => {
    if (payload?.db?.destroy) {
      await payload.db.destroy()
    }
  })

  describe('SITESPEC-01: jr_media, nitf_media, rotr_media tables exist', () => {
    it.todo('jr_media table exists with id, alt, filename, updated_at, created_at columns')
    it.todo('nitf_media table exists with correct columns')
    it.todo('rotr_media table exists with correct columns')
  })

  describe('SITESPEC-02: jr_tags, nitf_tags, rotr_tags tables exist', () => {
    it.todo('jr_tags table exists with id, name, slug, updated_at, created_at columns')
    it.todo('nitf_tags table exists with correct columns')
    it.todo('rotr_tags table exists with correct columns')
  })

  describe('SITESPEC-03: Media uploads scoped to site', () => {
    it.todo('Can create jr_media record via payload.create')
    it.todo('jr_posts cover_image_id FK references jr_media, not media')
  })

  describe('SITESPEC-04: Tags scoped to site', () => {
    it.todo('jr_posts_rels has jr_tags_id column (not tags_id)')
    it.todo('nitf_posts_rels has nitf_tags_id column (not tags_id)')
    it.todo('rotr_posts_rels has rotr_tags_id column (not tags_id)')
  })

  describe('SITESPEC-05 + TEST-02: Migration data preservation and relationships', () => {
    it.todo('Existing tags rows are present in site-specific tables after migration up()')
    it.todo('jr_post.tags populated relationship returns tag object (not just ID)')
    it.todo('nitf_post.tags populated relationship returns tag object')
  })

  describe('TEST-05: Migration down() rollback', () => {
    it.todo('Migration down() drops jr_tags, nitf_tags, rotr_tags, jr_media, nitf_media, rotr_media tables')
    it.todo('Migration down() restores media and tags tables with original rows')
    it.todo('Migration down() restores tags_id column in _rels tables')
  })
})
