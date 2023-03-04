import { GooglePhotosMediaItem, GooglePhotosVideoMetadata } from './google-photos-api'
import * as fs from 'fs/promises'
import * as crypto from 'node:crypto'
import getConfig from 'next/config'
import * as mime from 'mime-types'
import { isPhoto, isVideo } from './google-photos-media-type'
import fetchBuilder from 'fetch-retry'

const fetch = fetchBuilder(global.fetch)

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

export interface GooglePhotosPhotoCache {
  thumbnail: {
    url: string,
    metadata: {
      width: number,
      height: number,
    },
  },
  timeline: {
    url: string,
    metadata: {
      width: number,
      height: number,
    },
  },
  fullscreen: {
    url: string,
    metadata: {
      width: number,
      height: number,
    },
  },
}

export interface GooglePhotosVideoCache {
  video: {
    url: string,
  },
  posterPhoto: GooglePhotosPhotoCache,
}

export interface CachedGooglePhotosMediaItem extends GooglePhotosMediaItem {
  cache?: GooglePhotosPhotoCache|GooglePhotosVideoCache,
}

const writeEmptyCacheDir = async (): Promise<void> => {
  await fs.rm(cacheDir, { recursive: true, force: true })
  await fs.mkdir(cacheDir)
  await fs.mkdir(`${cacheDir}/${PhotoRole.THUMBNAIL}`)
  await fs.mkdir(`${cacheDir}/${PhotoRole.TIMELINE}`)
  await fs.mkdir(`${cacheDir}/${PhotoRole.FULLSCREEN}`)
  await fs.mkdir(`${cacheDir}/video`)
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

  // Removes video play button overlay from video poster images
  params.push('no')

  return photo.baseUrl + (params.length ? `=${params.join('-')}` : '')
}

const getVideoUrl = (video: GooglePhotosMediaItem): string => {
  return video.baseUrl + '=dv'
}

const isVideoReady = (mediaItem: GooglePhotosMediaItem): boolean => {
  if (isVideo(mediaItem)) {
    const metadata = mediaItem.mediaMetadata as GooglePhotosVideoMetadata

    return metadata.video.status === 'READY'
  }

  return false
}

const getAspectRatio = (item: GooglePhotosMediaItem): number =>
  Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)

const writePhotoToCache = async (photo: GooglePhotosMediaItem, role: PhotoRole, buff: Buffer, fileExtension: string): Promise<void> => {
  await fs.writeFile(`${cacheDir}/${role}/${photo.id}.${fileExtension}`, buff)
}

const writeVideoToCache = async (video: GooglePhotosMediaItem, buff: Buffer, fileExtension: string): Promise<void> => {
  await fs.writeFile(`${cacheDir}/video/${video.id}.${fileExtension}`, buff)
}

const readConfigFromCache = async (): Promise<Record<string, GooglePhotosPhotoCache|GooglePhotosVideoCache>|null> => {
  try {
    const json = await fs.readFile(`${cacheDir}/config.json`, { encoding: 'utf8' })

    return JSON.parse(json)
  } catch (e) {
    console.error(e)

    return null
  }
}

const writeConfigToCache = async (config: Record<string, GooglePhotosPhotoCache|GooglePhotosVideoCache>): Promise<void> => {
  try {
    await fs.writeFile(`${cacheDir}/config.json`, JSON.stringify(config))
  } catch (e) {
    console.error(e)
  }
}

const fetchWithBackOff = (url: string): Promise<Response> => {
  return fetch(url, {
    retryOn: function(attempt, error, response) {
      if (attempt >= 3) return false

      const statusCode = response?.status ?? 0
      if (error !== null || statusCode === 429 || statusCode >= 500) {
        console.warn(`Retrying media cache request, attempt number ${attempt + 1}, URL ${url}`)

        return true
      }

      return false
    },
    retryDelay(attempt) {
      return Math.pow(2, attempt) * 1000
    },
  })
}

