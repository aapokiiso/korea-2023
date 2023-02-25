import { Dispatch, SetStateAction, Fragment } from 'react'
import { Dialog, Transition  } from '@headlessui/react'
import { GooglePhotosMediaItem } from '../lib/google-photos-api'
import Image from 'next/image'
import { getAspectRatio } from '../utils/media'
import { getDescription, getLocationLabel } from '../lib/media-item-enrichment'
import { formatInDisplayTimeZone } from '../utils/date'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'

export default function FullscreenItem({ item, isOpen, setIsOpen }: { item: GooglePhotosMediaItem, isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>> }) {
  const width = 2560 // TODO: maintain photo role dimensions centrally

  const description = getDescription(item)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-screen-lg transform overflow-hidden rounded-2xl bg-white p-4 text-left align-middle shadow-xl transition group">
                <Image
                  src={`/media/fullscreen/${item.id}`}
                  alt=""
                  width={width}
                  height={Math.round(width * getAspectRatio(item))}
                  className="rounded-2xl"
                />
                <div className="absolute top-8 right-8">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 bg-neutral-200 rounded-md transition-opacity opacity-75 group-hover:opacity-100"
                    onClick={() => setIsOpen(false)}
                  >
                    <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                    <span className="ml-2">Close fullscreen</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
