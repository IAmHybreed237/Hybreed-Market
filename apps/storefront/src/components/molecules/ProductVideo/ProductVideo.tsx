"use client"

export const ProductVideo = ({
  url,
  poster,
  className = "",
}: {
  url: string
  poster?: string
  className?: string
}) => (
  <video
    src={url}
    poster={poster}
    controls
    playsInline
    preload="metadata"
    className={`w-full aspect-video object-cover bg-black ${className}`}
  />
)
