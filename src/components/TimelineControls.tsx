import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'

export default function TimelineControls({ isFirstItemActive, isLastItemActive, handlePrevClick, handleNextClick }: { isFirstItemActive: boolean, isLastItemActive: boolean, handlePrevClick: () => void, handleNextClick: () => void }) {
  return (
    <div className="flex items-center">
      <button className="bg-monza-700 hover:bg-monza-800 disabled:hidden text-white leading-none p-4 transition rounded-full shadow-md ml-2" onClick={handleNextClick} disabled={isFirstItemActive}>
        <ChevronUpIcon className="w-8 h-8" />
        <span className="sr-only">Scroll to next image</span>
      </button>
      <button className="bg-monza-700 hover:bg-monza-800 disabled:hidden text-white leading-none p-4 transition rounded-full shadow-md ml-2" onClick={handlePrevClick} disabled={isLastItemActive}>
        <ChevronDownIcon className="w-8 h-8" />
        <span className="sr-only">Scroll to previous image</span>
      </button>
    </div>
  )
}
