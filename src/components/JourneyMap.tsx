import { useEffect, useRef, useState } from 'react'
import mapboxgl, { Map, Marker } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { GooglePhotosMediaItem } from '../lib/google-photos-api'
import { getCoordinates } from '../lib/media-item-enrichment'
import { resolveTailwindConfig } from '../utils/css'

const tailwindConfig = resolveTailwindConfig()

export default function JourneyMap({ mediaItems, activeMediaItemId, setActiveMediaItemIdWithScrollTo }: { mediaItems: GooglePhotosMediaItem[], activeMediaItemId?: string, setActiveMediaItemIdWithScrollTo: (activeItemId: string|undefined) => void }) {
  const mapContainer = useRef(null)
  const map = useRef<Map|null>(null)

  const markerWidth = tailwindConfig?.theme?.width?.['16'] as string
  const markerHeight = tailwindConfig?.theme?.height?.['16'] as string

  const activeMarkerWidth = tailwindConfig?.theme?.width?.['20'] as string
  const activeMarkerHeight = tailwindConfig?.theme?.height?.['20'] as string

  const [markers, setMarkers] = useState<Marker[]>(() => [])

  const activeMarker = activeMediaItemId
    ? markers.find(marker => marker.getElement().getAttribute('data-media-item-id') === activeMediaItemId)
    : null

  useEffect(() => {
    setMarkers(
      mediaItems
        .map(mediaItem => {
          const element = document.createElement('div')

          element.className = 'marker'
          element.setAttribute('data-media-item-id', mediaItem.id)

          element.style.width = markerWidth
          element.style.height = markerHeight

          element.style.backgroundImage = `url(/media/thumbnail/${mediaItem.id})`
          element.style.backgroundSize = '100%'

          element.style.borderRadius = '50%'
          element.style.borderWidth = tailwindConfig?.theme?.borderWidth?.['4'] as string
          const neutralColor = tailwindConfig?.theme?.borderColor?.neutral as { [key: string]: string }
          element.style.borderColor = neutralColor['200']

          element.style.transitionProperty = tailwindConfig?.theme?.transitionProperty?.mapMarkerSize as string
          element.style.transitionDuration = tailwindConfig?.theme?.transitionDuration?.['150'] as string
          element.style.transitionTimingFunction = tailwindConfig?.theme?.transitionTimingFunction?.easeInOut as string

          element.addEventListener('click', () => {
            setActiveMediaItemIdWithScrollTo(mediaItem.id)
          })

          const coords = getCoordinates(mediaItem)

          if (coords) {
            const marker = new mapboxgl.Marker(element)

            marker.setLngLat({
              lat: coords.latitude,
              lng: coords.longitude,
            })

            return marker
          }

          return null
        })
        .filter(marker => marker) as Marker[]
    )
  }, [mediaItems, markerHeight, markerWidth, setActiveMediaItemIdWithScrollTo])

  useEffect(() => {
    const currentMap = map.current

    if (currentMap) {
      markers.forEach(marker => marker.addTo(currentMap))
    }

    return () => {
      if (currentMap) {
        markers.forEach(marker => marker.remove())
      }
    }
  }, [markers])

  useEffect(() => {
    markers
      .filter(marker => marker !== activeMarker)
      .map(marker => marker.getElement())
      .forEach(markerElement => {
        markerElement.style.width = markerWidth
        markerElement.style.height = markerHeight
      })

    if (activeMarker) {
      const activeMarkerElement = activeMarker.getElement()

      activeMarkerElement.style.width = activeMarkerWidth
      activeMarkerElement.style.height = activeMarkerHeight
    }
  }, [markers, activeMarker, markerWidth, markerHeight, activeMarkerWidth, activeMarkerHeight])

  useEffect(() => {
    const currentMap = map.current

    if (currentMap && activeMarker) {
      currentMap.flyTo({
        center: activeMarker.getLngLat(),
      })
    }
  }, [markers, activeMarker])

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

    const coords = mediaItems[0] ? getCoordinates(mediaItems[0]) : null

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: coords
        ? {
          lat: coords.latitude,
          lng: coords.longitude,
        }
        : {
          lat: 37.460195,
          lng: 126.438507,
        },
      zoom: 10,
    })
  })

  return (
    <div className="fixed z-0 w-screen h-screen">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
