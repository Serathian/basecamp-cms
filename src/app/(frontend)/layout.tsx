import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Headless CMS admin and REST API for Jake Reddy web properties.',
  title: 'Basecamp CMS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
