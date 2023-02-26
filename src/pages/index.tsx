import Head from 'next/head'
import { GooglePhotosMediaItem, listAlbumMedia } from '@/lib/google-photos-api'

import { getCoordinates, getLocationLabel } from '../lib/media-item-enrichment'
import { cacheItems } from '../lib/media-cache'
import JourneyMap from '../components/JourneyMap'
import { useEffect, useRef, useState } from 'react'
import Timeline from '../components/Timeline'
import { sortByTimeDescending } from '../utils/sort-media-items'
import GlobalControls from '../components/GlobalControls'
import { scrollIntoView } from '../utils/scroll-into-view'
import { parseToPx, resolveTailwindConfig } from '../utils/css'

const tailwindConfig = resolveTailwindConfig()

export default function Home({ sortedMediaItems }: { sortedMediaItems: GooglePhotosMediaItem[] }) {
  const [activeMediaItemId, setActiveMediaItemId] = useState<string|undefined>()

  const [isTimelineVisible, setIsTimelineVisible] = useState<boolean>(true)

  const activeItemRef = useRef<HTMLElement|null>(null)
  const [needScrollToActiveItem, setNeedScrollToActiveItem] = useState<boolean>(() => false)
  const [isScrollingUserControlled, setIsScrollingUserControlled] = useState<boolean>(() => true)

  const hideTimeline = () => {
    setIsScrollingUserControlled(false)
    setIsTimelineVisible(false)
  }

  const showTimeline = (scrollToActiveItem: boolean = true) => {
    setIsTimelineVisible(true)

    if (scrollToActiveItem) {
      // Wait for timeline's appear transition to finish before triggering
      // scroll to the active item.
      setTimeout(() => {
        setNeedScrollToActiveItem(true)
      }, 150)
    } else {
      setIsScrollingUserControlled(true)
    }
  }

  const setActiveMediaItemIdWithScrollTo = (activeMediaItemId: string|undefined) => {
    setActiveMediaItemId(activeMediaItemId)

    if (activeMediaItemId) {
      setIsScrollingUserControlled(false)
      if (isTimelineVisible) {
        setNeedScrollToActiveItem(true)
      } else {
        showTimeline(true)
      }
    }
  }

  useEffect(() => {
    if (needScrollToActiveItem && activeItemRef.current) {
      scrollIntoView(activeItemRef.current, {
        offsetTop: -1 * (parseToPx(tailwindConfig.theme?.margin?.['20'] || '') ?? 0),
      })

      // Wait a bit for scrolling to finish before releasing control. Duration
      // is user agent specific, so 250ms is just a good enough estimate.
      setTimeout(() => {
        setNeedScrollToActiveItem(false)
        setIsScrollingUserControlled(true)
      }, 250)
    } else {
      setNeedScrollToActiveItem(false)
      setIsScrollingUserControlled(true)
    }
  }, [needScrollToActiveItem])

  const handleToggleMapClick = (): void => {
    if (isTimelineVisible) {
      hideTimeline()
    } else {
      showTimeline(true)
    }
  }

  return (
    <>
      <Head>
        <title>Korea 2023</title>
        <meta name="description" content="Image feed for a cycling trip in Korea in 2023." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <JourneyMap
        mediaItems={sortedMediaItems}
        activeMediaItemId={activeMediaItemId}
        setActiveMediaItemIdWithScrollTo={setActiveMediaItemIdWithScrollTo}
      />
      <main className="xl:container mx-auto p-4 grid pointer-events-none relative z-10">
        <div className="w-full max-w-lg justify-self-end pointer-events-auto">
          <Timeline
            sortedMediaItems={sortedMediaItems}
            isVisible={isTimelineVisible}
            activeMediaItemId={activeMediaItemId}
            setActiveMediaItemId={setActiveMediaItemId}
            activeItemRef={activeItemRef}
            isScrollingUserControlled={isScrollingUserControlled}
            setActiveMediaItemIdWithScrollTo={setActiveMediaItemIdWithScrollTo}
          />
        </div>
      </main>
      <div className="fixed bottom-4 left-4 lg:hidden z-10">
        <GlobalControls
          isTimelineVisible={isTimelineVisible}
          handleToggleMapClick={handleToggleMapClick}
        />
      </div>
    </>
  )
}

export async function getStaticProps() {
  const albumId = process.env.GOOGLE_PHOTOS_ALBUM_ID

  let sortedMediaItems: GooglePhotosMediaItem[] = []
  if (albumId) {
    let allMediaItems: GooglePhotosMediaItem[] = []
    let pageToken: string|undefined

    do {
      const { mediaItems: pageMediaItems, nextPageToken } = await listAlbumMedia(albumId, { pageToken })
      allMediaItems = [...allMediaItems, ...pageMediaItems]
      pageToken = nextPageToken
    } while (pageToken)

    const validMediaItems = allMediaItems
      .filter(mediaItem => getLocationLabel(mediaItem) && getCoordinates(mediaItem))

    await cacheItems(validMediaItems)

    sortedMediaItems = sortByTimeDescending(validMediaItems)
  }

  return {
    props: {
      sortedMediaItems,
    },
  }
}
