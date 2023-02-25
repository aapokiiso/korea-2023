import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { GooglePhotosMediaItem } from '../lib/google-photos-api'
import { parseToPx, resolveTailwindConfig } from '../utils/css'
import { scrollIntoView } from '../utils/scroll-into-view'
import { groupByDay } from '../utils/sort-media-items'
import TimelineControls from './TimelineControls'
import TimelineItemGroup from './TimelineItemGroup'

const tailwindConfig = resolveTailwindConfig()

export default function Timeline({ sortedMediaItems, activeMediaItemId, setActiveMediaItemId }: { sortedMediaItems: GooglePhotosMediaItem[], activeMediaItemId?: string, setActiveMediaItemId: Dispatch<SetStateAction<string|undefined>> }) {
  const itemsByDay = groupByDay(sortedMediaItems)
  const sortedDays = Object.keys(itemsByDay).sort().reverse()

  const activeItemRef = useRef<HTMLElement|null>(null)
  const [needScrollToActiveItem, setNeedScrollToActiveItem] = useState<boolean>(() => false)

  const setActiveMediaItemIdWithScrollTo = (activeItemId: string|undefined) => {
    setActiveMediaItemId(activeItemId)
    if (activeItemId) {
      setNeedScrollToActiveItem(true)
    }
  }

  const [itemVisibilityObserver, setItemVisibilityObserver] = useState<IntersectionObserver|undefined>()
  useEffect(() => {
    if (needScrollToActiveItem) return

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

        // To reduce unnecessary focus flickers in edge cases,
        // only change active item if previous one is no longer visible.
        if (!activeMediaItemId || !visibleItemIds.includes(activeMediaItemId)) {
          const topmostVisibleItem = sortedMediaItems
            .find(item => visibleItemIds.includes(item.id))

          if (topmostVisibleItem) {
            setActiveMediaItemId(topmostVisibleItem.id)
          }
        }
      },
      { threshold: 0.5 }
    )

    setItemVisibilityObserver(observer)

    return () => {
      observer.disconnect()
    }
  }, [sortedMediaItems, activeMediaItemId, setActiveMediaItemId, needScrollToActiveItem])

  useEffect(() => {
    if (needScrollToActiveItem && activeItemRef.current) {
      scrollIntoView(activeItemRef.current, {
        offsetTop: -1 * (parseToPx(tailwindConfig.theme?.margin?.['20'] || '') ?? 0),
      })

      // Wait a bit for scrolling to finish before releasing control. Duration
      // is user agent specific, so 250ms is just a good enough estimate.
      setTimeout(() => {
        setNeedScrollToActiveItem(false)
      }, 250)
    } else {
      setNeedScrollToActiveItem(false)
    }
  }, [needScrollToActiveItem])

  const handlePrevClick = (): void => {
    const maxIndex = sortedMediaItems.length - 1
    const activeIndex = sortedMediaItems.findIndex(item => item.id === activeMediaItemId) ?? maxIndex
    const prevIndex = Math.min(maxIndex, activeIndex + 1)

    setActiveMediaItemIdWithScrollTo(sortedMediaItems[prevIndex]?.id)
  }

  const handleNextClick = (): void => {
    const minIndex = 0
    const activeIndex = sortedMediaItems.findIndex(item => item.id === activeMediaItemId) ?? minIndex
    const nextIndex = Math.max(minIndex, activeIndex - 1)

    setActiveMediaItemIdWithScrollTo(sortedMediaItems[nextIndex]?.id)
  }

  return (
    <>
      <header className="p-4 rounded bg-white border border-gray-200 shadow-lg">
        <h1 className="text-3xl">Site title</h1>
        <p>Site introduction goes here.</p>
      </header>
      <div>
        {sortedDays.map(day => {
          return (
            <TimelineItemGroup
              key={day}
              date={day}
              items={itemsByDay[day]}
              activeItemId={activeMediaItemId}
              activeItemRef={activeItemRef}
              setActiveItemId={setActiveMediaItemIdWithScrollTo}
              itemVisibilityObserver={itemVisibilityObserver}
            />
          )
        })}
      </div>
      <div className="fixed bottom-4 right-4 xl:hidden">
        <TimelineControls
          isFirstItemActive={sortedMediaItems[0]?.id === activeMediaItemId}
          isLastItemActive={sortedMediaItems[sortedMediaItems.length - 1]?.id === activeMediaItemId}
          handlePrevClick={handlePrevClick}
          handleNextClick={handleNextClick}
        />
      </div>
    </>
  )
}
