import React, { PropsWithChildren } from 'react'

export default function Card({ tagName = 'div', className, children }: PropsWithChildren<{ tagName?: string, className?: string }>) {
  return React.createElement(
    tagName,
    {
      className: 'rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden ' + className,
    },
    children
  )
}
