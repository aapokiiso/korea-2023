import { sortByTimeDescending } from '@/utils/sort-media-items'
import { MouseEventHandler, MutableRefObject, useRef } from 'react'
import { CachedGooglePhotosMediaItem } from '../lib/media-cache'
import { getLocationLabel } from '../lib/media-item-enrichment'
import { getDateTitle } from '../utils/date'
import { scrollIntoView } from '../utils/scroll-into-view'
import TimelineItem from './TimelineItem'

export default function TimelineItemGroup({ date, items, activeItemId, activeItemRef, setActiveItemId, itemVisibilityObserver, setActiveMediaItemIdWithScrollTo }: { date: string, items: CachedGooglePhotosMediaItem[], activeItemId?: string, activeItemRef?: MutableRefObject<HTMLElement|null>, setActiveItemId: (activeItemId: string|undefined) => void, itemVisibilityObserver?: IntersectionObserver, setActiveMediaItemIdWithScrollTo: (activeItemId: string|undefined) => void }) {
  const sortedItems = sortByTimeDescending(items)

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
          <h2 className="text-white">{getDateTitle(date)}</h2>
          {locationLabel && <h3 className="text-accent-primary-200 md:ml-4">{locationLabel}</h3>}
        </div>
      </header>
      <div className="pl-4 pr-2">
        {sortedItems.map(item => (
          <TimelineItem
            key={item.id}
            item={item}
            isActive={activeItemId === item.id}
            activeItemRef={activeItemRef}
            setActiveItemId={setActiveItemId}
            visibilityObserver={itemVisibilityObserver}
          />)
        )}
      </div>
    </div>
  )
}
