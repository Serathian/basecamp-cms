import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { up, down } from '@/migrations/20260317_jr_technologies'

let payload: Payload
let db: any

describe('Phase 6: Jake Reddy Tech Stack Collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    db = (payload.db as any).drizzle
  })

  afterAll(async () => {
    if (payload?.db) {
      await payload.db.destroy!()
    }
  })

  describe('JR-03: jr_technologies collection', () => {
    it('jr_technologies table exists after migration up()', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'jr_technologies'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(1)
    })

    it('can create jr_technology with name, category, and description', async () => {
      const tech = await payload.create({
        collection: 'jr_technologies',
        data: {
          name: 'TypeScript',
          category: 'language',
          description: 'Typed JS superset',
        },
      })
      expect(tech.id).toBeDefined()
      expect(tech.category).toBe('language')
      expect(tech.name).toBe('TypeScript')
      await payload.delete({ collection: 'jr_technologies', id: tech.id })
    })

    it('jr_technologies.icon_id column exists (direct FK, not _rels table)', async () => {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_technologies'} AND column_name = ${'icon_id'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(1)
    })

    it('can create jr_technology without icon (icon field is nullable)', async () => {
      const tech = await payload.create({
        collection: 'jr_technologies',
        data: {
          name: 'Go',
          category: 'language',
        },
      })
      expect(tech.id).toBeDefined()
      expect(tech.icon).toBeNull()
      await payload.delete({ collection: 'jr_technologies', id: tech.id })
    })
  })

  describe('JR-02: jr_posts.tech_stack relationship', () => {
    it('jr_posts.tech_stack JSON column dropped after migration up()', async () => {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_posts'} AND column_name = ${'tech_stack'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })

    it('jr_posts_rels.jr_technologies_id column exists after migration up()', async () => {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_posts_rels'} AND column_name = ${'jr_technologies_id'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(1)
    })

    it('can link jr_technology to jr_post via tech_stack field', async () => {
      const tech = await payload.create({
        collection: 'jr_technologies',
        data: { name: 'TypeScript', category: 'language' },
      })
      const post = await payload.create({
        collection: 'jr_posts',
        data: {
          title: 'Test Post',
          slug: `test-tech-link-${Date.now()}`,
          status: 'draft',
          tech_stack: [tech.id],
        },
      })
      expect((post.tech_stack as any[]).length).toBe(1)
      await payload.delete({ collection: 'jr_posts', id: post.id })
      await payload.delete({ collection: 'jr_technologies', id: tech.id })
    })

    it('jr_post depth:1 returns populated tech_stack array with technology objects', async () => {
      const tech = await payload.create({
        collection: 'jr_technologies',
        data: { name: 'TypeScript', category: 'language' },
      })
      const post = await payload.create({
        collection: 'jr_posts',
        data: {
          title: 'Populated Tech Post',
          slug: `test-populated-${Date.now()}`,
          status: 'draft',
          tech_stack: [tech.id],
        },
      })
      const populated = await payload.findByID({
        collection: 'jr_posts',
        id: post.id,
        depth: 1,
      })
      const stack = populated.tech_stack as any[]
      expect(stack).toHaveLength(1)
      expect(stack[0].name).toBe('TypeScript')
      await payload.delete({ collection: 'jr_posts', id: post.id })
      await payload.delete({ collection: 'jr_technologies', id: tech.id })
    })
  })

  describe('JR-01: jr_posts existing fields', () => {
    it('jr_posts has title, slug, body, cover_image, published_at, tags fields', async () => {
      const requiredColumns = ['title', 'slug', 'body', 'cover_image_id', 'published_at']
      for (const col of requiredColumns) {
        const result = await db.execute(sql`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = ${'jr_posts'} AND column_name = ${col} AND table_schema = 'public'
        `)
        expect(result.rows, `jr_posts.${col} should exist`).toHaveLength(1)
      }
      // tags is a relationship stored in jr_posts_rels, not a column on jr_posts
      const tagsResult = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_posts_rels'} AND column_name = ${'jr_tags_id'} AND table_schema = 'public'
      `)
      expect(tagsResult.rows, 'jr_posts_rels.jr_tags_id should exist').toHaveLength(1)
    })
  })

  describe('JR-04: jr_tags collection', () => {
    it('jr_tags has name and slug fields', async () => {
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_tags'} AND column_name IN ('name', 'slug') AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(2)
    })
  })

  describe('Migration lifecycle', () => {
    it('migration down() drops jr_technologies table', async () => {
      await down({ db })
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_name = ${'jr_technologies'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })

    it('migration down() removes jr_technologies_id from jr_posts_rels', async () => {
      // down() was already called in the previous test — check the state
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_posts_rels'} AND column_name = ${'jr_technologies_id'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(0)
    })

    it('migration down() restores tech_stack JSONB column on jr_posts', async () => {
      // down() was already called — tech_stack should be restored
      const result = await db.execute(sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = ${'jr_posts'} AND column_name = ${'tech_stack'} AND table_schema = 'public'
      `)
      expect(result.rows).toHaveLength(1)
      // Restore for subsequent tests
      await up({ db })
    })

    it('migration up() is idempotent (IF NOT EXISTS guards)', async () => {
      // up() was restored at the end of the previous test; call it again to verify idempotency
      await expect(up({ db })).resolves.not.toThrow()
    })
  })
})
