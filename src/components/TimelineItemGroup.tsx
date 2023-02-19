import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import { sortByTimeDescending } from '@/utils/sort-media-items'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { formatInTimeZone } from 'date-fns-tz'
import { getLocationLabel } from '../lib/media-item-enrichment'
import TimelineItem from './TimelineItem'

export default function TimelineItemGroup({ date, items, activeItemId, itemVisibilityObserver }: { date: string, items: GooglePhotosMediaItem[], activeItemId?: string, itemVisibilityObserver?: IntersectionObserver }) {
  const dateTitle = formatInTimeZone(date, 'UTC', 'E, MMM d')
  const sortedItems = sortByTimeDescending(items)

  const startLocationLabel = sortedItems.length ? getLocationLabel(sortedItems[0]) : null
  const endLocationLabel = sortedItems.length ? getLocationLabel(sortedItems[sortedItems.length - 1]) : null

  const locationLabel = startLocationLabel && endLocationLabel
    ? (startLocationLabel !== endLocationLabel ? `${startLocationLabel} - ${endLocationLabel}` : startLocationLabel)
    : null

  return (
    <div className="mt-8 mb-4">
      <header className="inline-flex items-center sticky top-4 py-2 px-4 z-10 bg-monza-500 rounded-2xl">
        <div className="md:flex">
          <h2 className="text-white">{dateTitle}</h2>
          {locationLabel && <h3 className="text-monza-200 md:ml-4">{locationLabel}</h3>}
        </div>
        <button className="bg-monza-700 hover:bg-monza-800 text-white leading-none p-2 ml-8 rounded-full transition rotate-90">
          <ChevronRightIcon className="w-4 h-4" />
          <span className="sr-only">Collapse day</span>
        </button>
      </header>
      <div className="pl-4 pr-2">
        {sortedItems.map(item => <TimelineItem key={item.id} item={item} isActive={activeItemId === item.id} visibilityObserver={itemVisibilityObserver} />)}
      </div>
    </div>
  )
}
