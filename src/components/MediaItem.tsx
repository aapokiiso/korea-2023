import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import Image from 'next/image'
import { formatInDisplayTimeZone } from '@/utils/date'

export default function MediaItem({ item }: {item: GooglePhotosMediaItem}) {
  const aspectRatio = Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)

  const width = 896 // 28rem * 2 (retina factor), in pixels

  const timestamp = item.mediaMetadata.creationTime

  return (
    <article className="my-4 p-2 pt-4 rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
      <Image
        src={item.baseUrl + '=w' + width}
        alt=""
        width={width}
        height={Math.round(width*aspectRatio)}
        className="rounded-2xl"
      />
      <div className="p-4">
        {item.description && <p>{item.description}</p>}
        <p>Mauris sed libero. Suspendisse facilisis nulla in lacinia laoreet, lorem velit accumsan velit vel mattis libero nisl et sem.</p>
        <p className="my-2">&mdash;</p>
        <div className="flex text-sm">
          <p>{formatInDisplayTimeZone(timestamp, 'HH:mm')}</p>
          <p className="ml-4 text-neutral-500">Incheon</p>
        </div>
      </div>
    </article>
  )
}
