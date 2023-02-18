import { GooglePhotosMediaItem, isPhoto } from './google-photos-api'
import * as fs from 'fs/promises'
import * as crypto from 'node:crypto'
import getConfig from 'next/config'

const publicDir = getConfig().serverRuntimeConfig.publicDir
const cacheDir = `${publicDir}/media`

enum CachedPhotoRole {
  THUMBNAIL = 'thumbnail',
  TIMELINE = 'timeline',
  FULLSCREEN = 'fullscreen'
}

const writeEmptyCacheDir = async (): Promise<void> => {
  await fs.rm(cacheDir, { recursive: true, force: true })
  await fs.mkdir(cacheDir)
  await fs.mkdir(`${cacheDir}/${CachedPhotoRole.THUMBNAIL}`)
  await fs.mkdir(`${cacheDir}/${CachedPhotoRole.TIMELINE}`)
  await fs.mkdir(`${cacheDir}/${CachedPhotoRole.FULLSCREEN}`)
}

const readVersionFromCache = async (): Promise<string|null> => {
  try {
    return await fs.readFile(`${cacheDir}/version.txt`, { encoding: 'utf8' })
  } catch (e) {
    console.error(e)

    return null
  }
}

const writeVersionToCache = async (version: string): Promise<void> => {
  try {
    await fs.writeFile(`${cacheDir}/version.txt`, version)
  } catch (e) {
    console.error(e)
  }
}

const calculateVersion = (mediaItems: GooglePhotosMediaItem[]): string => {
  return crypto.createHash('sha256')
    .update(mediaItems.map(({ id }) => id).join(','))
    .digest('hex')
}

const getPhotoUrl = (photo: GooglePhotosMediaItem, { width, height, isCrop = false }: {width?: number, height?: number, isCrop?: boolean}): string => {
  const params: string[] = []

  if (width) {
    params.push(`w${width}`)
  }

  if (height) {
    params.push(`h${height}`)
  }

  if(isCrop) {
    params.push('c')
  }

  return `${photo.baseUrl}` + (params.length ? `=${params.join('-')}` : '')
}

const writePhotoToCache = async (photo: GooglePhotosMediaItem, role: CachedPhotoRole, buff: Buffer): Promise<void> => {
  await fs.writeFile(`${cacheDir}/${role}/${photo.id}`, buff)
}

export const cacheItems = async (mediaItems: GooglePhotosMediaItem[]): Promise<void> => {
  const version = calculateVersion(mediaItems)
  const cacheVersion = await readVersionFromCache()

  if (version !== cacheVersion) {
    await writeEmptyCacheDir()

    for (const mediaItem of mediaItems) {
      if (isPhoto(mediaItem)) {
        const requests = [
          { role: CachedPhotoRole.THUMBNAIL, request: fetch(getPhotoUrl(mediaItem, { width: 256, height: 256, isCrop: true })) },
          { role: CachedPhotoRole.TIMELINE, request: fetch(getPhotoUrl(mediaItem, { width: 1080 })) },
          { role: CachedPhotoRole.FULLSCREEN, request: fetch(getPhotoUrl(mediaItem, { width: 2560 })) },
        ]

        await Promise.all(requests.map(async ({ role, request }) => {
          try {
            const response = await request
            const buff = Buffer.from(await response.arrayBuffer())

            await writePhotoToCache(mediaItem, role, buff)
          } catch (e) {
            console.error(e)

            // TODO: error handling
          }
        }))
      } else {
        // TODO: video cache
      }
    }

    writeVersionToCache(version)
  }
}
