'use client'

import ShowcaseScene, { loopFiles, type ShowcaseItem } from './showcase-scene'

// Scene 04: the same Quackie in three outfits, each its own Flow loop with its own attitude.

const COSTUMES: ShowcaseItem[] = [
  {
    name: 'Duck',
    alt: 'Quackie in the duck hoodie',
    still: '/images/landing/chat/still-laugh.png',
    thumb: '/images/landing/costumes/thumb-duck.png',
    loop: loopFiles('/videos/landing/chat-loop'),
  },
  {
    name: 'Raccoon',
    alt: 'Quackie in the raccoon hoodie',
    still: '/images/landing/costumes/still-raccoon.png',
    thumb: '/images/landing/costumes/thumb-raccoon.png',
    loop: loopFiles('/videos/landing/costume-raccoon-loop'),
  },
  {
    name: 'Shark',
    alt: 'Quackie in the shark hoodie',
    still: '/images/landing/costumes/still-shark.png',
    thumb: '/images/landing/costumes/thumb-shark.png',
    loop: loopFiles('/videos/landing/costume-shark-loop'),
  },
]

export default function CustomizeScene() {
  return (
    <ShowcaseScene
      id="customize"
      chapter="04"
      label="Customize"
      ariaLabel="Dress Quackie up"
      tag="WARDROBE"
      title={[
        'One host.',
        <>
          Any <span className="text-[var(--q-duck)]">look.</span>
        </>,
      ]}
      body="Put Quackie in a duck, raccoon or shark hoodie — every outfit comes with its own attitude."
      items={COSTUMES}
      noun="outfit"
    />
  )
}
