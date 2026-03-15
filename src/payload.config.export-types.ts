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
import { Media } from './collections/Media'

// Shared
import { Authors } from './collections/shared/Authors'
import { Tags } from './collections/shared/Tags'

// jake-reddy.com
import { JrPosts } from './collections/jake-reddy/JrPosts'

// nerdintheforest.com
import { NitfPosts } from './collections/nerdintheforest/NitfPosts'
import { NitfTrails } from './collections/nerdintheforest/NitfTrails'
import { NitfWaypoints } from './collections/nerdintheforest/NitfWaypoints'
import { NitfLocations } from './collections/nerdintheforest/NitfLocations'

// reddyontheroad.com
import { RotrPosts } from './collections/reddyontheroad/RotrPosts'
import { RotrLocations } from './collections/reddyontheroad/RotrLocations'

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
    Media,
    // Shared
    Authors,
    Tags,
    // jake-reddy.com
    JrPosts,
    // nerdintheforest.com
    NitfPosts,
    NitfTrails,
    NitfWaypoints,
    NitfLocations,
    // reddyontheroad.com
    RotrPosts,
    RotrLocations,
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
