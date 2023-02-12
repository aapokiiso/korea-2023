import { google } from 'googleapis'
import { NextApiRequest, NextApiResponse } from 'next'

const client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH2_CLIENT_ID,
  process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH2_CLIENT_REDIRECT_URL,
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query

  if (code) {
    try {
      const { tokens } = await client.getToken(String(code))

      res.status(200).json(tokens)
    } catch (e) {
      console.error(e)

      res.status(403).send('No access token received for authorization code.')
    }
  } else {
    res.status(403).send('No authorization code received.')
  }
}
