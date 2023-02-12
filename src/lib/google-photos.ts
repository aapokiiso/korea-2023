export async function listPhotos() {
  const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GOOGLE_PHOTOS_OAUTH2_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      pageSize: '100',
      albumId: process.env.GOOGLE_PHOTOS_ALBUM_ID,
    }),
  })

  return response.json()
}
