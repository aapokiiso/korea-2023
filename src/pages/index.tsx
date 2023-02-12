import Head from 'next/head'
import { listPhotos } from '@/lib/google-photos'

import styles from '@/styles/Home.module.css'

export default function Home({ photos }) {
  return (
    <>
      <Head>
        <title>Korea 2023</title>
        <meta name="description" content="Image feed for a cycling trip in Korea in 2023." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {photos.map((photo) => {
          return <p key={photo.id}>Photo {photo.id} description: {photo.description}</p>
        })}
      </main>
    </>
  )
}

export async function getStaticProps() {
  const { mediaItems } = await listPhotos()

  return {
    props: {
      photos: mediaItems,
    },
  }
}
