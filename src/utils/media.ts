import { GooglePhotosMediaItem } from '../lib/google-photos-api'

export const getAspectRatio = (item: GooglePhotosMediaItem): number =>
  Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)
