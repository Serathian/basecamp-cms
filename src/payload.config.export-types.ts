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
import { JrPosts } from './collections/jake-reddy/JrPosts'
import { JrProjects } from './collections/jake-reddy/JrProjects'

// nerdintheforest.com
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
    // jake-reddy.com
    JrMedia,
    JrPosts,
    JrProjects,
    // nerdintheforest.com
    NitfMedia,
    NitfAreas,
    NitfLocations,
    NitfDispatches,
    NitfGearItems,
    NitfGearReviews,
    NitfLoadouts,
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
