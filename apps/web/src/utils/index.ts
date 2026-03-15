/**
 * Utilities
 */

import type { Star } from '../types'
import { STAR_CONFIG_SECTION } from '../constants'

/**
 * Generates array of stars for section
 */
export const generateSectionStars = (count: number = STAR_CONFIG_SECTION.count): Star[] => {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (STAR_CONFIG_SECTION.maxSize - STAR_CONFIG_SECTION.minSize) + STAR_CONFIG_SECTION.minSize,
      opacity: Math.random() * (STAR_CONFIG_SECTION.maxOpacity - STAR_CONFIG_SECTION.minOpacity) + STAR_CONFIG_SECTION.minOpacity,
    })
  }
  return stars
}

/**
 * Builds URL for YouTube iframe
 */
export const getYouTubeEmbedUrl = (
  videoId: string,
  options: {
    autoplay?: boolean
    controls?: boolean
    modestbranding?: boolean
    rel?: number
  } = {}
): string => {
  const params = new URLSearchParams({
    autoplay: String(options.autoplay ?? 0),
    controls: String(options.controls ?? 1),
    modestbranding: String(options.modestbranding ?? 1),
    rel: String(options.rel ?? 0),
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}
