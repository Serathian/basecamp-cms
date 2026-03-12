const published = ({ req: { user } }: any) => {
  // Authenticated users see everything (drafts + published)
  if (user) return true

  // Unauthenticated users see only published
  return { status: { equals: 'published' } }
}

export default published
