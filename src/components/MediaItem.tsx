import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import Image from 'next/image'
import { formatInDisplayTimeZone } from '@/utils/date'
import Card from './Card'

export default function MediaItem({ item }: {item: GooglePhotosMediaItem}) {
  const aspectRatio = Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)

  const width = 896 // 28rem * 2 (retina factor), in pixels

  const timestamp = item.mediaMetadata.creationTime

  return (
    <Card tagName="article" className="my-4 p-2 pt-4">
      <Image
        src={item.baseUrl + '=w' + width}
        alt=""
        width={width}
        height={Math.round(width*aspectRatio)}
        className="rounded-2xl"
      />
      <div className="p-4">
        {false && item.description && <p>{item.description}</p>}
        <p>Mauris sed libero. Suspendisse facilisis nulla in lacinia laoreet, lorem velit accumsan velit vel mattis libero nisl et sem.</p>
        <p className="mt-2 text-sm text-neutral-500">{formatInDisplayTimeZone(timestamp, 'HH:mm')}</p>
      </div>
    </Card>
  )
}
