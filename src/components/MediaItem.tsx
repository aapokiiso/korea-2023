import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import Image from 'next/image'
import { formatInDisplayTimeZone } from '@/utils/date'

export default function MediaItem({ item }: {item: GooglePhotosMediaItem}) {
  const aspectRatio = Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)

  const width = 896 // 28rem * 2 (retina factor), in pixels

  const timestamp = item.mediaMetadata.creationTime

  return (
    <article>
      <h3>
        {formatInDisplayTimeZone(timestamp, 'HH:mm')}
      </h3>
      <figure>
        <Image src={item.baseUrl + '=w' + width} alt="" width={width} height={Math.round(width*aspectRatio)} />
        {item.description && <figcaption>{item.description}</figcaption>}
      </figure>
    </article>
  )
}
