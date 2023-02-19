import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { GooglePhotosMediaItem } from '../lib/google-photos-api'
import { groupByDay, sortByTimeDescending } from '../utils/sort-media-items'
import TimelineItemGroup from './TimelineItemGroup'

export default function Timeline({ mediaItems, activeMediaItemId, setActiveMediaItemId }: { mediaItems: GooglePhotosMediaItem[], activeMediaItemId?: string, setActiveMediaItemId: Dispatch<SetStateAction<string|undefined>> }) {
  const itemsByDay = groupByDay(mediaItems)
  const sortedDays = Object.keys(itemsByDay).sort().reverse()

  const [itemVisibilityObserver, setItemVisibilityObserver] = useState<IntersectionObserver|undefined>()
  useEffect(() => {
    let visibleItemIds: string[] = []

    const observer = new IntersectionObserver(
      (entries) => {
        const updates = entries
          .map(({ target, isIntersecting }) => ({
            itemId: target.getAttribute('data-id') || '',
            isIntersecting,
          }))
          .filter(({ itemId }) => itemId)

        const stillVisibleItemIds = visibleItemIds
          .filter(visibleItemId => {
            const update = updates.find(({ itemId }) => itemId === visibleItemId)

            return !update || update.isIntersecting
          })

        const newlyVisibleItemIds = updates
          .filter(({ isIntersecting }) => isIntersecting)
          .map(({ itemId }) => itemId)

        visibleItemIds = [
          ...stillVisibleItemIds,
          ...newlyVisibleItemIds,
        ]

        const topmostVisibleItem = sortByTimeDescending(mediaItems)
          .find(item => visibleItemIds.includes(item.id))

        if (topmostVisibleItem) {
          setActiveMediaItemId(topmostVisibleItem.id)
        }
      },
      { threshold: 0.5 }
    )

    setItemVisibilityObserver(observer)

    return () => {
      observer.disconnect()
    }
  }, [mediaItems, setActiveMediaItemId])

  return (
    <>
      <header className="p-4 rounded bg-white border border-gray-200 shadow-lg">
        <h1 className="text-3xl">Site title</h1>
        <p>Site introduction goes here.</p>
      </header>
      {sortedDays.map(day => {
        return (
          <TimelineItemGroup
            key={day}
            date={day}
            items={itemsByDay[day]}
            activeItemId={activeMediaItemId}
            itemVisibilityObserver={itemVisibilityObserver}
          />
        )
      })}
    </>
  )
}
