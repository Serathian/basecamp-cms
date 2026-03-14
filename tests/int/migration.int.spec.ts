import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

describe('PostGIS Migration — up/down operations', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    if (payload) {
      await payload.db.destroy()
    }
  })

  it.todo('Migration up adds geom columns to all 6 tables')
  it.todo('Migration populates geom from existing lat/lon data')
  it.todo('Spatial indexes exist on all 6 tables')
  it.todo('Migration down removes geom columns')
})
