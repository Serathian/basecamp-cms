import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import fs from 'fs'
import path from 'path'
import published from '../users/access/published'
import admin from '../users/access/admin'

interface GpxPoint {
  lat: number
  lon: number
  ele?: number
}

function parseGpxPoints(gpxContent: string): GpxPoint[] {
  const points: GpxPoint[] = []

  const extractPointsByTag = (tagNames: string) => {
    const tagRegex = new RegExp(
      `<(?:${tagNames})\\s+([^>]*?)(?:>([\\s\\S]*?)<\\/(?:${tagNames})>|\\/>)`,
      'gi'
    )
    let match: RegExpExecArray | null
    while ((match = tagRegex.exec(gpxContent)) !== null) {
      const attrs = match[1] || ''
      const inner = match[2] || ''
      const latMatch = attrs.match(/\blat=["']([^"']+)["']/i)
      const lonMatch = attrs.match(/\blon=["']([^"']+)["']/i)
      if (!latMatch || !lonMatch) continue
      const lat = parseFloat(latMatch[1])
      const lon = parseFloat(lonMatch[1])
      const eleMatch = inner.match(/<ele>([^<]+)<\/ele>/i)
      const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        points.push({ lat, lon, ele })
      }
    }
  }

  extractPointsByTag('trkpt')
  if (points.length === 0) {
    extractPointsByTag('rtept|wpt')
  }

  return points
}

function haversineDistance(a: GpxPoint, b: GpxPoint): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon
  return 2 * R * Math.asin(Math.sqrt(h))
}

function computeTrailStats(points: GpxPoint[]) {
  let distance = 0
  let elevationGain = 0
  let elevationLoss = 0

  for (let i = 1; i < points.length; i++) {
    distance += haversineDistance(points[i - 1], points[i])
    if (points[i].ele !== undefined && points[i - 1].ele !== undefined) {
      const diff = points[i].ele! - points[i - 1].ele!
      if (diff > 0) {
        elevationGain += diff
      } else {
        elevationLoss += Math.abs(diff)
      }
    }
  }

  // Convert points to [lng, lat] or [lng, lat, ele] coordinate tuples for GeoJSON / MapLibre LineString
  const trailGeometry: number[][] = points.map(p =>
    p.ele !== undefined
      ? [
          Math.round(p.lon * 1000000) / 1000000,
          Math.round(p.lat * 1000000) / 1000000,
          Math.round(p.ele * 10) / 10,
        ]
      : [
          Math.round(p.lon * 1000000) / 1000000,
          Math.round(p.lat * 1000000) / 1000000,
        ]
  )

  return {
    distance_km: Math.round((distance / 1000) * 100) / 100,
    elevation_gain_m: Math.round(elevationGain),
    elevation_loss_m: Math.round(elevationLoss),
    trail_geometry: trailGeometry
  }
}

