import { sortByTimeDescending } from '@/utils/sort-media-items'
import { MouseEventHandler, MutableRefObject, useRef } from 'react'
import { CachedGooglePhotosMediaItem } from '../lib/media-cache'
import { getLocationLabel } from '../lib/media-item-enrichment'
import { formatInDisplayTimeZone } from '../utils/date'
import TimelineItem from './TimelineItem'

export default function TimelineItemGroup({ items, activeItemId, activeItemRef, setActiveItemId, itemVisibilityObserver, setActiveMediaItemIdWithScrollTo }: { items: CachedGooglePhotosMediaItem[], activeItemId?: string, activeItemRef?: MutableRefObject<HTMLElement|null>, setActiveItemId: (activeItemId: string|undefined) => void, itemVisibilityObserver?: IntersectionObserver, setActiveMediaItemIdWithScrollTo: (activeItemId: string|undefined) => void }) {
  const sortedItems = sortByTimeDescending(items)

  // Use any item's creation time as the date source, as they are already grouped to the same date.
  const date = sortedItems.length ? sortedItems[0].mediaMetadata.creationTime : null

  const startLocationLabel = sortedItems.length ? getLocationLabel(sortedItems[0]) : null
  const endLocationLabel = sortedItems.length ? getLocationLabel(sortedItems[sortedItems.length - 1]) : null

  const locationLabel = startLocationLabel && endLocationLabel
    ? (startLocationLabel !== endLocationLabel ? `${startLocationLabel} - ${endLocationLabel}` : startLocationLabel)
    : null

  const groupContainer = useRef<HTMLDivElement>(null)
  const handleHeaderClick: MouseEventHandler<HTMLElement> = (event) => {
    const [firstItem] = sortedItems
    if (firstItem) {
      setActiveMediaItemIdWithScrollTo(firstItem.id)
    }
  }

  return (
    <div className="mt-8 mb-4" ref={groupContainer}>
      <header className="inline-flex items-center sticky top-4 py-2 px-4 z-10 bg-accent-primary-500 rounded-2xl cursor-pointer" onClick={handleHeaderClick}>
        <div className="md:flex">
          {date && <h2 className="text-white">{formatInDisplayTimeZone(date, 'E, MMM d')}</h2>}
          {locationLabel && <h3 className="text-accent-primary-200 md:ml-4">{locationLabel}</h3>}
        </div>
      </header>
      <ol className="pl-4 pr-2">
        {sortedItems.map(item => (
          <li key={item.id}>
            <TimelineItem
              item={item}
              isActive={activeItemId === item.id}
              activeItemRef={activeItemRef}
              setActiveItemId={setActiveItemId}
              visibilityObserver={itemVisibilityObserver}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
