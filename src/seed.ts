import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from './payload.config'

export const SEED_USER = {
  email: process.env.ADMIN_EMAIL || 'dev@payloadcms.com',
  password: process.env.ADMIN_PASSWORD || 'test',
  roles: 'admin' as const,
}

export async function seed(existingPayload?: Payload) {
  const payload = existingPayload || (await getPayload({ config }))

  console.log('--- Starting Basecamp CMS Database Seed (Pirkanmaa, Finland Focus) ---')

  // 1. Seed Admin User
  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: SEED_USER.email } },
    limit: 1,
  })

  let adminUser: any = existingUsers.docs[0]
  if (!adminUser) {
    adminUser = await payload.create({
      collection: 'users',
      data: {
        email: SEED_USER.email,
        password: SEED_USER.password,
        roles: SEED_USER.roles,
      },
    })
    console.log(`✓ Created admin user: ${SEED_USER.email}`)
  } else {
    console.log(`ℹ Admin user already exists: ${SEED_USER.email}`)
  }

  // 2. Seed Authors
  const existingAuthor = await payload.find({
    collection: 'authors',
    where: { slug: { equals: 'jake-reddy' } },
    limit: 1,
  })

  let author: any = existingAuthor.docs[0]
  if (!author) {
    author = await payload.create({
      collection: 'authors',
      data: {
        name: 'Jake Reddy',
        slug: 'jake-reddy',
        bio: 'Software engineer, hiker, and builder of modern type-safe web systems. Exploring the boreal trails of Pirkanmaa, Finland.',
        sites: ['jake-reddy', 'nerdintheforest', 'reddyontheroad'],
      },
    })
    console.log('✓ Created author: Jake Reddy')
  }

  // 3. Seed JrProjects
  const projectsData = [
    {
      title: 'Basecamp CMS',
      slug: 'basecamp-cms',
      description: 'Unified headless CMS for personal multisite stack powered by Payload CMS v3 and PostgreSQL with PostGIS.',
      featured: true,
      tags: [{ name: 'Payload CMS' }, { name: 'PostgreSQL' }, { name: 'TypeScript' }],
      links: [{ label: 'GitHub', url: 'https://github.com/Serathian/basecamp-cms' }],
    },
    {
      title: 'Nerd in the Forest',
      slug: 'nerd-in-the-forest',
      description: 'Backcountry field guide and Nordic shelter navigation platform for Pirkanmaa, Finland, with PostGIS geospatial queries.',
      featured: true,
      tags: [{ name: 'Nuxt' }, { name: 'PostGIS' }, { name: 'Vue' }],
      links: [{ label: 'Live', url: 'https://nerdintheforest.com' }],
    },
    {
      title: 'jake-reddy.com',
      slug: 'jake-reddy-com',
      description: 'Personal portfolio and engineering journal built with Next.js and Tailwind CSS.',
      featured: true,
      tags: [{ name: 'Next.js' }, { name: 'React' }, { name: 'Tailwind CSS' }],
      links: [{ label: 'Live', url: 'https://jake-reddy.com' }],
    },
  ]

  for (const proj of projectsData) {
    const existing = await payload.find({
      collection: 'jr_projects',
      where: { slug: { equals: proj.slug } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'jr_projects',
        data: proj,
      })
      console.log(`✓ Created jr_project: ${proj.title}`)
    }
  }

  // 4. Seed JrPosts
  const postsData = [
    {
      title: 'Mapping Pirkanmaa Trails with PostGIS and Payload CMS',
      slug: 'mapping-pirkanmaa-trails-postgis',
      status: 'published' as const,
      published_at: '2026-03-10T10:00:00Z',
      excerpt: 'How I use PostGIS spatial queries in PostgreSQL to navigate shelters like Vähä-Riutta and Vähä-Kauas across Pirkanmaa.',
      body: 'Surveying the Birgitan polku trail system in Lempäälä and building nearest-shelter discovery using PostGIS ST_DWithin and ST_Distance.',
      featured: true,
      reading_time_minutes: 6,
      tags: [{ name: 'PostGIS' }, { name: 'Pirkanmaa' }, { name: 'Payload CMS' }],
    },
    {
      title: 'Building My Personal Site with Next.js and Payload CMS',
      slug: 'building-personal-site-nextjs-payload-cms',
      status: 'published' as const,
      published_at: '2026-02-01T10:00:00Z',
      excerpt: 'How I built a fully type-safe personal website and blog using Next.js 15, Payload CMS 3, and PostgreSQL.',
      body: 'A deep dive into building a fast, type-safe headless content platform using Payload CMS v3 and Next.js App Router.',
      featured: true,
      reading_time_minutes: 5,
      tags: [{ name: 'Next.js' }, { name: 'Payload CMS' }, { name: 'TypeScript' }],
    },
    {
      title: 'Why I Switched from Jest to Vitest',
      slug: 'switching-from-jest-to-vitest',
      status: 'published' as const,
      published_at: '2025-11-20T08:00:00Z',
      excerpt: 'Vitest is Jest-compatible, runs in parallel by default, and starts in a fraction of the time.',
      body: 'Experiences and benchmarks migrating an active TypeScript integration suite from Jest to Vitest.',
      featured: false,
      reading_time_minutes: 4,
      tags: [{ name: 'Vitest' }, { name: 'TypeScript' }],
    },
    {
      title: 'Upcoming Basecamp CMS Roadmap',
      slug: 'upcoming-basecamp-cms-roadmap',
      status: 'draft' as const,
      excerpt: 'Draft outline of upcoming capabilities including live search and sync workflows.',
      body: 'Draft notes on upcoming features and enhancements.',
      featured: false,
      reading_time_minutes: 2,
      tags: [{ name: 'Roadmap' }],
    },
  ]

  for (const post of postsData) {
    const existing = await payload.find({
      collection: 'jr_posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'jr_posts',
        data: post,
      })
      console.log(`✓ Created jr_post: ${post.title}`)
    }
  }

  // 5. Seed NitfAreas (Pirkanmaa, Finland as primary focus)
  const areasData = [
    {
      name: 'Pirkanmaa',
      slug: 'pirkanmaa',
      country: 'Finland',
      description: 'Boreal forest lakes, rugged fault gorges, and primeval pine peatlands in western Finland, spanning Tampere, Lempäälä, Helvetinjärvi, and Seitseminen.',
      center_latitude: 61.498,
      center_longitude: 23.761,
      default_zoom: 10,
    },
    {
      name: 'Koli National Park',
      slug: 'koli-national-park',
      country: 'Finland',
      description: 'Iconic Karelian quartzite peaks overlooking Lake Pielinen with ancient pine stands and historic lean-tos.',
      center_latitude: 63.09,
      center_longitude: 29.80,
      default_zoom: 12,
    },
  ]

  const areaMap: Record<string, any> = {}
  for (const area of areasData) {
    let existing = await payload.find({
      collection: 'nitf_areas',
      where: { slug: { equals: area.slug } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      const created = await payload.create({
        collection: 'nitf_areas',
        data: area,
      })
      areaMap[area.slug] = created
      console.log(`✓ Created nitf_area: ${area.name}`)
    } else {
      areaMap[area.slug] = existing.docs[0]
    }
  }

  // 6. Seed NitfLocations in Pirkanmaa, Finland
  const pirkanmaaId = areaMap['pirkanmaa']?.id

  // 6a. Trailhead: Savontie P-alue (Birgitan polku, Lempäälä)
  let savontieTrailhead: any
  const existingSavontie = await payload.find({
    collection: 'nitf_locations',
    where: { slug: { equals: 'savontie-trailhead' } },
    limit: 1,
  })
  if (existingSavontie.docs.length === 0 && pirkanmaaId) {
    savontieTrailhead = await payload.create({
      collection: 'nitf_locations',
      data: {
        name: 'Savontie P-alue (Birgitan polku)',
        slug: 'savontie-trailhead',
        area: pirkanmaaId,
        category: 'hearth',
        latitude: 61.398,
        longitude: 23.892,
        elevation: 125,
        summary: 'Pysäköintialue Savontien varrella Lempäälässä. Päälähtöpiste Birgitan polulle kohti Vähä-Riutan ja Vähä-Kauas laavuja.',
        amenities: ['dry_wood', 'parking'],
      },
    })
    console.log('✓ Created nitf_location: Savontie P-alue')
  } else {
    savontieTrailhead = existingSavontie.docs[0]
  }

  // 6b. Trailhead: Kankimäki P-alue (Helvetinjärvi, Ruovesi)
  let kankimakiTrailhead: any
  const existingKankimaki = await payload.find({
    collection: 'nitf_locations',
    where: { slug: { equals: 'kankimaki-trailhead' } },
    limit: 1,
  })
  if (existingKankimaki.docs.length === 0 && pirkanmaaId) {
    kankimakiTrailhead = await payload.create({
      collection: 'nitf_locations',
      data: {
        name: 'Kankimäki P-alue (Helvetinjärvi)',
        slug: 'kankimaki-trailhead',
        area: pirkanmaaId,
        category: 'hearth',
        latitude: 62.038,
        longitude: 23.832,
        elevation: 180,
        summary: 'Pääportti ja taukokeskus Helvetinjärven kansallispuistoon Ruovedellä.',
        amenities: ['dry_wood', 'parking'],
      },
    })
    console.log('✓ Created nitf_location: Kankimäki P-alue')
  } else {
    kankimakiTrailhead = existingKankimaki.docs[0]
  }

  const locationsData = [
    {
      name: 'Vähä-Riutan laavu',
      slug: 'vaha-riutta-laavu',
      area: pirkanmaaId,
      category: 'shelter' as const,
      latitude: 61.4045,
      longitude: 23.9085,
      elevation: 138,
      summary: 'Suosittu ja tilava hirsirakenteinen tuplalaavu ja kota Iso-Riutan ja Vähä-Riutan järvien välisellä kannaksella Birgitan polun varrella Lempäälässä. Uimalaituri, nuotiopaikka ja puuvaja.',
      amenities: ['timber_shelter' as const, 'stone_hearth' as const, 'dry_wood' as const, 'lake_view' as const, 'lake_water' as const],
      trailhead: savontieTrailhead?.id,
    },
    {
      name: 'Vähä-Kauas laavu',
      slug: 'vaha-kauas-laavu',
      area: pirkanmaaId,
      category: 'shelter' as const,
      latitude: 61.3665,
      longitude: 23.9246,
      elevation: 132,
      summary: 'Rauhallinen rantalaavu ja kamiinalla varustettu laavukota Vähä-Kausjärven itärannalla Birgitan polun erämaisella osuudella Lempäälässä. Rantanuotiopaikka ja kuivakäymälä.',
      amenities: ['timber_shelter' as const, 'stone_hearth' as const, 'dry_wood' as const, 'lake_view' as const, 'lake_water' as const],
      trailhead: savontieTrailhead?.id,
    },
    {
      name: 'Kirskaanniemi laavu',
      slug: 'kirskaanniemi-laavu',
      area: pirkanmaaId,
      category: 'shelter' as const,
      latitude: 61.4079,
      longitude: 23.7745,
      elevation: 115,
      summary: 'Kaunis kallioinen niemenkärki ja useampi laavu Höytämönjärven rannalla Birgitan polun reitistöllä.',
      amenities: ['timber_shelter' as const, 'stone_hearth' as const, 'dry_wood' as const, 'lake_view' as const, 'lake_water' as const],
    },
    {
      name: 'Helvetinkolu laavu',
      slug: 'helvetinkolu-laavu',
      area: pirkanmaaId,
      category: 'shelter' as const,
      latitude: 62.0306,
      longitude: 23.8447,
      elevation: 172,
      summary: 'Hirsilaavu mahtavan 40-metrisen Helvetinkolun murroslaakson partaalla Helvetinjärven kansallispuistossa Ruovedellä.',
      amenities: ['timber_shelter' as const, 'stone_hearth' as const, 'dry_wood' as const, 'lake_view' as const],
      trailhead: kankimakiTrailhead?.id,
    },
    {
      name: 'Kintulammi lähde',
      slug: 'kintulammi-lahde',
      area: pirkanmaaId,
      category: 'springhead' as const,
      latitude: 61.608,
      longitude: 23.982,
      elevation: 155,
      summary: 'Kirkasvetinen luonnonlähde Kintulammen retkeilyalueen polun varrella Tampereen Teiskossa.',
      amenities: ['potable_water' as const],
    },
    {
      name: 'Pirunkirkko näköalapaikka',
      slug: 'pirunkirkko-nakoalapaikka',
      area: pirkanmaaId,
      category: 'viewpoint' as const,
      latitude: 61.996,
      longitude: 23.812,
      elevation: 195,
      summary: 'Karun kaunis kalliomaisema ja siirtolohkareluola Helvetinjärven jyrkänteillä.',
      amenities: ['lake_view' as const],
      trailhead: kankimakiTrailhead?.id,
    },
  ]

  const locationMap: Record<string, any> = {
    'savontie-trailhead': savontieTrailhead,
    'kankimaki-trailhead': kankimakiTrailhead,
  }
  for (const loc of locationsData) {
    if (!pirkanmaaId) break
    const existing = await payload.find({
      collection: 'nitf_locations',
      where: { slug: { equals: loc.slug } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      const created = await payload.create({
        collection: 'nitf_locations',
        data: loc,
      })
      locationMap[loc.slug] = created
      console.log(`✓ Created nitf_location: ${loc.name}`)
    } else {
      locationMap[loc.slug] = existing.docs[0]
    }
  }

  // 7. Seed NitfGearItems
  const gearItemsData = [
    {
      name: 'Akto 1P Tent',
      brand: 'Hilleberg',
      category: 'shelter_sleep' as const,
      weight_grams: 1700,
      spec_note: 'Kerlon 1200 fabric • 4-Season Solo Tunnel',
      notes: 'Proven in high Nordic gale winds and driving taiga snow.',
    },
    {
      name: 'OmniLite Ti Stove',
      brand: 'Primus',
      category: 'cook_water' as const,
      weight_grams: 340,
      spec_note: 'Titanium casing • White gas / Canister gas',
      notes: 'Burns white gas reliably down to -25°C in Finnish sub-zero conditions.',
    },
    {
      name: 'Kånken No. 2 Rucksack 30L',
      brand: 'Fjällräven',
      category: 'pack_apparel' as const,
      weight_grams: 950,
      spec_note: 'G-1000 HeavyDuty Eco',
      notes: 'Durable bushcraft and trail reconnaissance pack.',
    },
  ]

  const gearMap: Record<string, any> = {}
  for (const gear of gearItemsData) {
    const existing = await payload.find({
      collection: 'nitf_gear_items',
      where: { name: { equals: gear.name } },
      limit: 1,
    })
    if (existing.docs.length === 0) {
      const created = await payload.create({
        collection: 'nitf_gear_items',
        data: gear,
      })
      gearMap[gear.name] = created
      console.log(`✓ Created nitf_gear_item: ${gear.name}`)
    } else {
      gearMap[gear.name] = existing.docs[0]
    }
  }

  // 8. Seed NitfGearReviews
  const aktoId = gearMap['Akto 1P Tent']?.id
  if (aktoId) {
    const existingReview = await payload.find({
      collection: 'nitf_gear_reviews',
      where: { slug: { equals: 'hilleberg-akto-taiga-review' } },
      limit: 1,
    })
    if (existingReview.docs.length === 0) {
      await payload.create({
        collection: 'nitf_gear_reviews',
        data: {
          title: 'Hilleberg Akto: Four Seasons in the Finnish Taiga',
          slug: 'hilleberg-akto-taiga-review',
          gear_item: aktoId,
          status: 'published',
          topic: 'durability',
          published_at: '2026-03-01T12:00:00Z',
          duration_tested: '3 years, 45+ nights in Pirkanmaa backcountry',
          summary: 'The quintessential solo shelter for harsh Finnish winter and autumn conditions.',
          verdict: 'Indispensable gear for serious solo wilderness expeditions.',
          key_takeaways: [
            { takeaway: 'Exceptional wind and snow resistance in exposed boreal forests' },
            { takeaway: 'Quick all-in-one pitch keeps inner tent dry during downpours' },
          ],
        },
      })
      console.log('✓ Created nitf_gear_review: Hilleberg Akto')
    }
  }

  // 9. Seed NitfLoadouts
  let autumnSoloLoadout: any
  let autumnReconLoadout: any
  if (gearMap['Akto 1P Tent'] && gearMap['OmniLite Ti Stove'] && gearMap['Kånken No. 2 Rucksack 30L']) {
    const existingLoadout = await payload.find({
      collection: 'nitf_loadouts',
      where: { slug: { equals: 'autumn-taiga-solo' } },
      limit: 1,
    })
    if (existingLoadout.docs.length === 0) {
      autumnSoloLoadout = await payload.create({
        collection: 'nitf_loadouts',
        data: {
          title: 'Pirkanmaa Weekend Solo Loadout',
          slug: 'autumn-taiga-solo',
          season: 'autumn',
          temp_range: '-2°C to 8°C',
          description: 'Minimalist cold-weather setup for 2-3 day exploratory field trips in Birgitan polku and Helvetinjärvi.',
          items: [
            {
              item: gearMap['Akto 1P Tent'].id,
              status: 'packed',
              custom_note: 'Packed with 8 titanium V-pegs',
            },
            {
              item: gearMap['OmniLite Ti Stove'].id,
              status: 'packed',
              custom_note: '0.6L fuel bottle filled with white gas',
            },
            {
              item: gearMap['Kånken No. 2 Rucksack 30L'].id,
              status: 'worn',
              custom_note: 'Worn on back',
            },
          ],
        },
      })
      console.log('✓ Created nitf_loadout: Pirkanmaa Weekend Solo Loadout')
    } else {
      autumnSoloLoadout = existingLoadout.docs[0]
    }

    const existingRecon = await payload.find({
      collection: 'nitf_loadouts',
      where: { slug: { equals: 'helvetinjarvi-day-recon' } },
      limit: 1,
    })
    if (existingRecon.docs.length === 0) {
      autumnReconLoadout = await payload.create({
        collection: 'nitf_loadouts',
        data: {
          title: 'Helvetinjärvi Gorge & Ridge Recon Kit',
          slug: 'helvetinjarvi-day-recon',
          season: 'autumn',
          temp_range: '0°C to 10°C',
          description: 'Fast-moving day & shelter-to-shelter reconnaissance setup for rugged granite fault gorges.',
          items: [
            {
              item: gearMap['OmniLite Ti Stove'].id,
              status: 'packed',
              custom_note: 'Carried for hot coffee & trail rations at Helvetinkolu shelter',
            },
            {
              item: gearMap['Kånken No. 2 Rucksack 30L'].id,
              status: 'worn',
              custom_note: 'Primary day reconnaissance pack',
            },
          ],
        },
      })
      console.log('✓ Created nitf_loadout: Helvetinjärvi Gorge & Ridge Recon Kit')
    } else {
      autumnReconLoadout = existingRecon.docs[0]
    }
  }

  // 10. Seed NitfDispatches focused on Pirkanmaa
  const vahaRiuttaLoc = locationMap['vaha-riutta-laavu']
  const vahaKauasLoc = locationMap['vaha-kauas-laavu']
  const helvetinkoluLoc = locationMap['helvetinkolu-laavu']
  const savontieLoc = locationMap['savontie-trailhead']
  const kankimakiLoc = locationMap['kankimaki-trailhead']
  const kirskaanniemiLoc = locationMap['kirskaanniemi-laavu']
  const kintulammiLoc = locationMap['kintulammi-lahde']
  const pirunkirkkoLoc = locationMap['pirunkirkko-nakoalapaikka']

  // 10a. Multi-Location Dispatch (3 locations): Birgitan Polku Circuit
  if (savontieLoc && vahaRiuttaLoc && vahaKauasLoc) {
    const existingDispatch = await payload.find({
      collection: 'nitf_dispatches',
      where: { slug: { equals: 'birgitan-polku-circuit' } },
      limit: 1,
    })
    if (existingDispatch.docs.length === 0) {
      await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'Birgitan Polku Lake Circuit & Ridge Traverse',
          slug: 'birgitan-polku-circuit',
          status: 'published',
          published_at: '2026-10-10T09:15:00Z',
          excerpt: 'Three-stage autumn trek beginning at Savontie trailhead, traversing north along pine ridges to the double timber shelter at Vähä-Riutta, and concluding at the remote lakeside kota at Vähä-Kauas.',
          weather: '4°C • CRISP AUTUMN • BARO 1024 HPA',
          locations: [savontieLoc.id, vahaRiuttaLoc.id, vahaKauasLoc.id],
          loadout: autumnSoloLoadout?.id,
        },
      })
      console.log('✓ Created nitf_dispatch: Birgitan Polku Lake Circuit (3 locations)')
    } else if (autumnSoloLoadout && !existingDispatch.docs[0].loadout) {
      await payload.update({
        collection: 'nitf_dispatches',
        id: existingDispatch.docs[0].id,
        data: { loadout: autumnSoloLoadout.id },
      })
      console.log('✓ Linked Birgitan Polku dispatch to Pirkanmaa Weekend Solo Loadout')
    }
  }

  // 10b. Multi-Location Dispatch (5 locations): Helvetinjärvi & Pirkanmaa Grand Taiga Traverse
  if (kankimakiLoc && helvetinkoluLoc && pirunkirkkoLoc && kintulammiLoc && kirskaanniemiLoc) {
    const existingDispatch = await payload.find({
      collection: 'nitf_dispatches',
      where: { slug: { equals: 'helvetinjarvi-taiga-traverse' } },
      limit: 1,
    })
    if (existingDispatch.docs.length === 0) {
      await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'Helvetinjärvi & Pirkanmaa Grand Taiga Traverse',
          slug: 'helvetinjarvi-taiga-traverse',
          status: 'published',
          published_at: '2026-10-15T08:00:00Z',
          excerpt: 'Comprehensive five-point expedition surveying the fault valley staircase at Helvetinkolu, the precipitous cleft of Pirunkirkko, natural springheads at Kintulammi, and the rocky pine peninsula of Kirskaanniemi.',
          weather: '5°C • MIST & SPRUCE CANOPY • BARO 1018 HPA',
          locations: [
            kankimakiLoc.id,
            helvetinkoluLoc.id,
            pirunkirkkoLoc.id,
            kintulammiLoc.id,
            kirskaanniemiLoc.id,
          ],
          loadout: autumnReconLoadout?.id,
        },
      })
      console.log('✓ Created nitf_dispatch: Helvetinjärvi & Pirkanmaa Grand Taiga Traverse (5 locations)')
    } else if (autumnReconLoadout && !existingDispatch.docs[0].loadout) {
      await payload.update({
        collection: 'nitf_dispatches',
        id: existingDispatch.docs[0].id,
        data: { loadout: autumnReconLoadout.id },
      })
      console.log('✓ Linked Helvetinjärvi dispatch to Helvetinjärvi Gorge & Ridge Recon Kit')
    }
  }

  if (vahaRiuttaLoc) {
    const existingDispatch = await payload.find({
      collection: 'nitf_dispatches',
      where: { slug: { equals: 'autumn-night-vaha-riutta' } },
      limit: 1,
    })
    if (existingDispatch.docs.length === 0) {
      await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'Autumn Night at Vähä-Riutan Laavu',
          slug: 'autumn-night-vaha-riutta',
          status: 'published',
          published_at: '2026-10-04T06:40:00Z',
          excerpt: 'Overnight solo camp at the Vähä-Riutta double lean-to nestled between Iso-Riutta and Vähä-Riutta lakes along Birgitan polku in Lempäälä.',
          weather: '2°C • CALM • BARO 1022 HPA',
          locations: [vahaRiuttaLoc.id],
        },
      })
      console.log('✓ Created nitf_dispatch: Autumn Night at Vähä-Riutan Laavu')
    }
  }

  if (vahaKauasLoc) {
    const existingDispatch = await payload.find({
      collection: 'nitf_dispatches',
      where: { slug: { equals: 'winter-trek-vaha-kauas' } },
      limit: 1,
    })
    if (existingDispatch.docs.length === 0) {
      await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'Winter Reconnaissance at Vähä-Kauas Laavu',
          slug: 'winter-trek-vaha-kauas',
          status: 'published',
          published_at: '2026-10-18T14:20:00Z',
          excerpt: 'Early season frost survey inspecting the lakeside kota and firewood reserve at Vähä-Kauas on Birgitan polku.',
          weather: '-3°C • LIGHT SNOW • BARO 1019 HPA',
          locations: [vahaKauasLoc.id],
        },
      })
      console.log('✓ Created nitf_dispatch: Winter Reconnaissance at Vähä-Kauas Laavu')
    }
  }

  if (helvetinkoluLoc) {
    const existingDispatch = await payload.find({
      collection: 'nitf_dispatches',
      where: { slug: { equals: 'surveying-glacial-cleft-helvetinkolu' } },
      limit: 1,
    })
    if (existingDispatch.docs.length === 0) {
      await payload.create({
        collection: 'nitf_dispatches',
        data: {
          title: 'Surveying the Granite Cleft of Helvetinkolu',
          slug: 'surveying-glacial-cleft-helvetinkolu',
          status: 'draft',
          excerpt: 'Route notes assessing ice accumulation along the 40-meter granite fault cleft stairs in Helvetinjärvi.',
          weather: '0°C • OVERCAST',
          locations: [helvetinkoluLoc.id],
        },
      })
      console.log('✓ Created nitf_dispatch: Surveying the Granite Cleft of Helvetinkolu')
    }
  }

  console.log('--- Basecamp CMS Database Seed Finished Successfully ---')
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err)
      process.exit(1)
    })
}
