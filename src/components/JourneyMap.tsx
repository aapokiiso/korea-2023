import { useEffect, useRef, useState } from 'react'
import mapboxgl, { Map } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { GooglePhotosMediaItem } from '../lib/google-photos-api'
import { getCoordinates } from '../lib/media-item-enrichment'

import resolveTailwindConfig from 'tailwindcss/resolveConfig'
import tailwindExtendConfig from '@@/tailwind.config.js'
const tailwindConfig = resolveTailwindConfig(tailwindExtendConfig)

export default function JourneyMap({ mediaItems }: { mediaItems: GooglePhotosMediaItem[] }) {
  const mapContainer = useRef(null)
  const map = useRef<Map|null>(null)
  const [lng, setLng] = useState(24.9163194)
  const [lat, setLat] = useState(60.1587333)
  const [zoom, setZoom] = useState(10)

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: zoom,
    })

    map.current.on('load', () => {
      mediaItems
        .forEach(mediaItem => {
          const el = document.createElement('div')
          el.className = 'marker'

          el.style.width = tailwindConfig?.theme?.width?.['16'] as string
          el.style.height = tailwindConfig?.theme?.height?.['16'] as string
          el.style.backgroundImage = `url(/media/thumbnail/${mediaItem.id})`
          el.style.backgroundSize = '100%'
          el.style.borderRadius = '50%'
          el.style.borderWidth = tailwindConfig?.theme?.borderWidth?.['4'] as string
          const neutralColor = tailwindConfig?.theme?.borderColor?.neutral as { [key: string]: string }
          el.style.borderColor = neutralColor['200']

          el.addEventListener('click', () => {
            window.alert(mediaItem.id)
          })

          const { latitude = 0, longitude = 0 } = getCoordinates(mediaItem) || {}

          const marker = new mapboxgl.Marker(el).setLngLat({
            lat: latitude,
            lng: longitude,
          })

          if (map.current) {
            marker.addTo(map.current)
          }
        })
    })
  })

  return (
    <div className="absolute z-0 w-screen h-screen">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
