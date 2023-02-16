import Head from 'next/head'
import { GooglePhotosMediaItem, listMedia } from '@/lib/google-photos-api'

import { groupByDay } from '@/utils/sort-media-items'
import MediaItemGroup from '@/components/MediaItemGroup'

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
            return (<MediaItemGroup key={day} date={day} items={mediaItemsByDay[day]} />)
          })}
        </div>
      </main>
    </>
  )
}

export async function getStaticProps() {
  let allMediaItems: GooglePhotosMediaItem[] = []
  let pageToken: string|undefined

  do {
    const { mediaItems, nextPageToken } = await listMedia({ pageToken })
    allMediaItems = [...allMediaItems, ...mediaItems]
    pageToken = nextPageToken
  } while (pageToken)

  return {
    props: {
      mediaItems: allMediaItems,
    },
  }
}
