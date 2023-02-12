import { google } from 'googleapis'
import { NextApiRequest, NextApiResponse } from 'next'

const client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH2_CLIENT_ID,
  process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH2_CLIENT_REDIRECT_URL,
)

const url = client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/photoslibrary.readonly',
  ],
})

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res
    .status(200)
    .setHeader('Content-Type', 'text/html')
    .send(`<a href="${url}">Authorize</a>`)
}
