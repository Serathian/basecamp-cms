import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/users/Users'
import { Authors } from './collections/shared/Authors'
import { JrMedia } from './collections/jake-reddy/JrMedia'
import { JrPosts } from './collections/jake-reddy/JrPosts'
import { JrProjects } from './collections/jake-reddy/JrProjects'
import { NitfMedia } from './collections/nerdintheforest/NitfMedia'
import { NitfAreas } from './collections/nerdintheforest/NitfAreas'
import { NitfLocations } from './collections/nerdintheforest/NitfLocations'
import { NitfDispatches } from './collections/nerdintheforest/NitfDispatches'
import { NitfGearItems } from './collections/nerdintheforest/NitfGearItems'
import { NitfGearReviews } from './collections/nerdintheforest/NitfGearReviews'
import { NitfLoadouts } from './collections/nerdintheforest/NitfLoadouts'

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
    JrMedia,
    JrPosts,
    JrProjects,
    NitfMedia,
    NitfAreas,
    NitfLocations,
    NitfDispatches,
    NitfGearItems,
    NitfGearReviews,
    NitfLoadouts,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-must-be-at-least-32-chars-long',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URL ||
        process.env.DATABASE_URI ||
        'postgresql://payload:payload@localhost:5432/payload',
    },
    extensions: ['postgis'],
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false,
  }),
  sharp,
  plugins: [],
})