const computeDispatchGpxStats: CollectionAfterChangeHook = async ({ doc, req, previousDoc }) => {
  // If no GPX file is attached, or if it hasn't changed and trail_geometry already exists, exit early
  if (!doc.gpx_file) return doc
  const currentFileId = typeof doc.gpx_file === 'object' && doc.gpx_file !== null ? doc.gpx_file.id : doc.gpx_file
  const prevFileId = typeof previousDoc?.gpx_file === 'object' && previousDoc.gpx_file !== null ? previousDoc.gpx_file.id : previousDoc?.gpx_file

  if (currentFileId === prevFileId && doc.trail_geometry && Array.isArray(doc.trail_geometry) && doc.trail_geometry.length > 0) {
    return doc
  }

  try {
    const file = await req.payload.findByID({
      collection: 'nitf_media',
      id: currentFileId,
      req,
    })

    if (!file) return doc

    let gpxContent = ''

    // First try reading directly from local filesystem
    if (file.filename) {
      const uploadDir = path.resolve(process.cwd(), 'nitf_media')
      const localFilePath = path.join(uploadDir, file.filename)
      if (fs.existsSync(localFilePath)) {
        gpxContent = fs.readFileSync(localFilePath, 'utf8')
      }
    }

    // Fallback to fetching URL if file was not on disk directly
    if (!gpxContent && file.url) {
      const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`
      const targetUrl = file.url.startsWith('http') ? file.url : `${baseUrl}${file.url}`
      const res = await fetch(targetUrl)
      if (res.ok) {
        gpxContent = await res.text()
      }
    }

    if (!gpxContent) return doc

    const points = parseGpxPoints(gpxContent)
    if (points.length < 2) return doc

    const stats = computeTrailStats(points)

    const updated = await req.payload.update({
      collection: 'nitf_dispatches',
      id: doc.id,
      data: stats,
      req,
    })
    return updated
  } catch (err) {
    req.payload.logger.error(`GPX track processing failed for dispatch ${doc.id}: ${err}`)
  }

  return doc
}

export const NitfDispatches: CollectionConfig = {
  slug: 'nitf_dispatches',
  admin: {
    useAsTitle: 'title',
    group: 'Nerd in the Forest',
    defaultColumns: ['title', 'status', 'published_at', 'locations'],
  },
  access: {
    read: published,
    create: admin,
    update: admin,
    delete: admin,
  },
  hooks: {
    afterChange: [computeDispatchGpxStats],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'published_at',
      type: 'date',
      admin: {
        description: 'Date and time the article was published',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'start_date',
      type: 'date',
      admin: {
        description: 'Start date of the field expedition / hike',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'end_date',
      type: 'date',
      admin: {
        description: 'End date of the field expedition (leave empty or same as start date for single-day outings)',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'gpx_file',
      type: 'upload',
      relationTo: 'nitf_media',
      admin: {
        description: 'Upload GPX track file recorded during this dispatch outing. Auto-populates trail_geometry and statistics.',
      },
    },
    {
      name: 'trail_geometry',
      type: 'json',
      admin: {
        description: 'Array of [lng, lat] coordinate pairs defining the traversed GPS route (auto-generated from GPX or manual).',
      },
    },
    {
      name: 'distance_km',
      type: 'number',
      admin: {
        description: 'Total distance traversed in kilometers (auto-computed from GPX or manual).',
      },
    },
    {
      name: 'elevation_gain_m',
      type: 'number',
      admin: {
        description: 'Total elevation gain in meters (auto-computed from GPX or manual).',
      },
    },
    {
      name: 'elevation_loss_m',
      type: 'number',
      admin: {
        description: 'Total elevation loss in meters (auto-computed from GPX or manual).',
      },
    },
    {
      name: 'duration_hours',
      type: 'number',
      admin: {
        description: 'Total moving or outing duration in hours.',
      },
    },
    {
      name: 'locations',
      type: 'relationship',
      relationTo: 'nitf_locations',
      hasMany: true,
      admin: {
        description: 'Select all surveyed locations passed or visited during this hike',
      },
    },
    {
      name: 'loadout',
      type: 'relationship',
      relationTo: 'nitf_loadouts',
      admin: {
        description: 'Optional: Gear loadout carried during this field expedition',
      },
    },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'weather', type: 'text' },
    { name: 'hero_image', type: 'upload', relationTo: 'nitf_media' },
    {
      name: 'gallery',
      type: 'array',
      label: 'Trip Gallery & Survey Photos',
      admin: {
        description: 'Photos taken during this outing. Tag individual locations to link them to location dossiers.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'nitf_media',
          required: true,
        },
        {
          name: 'location',
          type: 'relationship',
          relationTo: 'nitf_locations',
          admin: {
            description: 'Optional: Surveyed location shown in this photo',
          },
        },
        {
          name: 'caption',
          type: 'text',
          admin: {
            placeholder: 'e.g., Early morning frost on the timber lean-to',
          },
        },
      ],
    },
    { name: 'content', type: 'richText' },
  ],
  timestamps: true,
}
