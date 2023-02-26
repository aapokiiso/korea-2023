import { GooglePhotosMediaItem, isPhoto } from './google-photos-api'
import * as fs from 'fs/promises'
import * as crypto from 'node:crypto'
import getConfig from 'next/config'
import * as mime from 'mime-types'

const publicDir = getConfig().serverRuntimeConfig.publicDir
const cacheDir = `${publicDir}/media`
const cacheUrlPath = '/media'

enum PhotoRole {
  THUMBNAIL = 'thumbnail',
  TIMELINE = 'timeline',
  FULLSCREEN = 'fullscreen',
}

const PHOTO_WIDTH = {
  [PhotoRole.THUMBNAIL]: 256,
  [PhotoRole.TIMELINE]: 1080,
  [PhotoRole.FULLSCREEN]: 2560,
}

export interface CachedGooglePhotosMediaItem extends GooglePhotosMediaItem {
  thumbnailUrl?: string,
  thumbnailMediaMetadata?: {
    width: number,
    height: number,
  },
  timelineUrl?: string,
  timelineMediaMetadata?: {
    width: number,
    height: number,
  },
  fullscreenUrl?: string,
  fullscreenMediaMetadata?: {
    width: number,
    height: number,
  }
}

const writeEmptyCacheDir = async (): Promise<void> => {
  await fs.rm(cacheDir, { recursive: true, force: true })
  await fs.mkdir(cacheDir)
  await fs.mkdir(`${cacheDir}/${PhotoRole.THUMBNAIL}`)
  await fs.mkdir(`${cacheDir}/${PhotoRole.TIMELINE}`)
  await fs.mkdir(`${cacheDir}/${PhotoRole.FULLSCREEN}`)
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
    .update(mediaItems.map(({ id }) => id).sort().join(','))
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

const getAspectRatio = (item: GooglePhotosMediaItem): number =>
  Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)

const writePhotoToCache = async (photo: GooglePhotosMediaItem, role: PhotoRole, buff: Buffer, fileExtension: string): Promise<void> => {
  await fs.writeFile(`${cacheDir}/${role}/${photo.id}.${fileExtension}`, buff)
}

const readConfigFromCache = async (): Promise<Record<string, Partial<CachedGooglePhotosMediaItem>>|null> => {
  try {
    const json = await fs.readFile(`${cacheDir}/config.json`, { encoding: 'utf8' })

    return JSON.parse(json)
  } catch (e) {
    console.error(e)

    return null
  }
}

const writeConfigToCache = async (config: Record<string, Partial<CachedGooglePhotosMediaItem>>): Promise<void> => {
  try {
    await fs.writeFile(`${cacheDir}/config.json`, JSON.stringify(config))
  } catch (e) {
    console.error(e)
  }
}

export const cacheItems = async (mediaItems: GooglePhotosMediaItem[]): Promise<CachedGooglePhotosMediaItem[]> => {
  const version = calculateVersion(mediaItems)
  const cacheVersion = await readVersionFromCache()

  let cachedMediaItems: CachedGooglePhotosMediaItem[] = []
  if (version !== cacheVersion) {
    const cacheConfig: Record<string, Partial<CachedGooglePhotosMediaItem>> = {}

    await writeEmptyCacheDir()

    for (const mediaItem of mediaItems) {
      cacheConfig[mediaItem.id] = {}

      if (isPhoto(mediaItem)) {
        const aspectRatio = getAspectRatio(mediaItem)
        const requests = [
          {
            role: PhotoRole.THUMBNAIL,
            aspectRatio: 1,
            request: fetch(getPhotoUrl(mediaItem, { width: PHOTO_WIDTH[PhotoRole.THUMBNAIL], height: PHOTO_WIDTH[PhotoRole.THUMBNAIL], isCrop: true })),
          },
          {
            role: PhotoRole.TIMELINE,
            aspectRatio,
            request: fetch(getPhotoUrl(mediaItem, { width: PHOTO_WIDTH[PhotoRole.TIMELINE] })),
          },
          {
            role: PhotoRole.FULLSCREEN,
            aspectRatio,
            request: fetch(getPhotoUrl(mediaItem, { width: PHOTO_WIDTH[PhotoRole.FULLSCREEN] })),
          },
        ]

        await Promise.all(requests.map(async ({ role, aspectRatio, request }) => {
          try {
            const response = await request
            const buff = Buffer.from(await response.arrayBuffer())

            const mimeType = response.headers.get('Content-Type')
            const fileExtension = mimeType && mime.extension(mimeType)

            if (buff.length && fileExtension) {
              await writePhotoToCache(mediaItem, role, buff, fileExtension)
              const width = PHOTO_WIDTH[role]

              cacheConfig[mediaItem.id][`${role}Url`] = `${cacheUrlPath}/${role}/${mediaItem.id}.${fileExtension}`
              cacheConfig[mediaItem.id][`${role}MediaMetadata`] = {
                width: width,
                height: width * aspectRatio,
              }
            }
          } catch (e) {
            console.error(e)
          }
        }))
      } else {
        // TODO: video cache
      }

      cachedMediaItems = [
        ...cachedMediaItems,
        {
          ...mediaItem,
          ...cacheConfig[mediaItem.id],
        },
      ]
    }

    writeVersionToCache(version)
    writeConfigToCache(cacheConfig)
  } else {
    const cacheConfig = await readConfigFromCache()

    cachedMediaItems = cacheConfig
      ? mediaItems.map(mediaItem => ({
        ...mediaItem,
        ...cacheConfig[mediaItem.id],
      }))
      : []
  }

  return cachedMediaItems
}
