import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'
import editor from '../users/access/editor'
import { anyone } from '../users/access/anyone'

interface GpxPoint {
  lat: number
  lon: number
  ele?: number
}

function parseGpxPoints(gpxContent: string): GpxPoint[] {
  const points: GpxPoint[] = []
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g
  let match

  while ((match = trkptRegex.exec(gpxContent)) !== null) {
    const lat = parseFloat(match[1])
    const lon = parseFloat(match[2])
    const eleMatch = match[3].match(/<ele>([^<]+)<\/ele>/)
    const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined
    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon, ele })
    }
  }
  return points
}

function haversineDistance(a: GpxPoint, b: GpxPoint): number {
  const R = 6371000
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
  let north = -90,
    south = 90,
    east = -180,
    west = 180

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (p.lat > north) north = p.lat
    if (p.lat < south) south = p.lat
    if (p.lon > east) east = p.lon
    if (p.lon < west) west = p.lon

    if (i > 0) {
      distance += haversineDistance(points[i - 1], p)
      if (p.ele !== undefined && points[i - 1].ele !== undefined) {
        const diff = p.ele - points[i - 1].ele!
        if (diff > 0) elevationGain += diff
        else elevationLoss += Math.abs(diff)
      }
    }
  }

  return {
    distance_km: Math.round((distance / 1000) * 100) / 100,
    elevation_gain_m: Math.round(elevationGain),
    elevation_loss_m: Math.round(elevationLoss),
    bounding_box: { north, south, east, west },
    latitude_start: points[0]?.lat,
    longitude_start: points[0]?.lon,
  }
}

const computeGpxStats: CollectionAfterChangeHook = async ({ doc, req }: any) => {
  if (!doc.gpx_file) return doc

  try {
    const fileId = typeof doc.gpx_file === 'object' ? doc.gpx_file.id : doc.gpx_file
    const file = await req.payload.findByID({ collection: 'media', id: fileId })
    if (!file?.url) return doc

    const baseUrl =
      process.env.PAYLOAD_PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`
    const gpxUrl = `${baseUrl}${file.url}`
    const response = await fetch(gpxUrl)
    if (!response.ok) return doc

    const gpxContent = await response.text()
    const points = parseGpxPoints(gpxContent)
    if (points.length < 2) return doc

    const stats = computeTrailStats(points)

    await req.payload.update({
      collection: 'nitf_trails',
      id: doc.id,
      data: stats,
    })
  } catch (err) {
    req.payload.logger.error(`GPX stats computation failed for trail ${doc.id}: ${err}`)
  }

  return doc
}

export const NitfTrails: CollectionConfig = {
  slug: 'nitf_trails',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'difficulty', 'distance_km'],
  },
  access: {
    read: () => {
      // Unauthenticated users should only see published posts — enforce via access control, not API routes
      if (anyone()) return { status: { equals: 'published' } }
      return true
    },
    create: editor,
    update: editor,
    delete: editor,
  },
  hooks: {
    afterChange: [computeGpxStats],
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
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'gpx_file', type: 'upload', relationTo: 'media' },
    { name: 'distance_km', type: 'number' },
    { name: 'elevation_gain_m', type: 'number' },
    { name: 'elevation_loss_m', type: 'number' },
    { name: 'duration_hours', type: 'number' },
    {
      name: 'difficulty',
      type: 'select',
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Hard', value: 'hard' },
        { label: 'Expert', value: 'expert' },
      ],
    },
    {
      name: 'trail_type',
      type: 'select',
      options: [
        { label: 'Loop', value: 'loop' },
        { label: 'Out and back', value: 'out-and-back' },
        { label: 'Point to point', value: 'point-to-point' },
      ],
    },
    { name: 'latitude_start', type: 'number' },
    { name: 'longitude_start', type: 'number' },
    { name: 'bounding_box', type: 'json' },
    { name: 'country', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'season_start', type: 'text' },
    { name: 'season_end', type: 'text' },
  ],
  timestamps: true,
}
