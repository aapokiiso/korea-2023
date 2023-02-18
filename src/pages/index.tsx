import Head from 'next/head'
import { GooglePhotosMediaItem, listAlbumMedia } from '@/lib/google-photos-api'

import { groupByDay } from '@/utils/sort-media-items'
import TimelineItemGroup from '@/components/TimelineItemGroup'
import { getCoordinates, getLocationLabel } from '../lib/media-item-enrichment'
import { cacheItems } from '../lib/media-cache'

export default function Home({ mediaItems }: { mediaItems: GooglePhotosMediaItem[] }) {
  const mediaItemsByDay = groupByDay(mediaItems)

  const sortedDays = Object.keys(mediaItemsByDay).sort().reverse()

  return (
    <>
      <Head>
        <title>Korea 2023</title>
        <meta name="description" content="Image feed for a cycling trip in Korea in 2023." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="xl:container mx-auto p-4 grid pointer-events-none">
        <div className="w-full max-w-lg justify-self-end pointer-events-auto">
          <header className="p-4 rounded bg-white border border-gray-200 shadow-lg">
            <h1 className="text-3xl">Site title</h1>
            <p>Mauris sed libero. Suspendisse facilisis nulla in lacinia laoreet, lorem velit accumsan velit vel mattis libero nisl et sem. Proin interdum maecenas massa turpis sagittis in, interdum non lobortis vitae massa.</p>
          </header>
          {sortedDays.map(day => {
            return (<TimelineItemGroup key={day} date={day} mediaItems={mediaItemsByDay[day]} />)
          })}
        </div>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const albumId = process.env.GOOGLE_PHOTOS_ALBUM_ID

  let mediaItems: GooglePhotosMediaItem[] = []
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

    mediaItems = validMediaItems
  }

  return {
    props: {
      mediaItems,
    },
  }
}
