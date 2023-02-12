import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import { sortByTimeDescending } from '@/utils/sort-media-items'
import MediaItem from './MediaItem'

export default function MediaItemGroup({ title, items }: {title?: string, items: GooglePhotosMediaItem[]}) {
  const sortedItems = sortByTimeDescending(items)

  return (
    <div className="bg-white">
      {title && <h2>{title}</h2>}
      {sortedItems.map(item => {
        return <MediaItem key={item.id} item={item} />
      })}
    </div>
  )
}
