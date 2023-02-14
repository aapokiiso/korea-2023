import React, { PropsWithChildren } from 'react'

export default function Card({ tagName = 'div', className, children }: PropsWithChildren<{ tagName?: string, className?: string }>) {
  return React.createElement(
    tagName,
    {
      className: 'rounded-lg bg-white border border-gray-200 drop-shadow overflow-hidden ' + className,
    },
    children
  )
}