export const cacheItems = async (mediaItems: GooglePhotosMediaItem[]): Promise<CachedGooglePhotosMediaItem[]> => {
  const version = calculateVersion(mediaItems)
  const cacheVersion = await readVersionFromCache()

  let cachedMediaItems: CachedGooglePhotosMediaItem[] = []
  if (version !== cacheVersion) {
    const cacheConfig: Record<string, GooglePhotosPhotoCache|GooglePhotosVideoCache> = {}

    await writeEmptyCacheDir()

    for (const mediaItem of mediaItems) {
      const aspectRatio = getAspectRatio(mediaItem)
      const requests = [
        {
          role: PhotoRole.THUMBNAIL,
          aspectRatio: 1,
          request: fetchWithBackOff(getPhotoUrl(mediaItem, { width: PHOTO_WIDTH[PhotoRole.THUMBNAIL], height: PHOTO_WIDTH[PhotoRole.THUMBNAIL], isCrop: true })),
        },
        {
          role: PhotoRole.TIMELINE,
          aspectRatio,
          request: fetchWithBackOff(getPhotoUrl(mediaItem, { width: PHOTO_WIDTH[PhotoRole.TIMELINE] })),
        },
        {
          role: PhotoRole.FULLSCREEN,
          aspectRatio,
          request: fetchWithBackOff(getPhotoUrl(mediaItem, { width: PHOTO_WIDTH[PhotoRole.FULLSCREEN] })),
        },
      ]

      const [thumbnailConfig, timelineConfig, fullscreenConfig] = await Promise.all(
        requests.map(async ({ role, aspectRatio, request }) => {
          try {
            const response = await request
            const buff = Buffer.from(await response.arrayBuffer())

            const mimeType = response.headers.get('Content-Type')
            const fileExtension = mimeType && mime.extension(mimeType)

            if (buff.length && fileExtension) {
              await writePhotoToCache(mediaItem, role, buff, fileExtension)
              const width = PHOTO_WIDTH[role]

              return {
                url: `${cacheUrlPath}/${role}/${mediaItem.id}.${fileExtension}`,
                metadata: {
                  width: width,
                  height: width * aspectRatio,
                },
              }
            }
          } catch (e) {
            console.error(e)
          }
        })
      )

      let mediaItemCacheConfig: GooglePhotosPhotoCache|GooglePhotosVideoCache|null = null
      if (thumbnailConfig && timelineConfig && fullscreenConfig) {
        if (isPhoto(mediaItem)) {
          mediaItemCacheConfig = {
            thumbnail: thumbnailConfig,
            timeline: timelineConfig,
            fullscreen: fullscreenConfig,
          }
        } else if (isVideo(mediaItem) && isVideoReady(mediaItem)) {
          try {
            const response = await fetchWithBackOff(getVideoUrl(mediaItem))
            const buff = Buffer.from(await response.arrayBuffer())

            const mimeType = response.headers.get('Content-Type')
            const fileExtension = mimeType && mime.extension(mimeType)

            if (buff.length && fileExtension) {
              await writeVideoToCache(mediaItem, buff, fileExtension)

              mediaItemCacheConfig = {
                video: {
                  url: `${cacheUrlPath}/video/${mediaItem.id}.${fileExtension}`,
                },
                posterPhoto: {
                  thumbnail: thumbnailConfig,
                  timeline: timelineConfig,
                  fullscreen: fullscreenConfig,
                },
              }
            }
          } catch (e) {
            console.error(e)
          }
        }
      }

      if (mediaItemCacheConfig) {
        cachedMediaItems = [
          ...cachedMediaItems,
          {
            ...mediaItem,
            cache: mediaItemCacheConfig,
          },
        ]

        cacheConfig[mediaItem.id] = mediaItemCacheConfig
      }
    }

    writeVersionToCache(version)
    writeConfigToCache(cacheConfig)
  } else {
    const cacheConfig = await readConfigFromCache()

    cachedMediaItems = cacheConfig
      ? mediaItems
        .filter(mediaItem => cacheConfig[mediaItem.id])
        .map(mediaItem => ({
          ...mediaItem,
          cache: cacheConfig[mediaItem.id],
        }))
      : []
  }

  return cachedMediaItems
}
