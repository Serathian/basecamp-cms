import 'dotenv/config'
import { Pool } from 'pg'

// Tech IDs from jr_technologies
const T = {
  TypeScript: 1,
  Python: 2,
  SQL: 3,
  NextJs: 4,
  React: 5,
  PayloadCMS: 6,
  PostgreSQL: 7,
  Redis: 8,
  Docker: 9,
  GitHubActions: 10,
  Vitest: 11,
  ESLint: 12,
  TailwindCSS: 13,
  Zod: 14,
}

const AUTHOR_ID = 1 // Jake Reddy

const posts = [
  {
    status: 'published',
    title: 'Building My Personal Site with Next.js and Payload CMS',
    slug: 'building-personal-site-nextjs-payload-cms',
    published_at: '2026-02-01T10:00:00Z',
    excerpt: 'How I built a fully type-safe personal website and blog using Next.js 15, Payload CMS 3, and PostgreSQL — with a focus on developer experience and content flexibility.',
    body: `After years of using off-the-shelf CMS platforms, I decided to build my own stack from scratch. The goal was simple: full TypeScript end-to-end, no compromises on DX, and a content model I actually control.

The core is Payload CMS v3, which runs directly inside the Next.js app router. This means the admin UI, API, and frontend all share the same process — no separate CMS server to maintain. The content schema is defined in TypeScript, and Payload generates the database migrations and API types automatically.

PostgreSQL is the database, managed with Drizzle ORM under the hood (via Payload's db-postgres adapter). The whole thing is containerised with Docker and deployed via GitHub Actions.

The biggest win has been the type safety: every collection field is reflected in the generated \`payload-types.ts\`, so the frontend always knows exactly what shape the API returns.`,
    project_type: null,
    project_status: null,
    github_url: null,
    live_url: 'https://jakereddy.dev',
    featured: true,
    sort: 1,
    reading_time_minutes: 6,
    seo_title: 'Building My Personal Site with Next.js and Payload CMS',
    seo_description: 'A walkthrough of the tech stack behind jakereddy.dev — Next.js 15, Payload CMS 3, PostgreSQL, and full TypeScript end-to-end.',
    tech_stack: [T.NextJs, T.React, T.PayloadCMS, T.TypeScript, T.PostgreSQL, T.TailwindCSS, T.Docker, T.GitHubActions],
  },
  {
    status: 'published',
    title: 'Basecamp CMS: A Type-Safe Content Platform',
    slug: 'basecamp-cms-type-safe-content-platform',
    published_at: '2026-01-15T09:00:00Z',
    excerpt: 'Basecamp CMS is the open-source content backend powering this site — a Payload CMS 3 project with a GSD-driven development workflow, full integration test coverage, and Docker-based local development.',
    body: `Basecamp CMS is what runs behind jakereddy.dev. It's a Payload CMS 3 application that I've built phase-by-phase using the GSD (Get Shit Done) workflow — a structured approach to AI-assisted development that emphasises atomic commits, wave-based execution, and test-first planning.

The project has several content areas: Nerd in the Forest (hiking/outdoors content with PostGIS geospatial queries), Jake Reddy (personal blog and project portfolio), and a shared Users/Media area.

Each feature ships with integration tests via Vitest, verified against a real PostgreSQL database — no mocks. The test suite currently covers over 70 integration tests across 7 files.`,
    project_type: 'open-source',
    project_status: 'active',
    github_url: 'https://github.com/jakereddy/basecamp-cms',
    live_url: null,
    featured: true,
    sort: 2,
    reading_time_minutes: 5,
    seo_title: 'Basecamp CMS — Open Source Payload CMS Starter',
    seo_description: 'An open-source Payload CMS 3 project with full TypeScript, PostgreSQL, Docker, and GSD-driven development.',
    tech_stack: [T.TypeScript, T.PayloadCMS, T.PostgreSQL, T.Docker, T.Vitest, T.GitHubActions, T.ESLint],
  },
  {
    status: 'published',
    title: 'Why I Switched from Jest to Vitest',
    slug: 'switching-from-jest-to-vitest',
    published_at: '2025-11-20T08:00:00Z',
    excerpt: 'Vitest is Jest-compatible, runs in parallel by default, and starts in a fraction of the time. Here\'s how the migration went and what surprised me.',
    body: `I'd been using Jest on TypeScript projects for years and had grown used to the setup overhead: ts-jest or babel-jest, manual module name mappings, slow cold starts. Vitest promised a drop-in replacement that was faster and simpler to configure.

The migration was mostly painless. The API is identical for the common cases — describe, it, expect, vi.mock all work the same way. The main friction was around some edge cases with module mocking and ESM interop, but those were well-documented.

The real wins: startup time dropped from ~4s to ~0.6s on my integration test suite, and the watch mode is noticeably snappier. The TypeScript config is also simpler — no need for a separate transform step.

If you're on Jest and not wedded to any of its specific quirks, Vitest is worth the ~2 hours it'll take to migrate a medium-sized project.`,
    project_type: null,
    project_status: null,
    github_url: null,
    live_url: null,
    featured: false,
    sort: 3,
    reading_time_minutes: 4,
    seo_title: 'Switching from Jest to Vitest — What I Learned',
    seo_description: 'A practical guide to migrating from Jest to Vitest on a TypeScript project, including the gotchas and the wins.',
    tech_stack: [T.TypeScript, T.Vitest],
  },
  {
    status: 'published',
    title: 'PostGIS for Hikers: Geospatial Queries in PostgreSQL',
    slug: 'postgis-geospatial-queries-postgresql',
    published_at: '2025-10-05T07:00:00Z',
    excerpt: 'Using PostGIS extensions in PostgreSQL to power the Nerd in the Forest trail and POI discovery features — nearest-point queries, geometry hooks, and spatial indexes.',
    body: `The Nerd in the Forest section of this site tracks hiking trips, destinations, and points of interest. A core feature is "nearby" discovery — given a location, find the closest POIs within a radius. That's where PostGIS comes in.

PostGIS adds geometry and geography types to PostgreSQL, along with spatial functions like ST_DWithin (distance filter), ST_Distance (exact distance), and ST_MakePoint (coordinate construction). With a GIST spatial index, these queries stay fast even as the dataset grows.

The tricky part was automating geometry column population. I implemented a database trigger that fires on INSERT/UPDATE of lat/lng columns and automatically computes the PostGIS geometry value. This keeps the application layer clean — you just write coordinates, the database handles the geometry.

The trigger pattern turned out to be simpler than I expected and works nicely with Payload's hooks system.`,
    project_type: null,
    project_status: null,
    github_url: null,
    live_url: null,
    featured: false,
    sort: 4,
    reading_time_minutes: 7,
    seo_title: 'PostGIS for Hikers: Geospatial Queries in PostgreSQL',
    seo_description: 'How I used PostGIS to power nearest-POI queries and geometry triggers for a hiking content platform built on Payload CMS and PostgreSQL.',
    tech_stack: [T.PostgreSQL, T.SQL, T.TypeScript, T.PayloadCMS],
  },
  {
    status: 'draft',
    title: 'CI/CD with GitHub Actions and Docker: My Current Setup',
    slug: 'ci-cd-github-actions-docker',
    published_at: null,
    excerpt: 'A walkthrough of the build-and-push pipeline I use for containerised Next.js applications — caching strategies, secrets management, and the one gotcha that cost me a day.',
    body: `Draft content — work in progress.`,
    project_type: null,
    project_status: null,
    github_url: null,
    live_url: null,
    featured: false,
    sort: 5,
    reading_time_minutes: 8,
    seo_title: null,
    seo_description: null,
    tech_stack: [T.Docker, T.GitHubActions, T.TypeScript],
  },
]

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const now = new Date().toISOString()

    for (const post of posts) {
      const existing = await pool.query(`SELECT id FROM jr_posts WHERE slug = $1`, [post.slug])
      if (existing.rows.length > 0) {
        console.log(`  skip (exists): ${post.slug}`)
        continue
      }
      const res = await pool.query(
        `INSERT INTO jr_posts
          (status, title, slug, published_at, excerpt, body,
           project_type, project_status, github_url, live_url,
           featured, sort, author_id, reading_time_minutes,
           seo_title, seo_description, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          post.status, post.title, post.slug, post.published_at,
          post.excerpt, post.body, post.project_type, post.project_status,
          post.github_url, post.live_url, post.featured, post.sort,
          AUTHOR_ID, post.reading_time_minutes,
          post.seo_title, post.seo_description, now, now,
        ]
      )

      const postId = res.rows[0].id

      for (let i = 0; i < post.tech_stack.length; i++) {
        await pool.query(
          `INSERT INTO jr_posts_rels ("order", parent_id, path, jr_technologies_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [i + 1, postId, 'tech_stack', post.tech_stack[i], now, now]
        )
      }

      console.log(`✓ ${post.status === 'draft' ? '[draft] ' : ''}${post.title}`)
    }

    console.log(`\n✓ Inserted ${posts.length} posts`)
  } finally {
    await pool.end()
  }
}

seed().catch(err => { console.error(err); process.exit(1) })
