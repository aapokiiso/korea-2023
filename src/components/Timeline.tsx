import { Transition } from '@headlessui/react'
import { Dispatch, Fragment, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { GooglePhotosMediaItem } from '../lib/google-photos-api'
import { parseToPx, resolveTailwindConfig } from '../utils/css'
import { scrollIntoView } from '../utils/scroll-into-view'
import { groupByDay } from '../utils/sort-media-items'
import TimelineControls from './TimelineControls'
import TimelineItemGroup from './TimelineItemGroup'

const tailwindConfig = resolveTailwindConfig()

export default function Timeline({ sortedMediaItems, isVisible, activeMediaItemId, setActiveMediaItemId, activeItemRef, isScrollingUserControlled, setActiveMediaItemIdWithScrollTo }: { sortedMediaItems: GooglePhotosMediaItem[], isVisible: boolean, activeMediaItemId?: string, setActiveMediaItemId: Dispatch<SetStateAction<string|undefined>>, activeItemRef?: MutableRefObject<HTMLElement|null>, isScrollingUserControlled: boolean, setActiveMediaItemIdWithScrollTo: (activeItemId: string|undefined) => void }) {
  const itemsByDay = groupByDay(sortedMediaItems)
  const sortedDays = Object.keys(itemsByDay).sort().reverse()

  const [itemVisibilityObserver, setItemVisibilityObserver] = useState<IntersectionObserver|undefined>()
  useEffect(() => {
    let visibleItemIds: string[] = []

    const observer = new IntersectionObserver(
      (entries) => {
        if (!isScrollingUserControlled) return

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
  }, [sortedMediaItems, activeMediaItemId, setActiveMediaItemId, isScrollingUserControlled])

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
    <Transition
      show={isVisible}
    >
      <div className={`lg:hidden fixed inset-0 transition backdrop-blur ${isVisible ? 'backdrop-opacity-1' : 'backdrop-opacity-0'}`}></div>

      <Transition.Child
        enter="ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        className="relative z-10"
      >
        <div className="pb-20">
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
        </div>
      </Transition.Child>

      <div className={`fixed z-10 bottom-4 right-4 xl:hidden ${!isVisible ? 'hidden' : ''}`}>
        <TimelineControls
          isFirstItemActive={sortedMediaItems[0]?.id === activeMediaItemId}
          isLastItemActive={sortedMediaItems[sortedMediaItems.length - 1]?.id === activeMediaItemId}
          handlePrevClick={handlePrevClick}
          handleNextClick={handleNextClick}
        />
      </div>
    </Transition>
  )
}
