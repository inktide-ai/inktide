export const getYouTubeEmbedUrl = (
  videoId: string,
  options: {
    autoplay?: boolean
    controls?: boolean
    modestbranding?: boolean
    rel?: number
  } = {},
): string => {
  const params = new URLSearchParams({
    autoplay: String(options.autoplay ?? 0),
    controls: String(options.controls ?? 1),
    modestbranding: String(options.modestbranding ?? 1),
    rel: String(options.rel ?? 0),
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
