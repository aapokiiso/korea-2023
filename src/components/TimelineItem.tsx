import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import Image from 'next/image'
import { formatInDisplayTimeZone } from '@/utils/date'
import { getDescription, getLocationLabel } from '../lib/media-item-enrichment'
import { useEffect, useRef } from 'react'

export default function TimelineItem({ item, isActive, visibilityObserver }: { item: GooglePhotosMediaItem, isActive: boolean, visibilityObserver?: IntersectionObserver }) {
  const aspectRatio = Number(item.mediaMetadata.height) / Number(item.mediaMetadata.width)
  const width = 1080 // TODO: maintain photo role dimensions centrally

  const timestamp = item.mediaMetadata.creationTime

  const description = getDescription(item)

  const element = useRef(null)
  useEffect(() => {
    const currentElement = element.current

    if (currentElement && visibilityObserver) {
      visibilityObserver.observe(currentElement)
    }

    return () => {
      if (currentElement && visibilityObserver) {
        visibilityObserver.unobserve(currentElement)
      }
    }
  }, [visibilityObserver])

  return (
    <article ref={element} data-id={item.id} className={`my-4 p-2 pt-4 bg-neutral-200 rounded-2xl shadow-lg overflow-hidden transition-opacity ${isActive ? ' opacity-100' : 'opacity-60'}`}>
      <Image
        src={`/media/timeline/${item.id}`}
        alt=""
        width={width}
        height={Math.round(width * aspectRatio)}
        className="rounded-2xl"
      />
      <div className="p-4">
        {description && <p className="whitespace-pre-wrap">{description}</p>}
        <p className="my-2">&mdash;</p>
        <div className="flex text-sm">
          <p>{formatInDisplayTimeZone(timestamp, 'HH:mm')}</p>
          <p className="ml-4 text-neutral-500">{getLocationLabel(item)}</p>
        </div>
      </div>
    </article>
  )
}
