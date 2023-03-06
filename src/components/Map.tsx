import { useEffect, useRef, useState } from 'react'
import mapboxgl, { Map as MapboxMap, Marker } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getCoordinates } from '../lib/media-item-enrichment'
import { resolveTailwindConfig } from '../utils/css'
import { CachedGooglePhotosMediaItem, GooglePhotosPhotoCache, GooglePhotosVideoCache } from '../lib/media-cache'
import { isPhoto, isVideo } from '../lib/google-photos-media'

const tailwindConfig = resolveTailwindConfig()

const getMapThumbnailUrl = (mediaItem: CachedGooglePhotosMediaItem): string|null => {
  if (isPhoto(mediaItem)) {
    const cache = mediaItem.cache as GooglePhotosPhotoCache

    return cache
      ? cache.mapThumbnail.url
      : null
  } else if (isVideo(mediaItem)) {
    const cache = mediaItem.cache as GooglePhotosVideoCache

    return cache
      ? cache.posterPhoto.mapThumbnail.url
      : null
  }

  return null
}

export default function Map({ mediaItems, activeMediaItemId, setActiveMediaItemIdWithScrollTo }: { mediaItems: CachedGooglePhotosMediaItem[], activeMediaItemId?: string, setActiveMediaItemIdWithScrollTo: (activeItemId: string|undefined) => void }) {
  const mapContainer = useRef(null)
  const map = useRef<MapboxMap|null>(null)

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

          element.style.width = tailwindConfig?.theme?.width?.['16'] as string
          element.style.height = tailwindConfig?.theme?.height?.['16'] as string

          const thumbnailUrl = getMapThumbnailUrl(mediaItem)
          if (thumbnailUrl) {
            element.style.backgroundImage = `url(${thumbnailUrl})`
            element.style.backgroundSize = '100%'
          }

          element.style.borderRadius = '50%'
          element.style.borderWidth = tailwindConfig?.theme?.borderWidth?.['4'] as string
          const borderColor = tailwindConfig?.theme?.borderColor as { [key: string]: string }
          element.style.borderColor = borderColor?.neutral['200'] as string

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
  }, [mediaItems, setActiveMediaItemIdWithScrollTo])

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
        markerElement.classList.remove('mapboxgl-marker-active')
      })

    if (activeMarker) {
      const activeMarkerElement = activeMarker.getElement()

      activeMarkerElement.classList.add('mapboxgl-marker-active')
    }
  }, [markers, activeMarker])

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

    const mapboxMap = new mapboxgl.Map({
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
      attributionControl: false,
      logoPosition: 'top-left',
    })

    mapboxMap.addControl(new mapboxgl.AttributionControl(), 'top-right')

    map.current = mapboxMap
  })

  return (
    <div className="fixed z-0 w-screen h-screen">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}
