import Head from 'next/head'
import { GooglePhotosMediaItem, listMedia } from '@/lib/google-photos'

import styles from '@/styles/Home.module.css'

export default function Home({ mediaItems }: { mediaItems: GooglePhotosMediaItem[] }) {
  return (
    <>
      <Head>
        <title>Korea 2023</title>
        <meta name="description" content="Image feed for a cycling trip in Korea in 2023." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {mediaItems.map(({ id, description }) => {
          return <p key={id}>Photo {id} description: {description}</p>
        })}
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
