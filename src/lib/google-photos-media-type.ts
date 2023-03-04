import { GooglePhotosMediaItem, GooglePhotosVideoMetadata } from './google-photos-api'

export const isPhoto = (mediaItem: GooglePhotosMediaItem): boolean => {
  return mediaItem.mediaMetadata.hasOwnProperty('photo')
}

export const isVideo = (mediaItem: GooglePhotosMediaItem): boolean => {
  return mediaItem.mediaMetadata.hasOwnProperty('video')
}
