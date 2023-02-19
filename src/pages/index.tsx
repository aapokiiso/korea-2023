import Head from 'next/head'
import { GooglePhotosMediaItem, listAlbumMedia } from '@/lib/google-photos-api'

import { getCoordinates, getLocationLabel } from '../lib/media-item-enrichment'
import { cacheItems } from '../lib/media-cache'
import JourneyMap from '../components/JourneyMap'
import { useState } from 'react'
import Timeline from '../components/Timeline'

export default function Home({ mediaItems }: { mediaItems: GooglePhotosMediaItem[] }) {
  const [activeMediaItemId, setActiveMediaItemId] = useState<string|undefined>()

  return (
    <>
      <Head>
        <title>Korea 2023</title>
        <meta name="description" content="Image feed for a cycling trip in Korea in 2023." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <JourneyMap mediaItems={mediaItems} activeMediaItemId={activeMediaItemId} />
      <main className="xl:container mx-auto p-4 grid pointer-events-none relative z-10">
        <div className="w-full max-w-lg justify-self-end pointer-events-auto">
          <Timeline mediaItems={mediaItems} activeMediaItemId={activeMediaItemId} setActiveMediaItemId={setActiveMediaItemId} />
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
