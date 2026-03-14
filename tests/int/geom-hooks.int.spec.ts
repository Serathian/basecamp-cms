import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { sql } from '@payloadcms/db-postgres'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

describe('Geom Auto-Population — afterChange hooks', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    if (payload) {
      await payload.db.destroy()
    }
  })

  it.todo('nitf_posts: creating with lat/lon populates geom')
  it.todo('nitf_trails: creating with latitude_start/longitude_start populates geom')
  it.todo('nitf_waypoints: creating with lat/lon populates geom')
  it.todo('nitf_locations: creating with lat/lon populates geom')
  it.todo('rotr_posts: creating with lat/lon populates geom')
  it.todo('rotr_locations: creating with lat/lon populates geom')
  it.todo('Edge case: creating without coordinates does not error')
  it.todo('Update: changing coordinates updates geom')
})
