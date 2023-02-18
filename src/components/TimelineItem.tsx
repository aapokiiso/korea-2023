import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import Image from 'next/image'
import { formatInDisplayTimeZone } from '@/utils/date'
import { getDescription, getLocationLabel } from '../lib/media-item-enrichment'

export default function TimelineItem({ mediaItem }: { mediaItem: GooglePhotosMediaItem }) {
  const aspectRatio = Number(mediaItem.mediaMetadata.height) / Number(mediaItem.mediaMetadata.width)
  const width = 1080 // TODO: maintain photo role dimensions centrally

  const timestamp = mediaItem.mediaMetadata.creationTime

  const description = getDescription(mediaItem)

  return (
    <article className="my-4 p-2 pt-4 rounded-2xl bg-neutral-200 shadow-lg overflow-hidden">
      <Image
        src={`/media/timeline/${mediaItem.id}`}
        alt=""
        width={width}
        height={Math.round(width*aspectRatio)}
        className="rounded-2xl"
      />
      <div className="p-4">
        {description && <p className="whitespace-pre-wrap">{description}</p>}
        <p className="my-2">&mdash;</p>
        <div className="flex text-sm">
          <p>{formatInDisplayTimeZone(timestamp, 'HH:mm')}</p>
          <p className="ml-4 text-neutral-500">{getLocationLabel(mediaItem)}</p>
        </div>
      </div>
    </article>
  )
}
