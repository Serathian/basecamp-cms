import 'dotenv/config'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL!

const technologies = [
  // Languages
  { name: 'TypeScript', category: 'language', description: 'Typed superset of JavaScript that compiles to plain JS. Primary language for all frontend and backend work.' },
  { name: 'Python', category: 'language', description: 'General-purpose language used for scripting, data work, and backend services.' },
  { name: 'SQL', category: 'language', description: 'Relational query language used across PostgreSQL and other databases.' },

  // Frameworks
  { name: 'Next.js', category: 'framework', description: 'React framework with file-based routing, server components, and built-in API routes.' },
  { name: 'React', category: 'framework', description: 'UI library for building component-based web interfaces.' },
  { name: 'Payload CMS', category: 'framework', description: 'Headless CMS with a code-first config, used as the content backend for this site.' },

  // Databases
  { name: 'PostgreSQL', category: 'database', description: 'Primary relational database. Used for all Payload collections and application data.' },
  { name: 'Redis', category: 'database', description: 'In-memory data store used for caching and session management.' },

  // Infrastructure
  { name: 'Docker', category: 'infrastructure', description: 'Containerisation platform used for local development and CI/CD pipelines.' },
  { name: 'GitHub Actions', category: 'infrastructure', description: 'CI/CD platform for automated testing, linting, and deployments.' },

  // Tools
  { name: 'Vitest', category: 'tool', description: 'Fast unit and integration test runner built on Vite.' },
  { name: 'ESLint', category: 'tool', description: 'Static analysis tool for catching code quality issues and enforcing style.' },

  // Libraries
  { name: 'Tailwind CSS', category: 'library', description: 'Utility-first CSS framework for rapid UI development.' },
  { name: 'Zod', category: 'library', description: 'TypeScript-first schema validation library.' },
]

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL })

  try {
    // Check migration has run
    const tables = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jr_technologies'`
    )
    if (tables.rows.length === 0) {
      console.error('jr_technologies table not found — run migrations first')
      process.exit(1)
    }

    // Check existing count
    const countRes = await pool.query(`SELECT count(*)::int FROM jr_technologies`)
    const count = countRes.rows[0].count
    if (count > 0) {
      console.log(`Table already has ${count} rows. Skipping.`)
      process.exit(0)
    }

    const now = new Date().toISOString()
    for (const t of technologies) {
      await pool.query(
        `INSERT INTO jr_technologies (name, category, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
        [t.name, t.category, t.description, now, now]
      )
    }
    console.log(`✓ Inserted ${technologies.length} technologies`)
  } finally {
    await pool.end()
  }
}

seed().catch(err => { console.error(err); process.exit(1) })
