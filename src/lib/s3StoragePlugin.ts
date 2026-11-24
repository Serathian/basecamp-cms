import path from 'path'
import { s3Storage, type S3StorageOptions } from '@payloadcms/storage-s3'

type S3CollectionConfig = NonNullable<S3StorageOptions['collections']['nitf_media']>
type GenerateFileURL = Exclude<S3CollectionConfig, true>['generateFileURL']

export function createPublicFileUrlGenerator(publicBaseUrl: string): NonNullable<GenerateFileURL> {
  const normalizedBase = publicBaseUrl.replace(/\/+$/, '')
  return ({ filename, prefix }) => {
    const encodedName = encodeURIComponent(filename)
    const key = prefix ? path.posix.join(prefix, encodedName) : encodedName
    return `${normalizedBase}/${key}`
  }
}

export function buildS3StoragePlugin(env: NodeJS.ProcessEnv = process.env) {
  const bucket = env.S3_BUCKET?.trim()
  const accessKeyId = env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim()
  const enabled = Boolean(bucket && accessKeyId && secretAccessKey)
  const publicUrl = env.S3_PUBLIC_URL?.trim()

  const collectionBase = publicUrl
    ? {
        disablePayloadAccessControl: true as const,
        generateFileURL: createPublicFileUrlGenerator(publicUrl),
      }
    : {}

  return s3Storage({
    enabled,
    alwaysInsertFields: true,
    bucket: bucket || 'disabled',
    acl: env.S3_ACL === 'public-read' ? 'public-read' : undefined,
    collections: {
      nitf_media: {
        prefix: 'nitf_media',
        ...collectionBase,
      },
      jr_media: {
        prefix: 'jr_media',
        ...collectionBase,
      },
    },
    config: {
      endpoint: env.S3_ENDPOINT?.trim() || undefined,
      region: env.S3_REGION?.trim() || 'auto',
      forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    },
  })
}
