// Config used only for generating the exportable types package.
// Identical to payload.config.ts but with declare: false so the
// generated file has no 'declare module "payload"' augmentation —
// that augmentation requires the payload package to be installed,
// which consuming frontends won't have.
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/users/Users'
import { Authors } from './collections/shared/Authors'

// jake-reddy.com
import { JrMedia } from './collections/jake-reddy/JrMedia'
import { JrTags } from './collections/jake-reddy/JrTags'
import { JrPosts } from './collections/jake-reddy/JrPosts'

// nerdintheforest.com
import { NitfMedia } from './collections/nerdintheforest/NitfMedia'
import { NitfTags } from './collections/nerdintheforest/NitfTags'
import { NitfPosts } from './collections/nerdintheforest/NitfPosts'
import { NitfTrails } from './collections/nerdintheforest/NitfTrails'
import { NitfTrips } from './collections/nerdintheforest/NitfTrips'
import { NitfDestinations } from './collections/nerdintheforest/NitfDestinations'
import { NitfPoi } from './collections/nerdintheforest/NitfPoi'
import { NitfPoiTypes } from './collections/nerdintheforest/NitfPoiTypes'
import { NitfPlaces } from './collections/nerdintheforest/NitfPlaces'

// reddyontheroad.com
import { RotrMedia } from './collections/reddyontheroad/RotrMedia'
import { RotrTags } from './collections/reddyontheroad/RotrTags'
import { RotrDays } from './collections/reddyontheroad/RotrDays'
import { RotrPlaceTypes } from './collections/reddyontheroad/RotrPlaceTypes'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Authors,
    // jake-reddy.com
    JrMedia,
    JrTags,
    JrPosts,
    // nerdintheforest.com
    NitfMedia,
    NitfTags,
    NitfPosts,
    NitfTrails,
    NitfTrips,
    NitfDestinations,
    NitfPoi,
    NitfPoiTypes,
    NitfPlaces,
    // reddyontheroad.com
    RotrMedia,
    RotrTags,
    RotrDays,
    RotrPlaceTypes,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types-export.ts'),
    declare: false,
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    extensions: ['postgis'],
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false,
  }),
  sharp,
  plugins: [],
})
