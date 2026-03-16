import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { up, down } from '@/migrations/20260316_rotr_days_split'

let payload: Payload

describe('Phase 4: ROTR Days Collection', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    if (payload?.db) {
      await payload.db.destroy!()
    }
  })

  describe('ROTR-04: rotr_posts and rotr_locations dropped', () => {
    it.todo('rotr_posts table does not exist after migration')
    it.todo('rotr_locations table does not exist after migration')
  })

  describe('ROTR-01/02: rotr_days table structure', () => {
    it.todo('rotr_days table exists with all required columns')
    it.todo('rotr_place_types table exists with name and slug columns')
  })

  describe('GEO-04: geom auto-population via trigger', () => {
    it.todo('rotr_days: creating with lat/lon populates geom')
    it.todo('rotr_days: creating without lat/lon leaves geom null')
    it.todo('rotr_days: updating coordinates updates geom')
  })

  describe('TEST-02: relationship population', () => {
    it.todo('rotr_days.location_type populated as object at depth:1')
    it.todo('rotr_days.tags populated as array at depth:1')
  })

  describe('TEST-05: migration down() rollback', () => {
    it.todo('down() drops rotr_days and rotr_place_types tables')
    it.todo('down() + up() cycle leaves DB in valid state')
  })
})
