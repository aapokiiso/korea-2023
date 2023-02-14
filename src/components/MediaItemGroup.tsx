import { GooglePhotosMediaItem } from '@/lib/google-photos-api'
import { sortByTimeDescending } from '@/utils/sort-media-items'
import Card from './Card'
import MediaItem from './MediaItem'

export default function MediaItemGroup({ title, items }: {title?: string, items: GooglePhotosMediaItem[]}) {
  const sortedItems = sortByTimeDescending(items)

  return (
    <div className="my-4">
      <Card className="sticky top-0 p-4 z-10">
        {title && <h2 className="text-2xl">{title}</h2>}
      </Card>
      {sortedItems.map(item => {
        return <MediaItem key={item.id} item={item} />
      })}
    </div>
  )
}
