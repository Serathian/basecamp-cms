import { DatabaseAdapter } from 'payload'
import { sql } from '@payloadcms/db-postgres'

export default async function getNearbyLocations(
  lat: number,
  lon: number,
  radius: number,
  payloadDb: DatabaseAdapter,
): Promise<Response> {
  try {
    const db = (payloadDb as any).drizzle
    const results = await db.execute(sql`
      SELECT id, name, slug, category, latitude, longitude,
        ST_Distance(
          geom::geography,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM nitf_locations
      WHERE geom IS NOT NULL
        AND ST_DWithin(
          geom::geography,
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
          ${radius}
        )
      ORDER BY distance_m ASC
    `)
    return Response.json({ docs: results.rows })
  } catch (err) {
    return Response.json({ error: String(err), docs: [] }, { status: 500 })
  }
}
