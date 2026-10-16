'use client'

import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import ShowcaseScene, { loopFiles, type ShowcaseItem } from './showcase-scene'

// Scene 04: the same Quackie in three outfits, each its own Flow loop with its own attitude.

// Names and alt texts come from landing.json (stage.customize.costumes.<id>).
const COSTUMES: (Omit<ShowcaseItem, 'name' | 'alt'> & { id: string })[] = [
  {
    id: 'duck',
    still: '/images/landing/chat/still-laugh.png',
    thumb: '/images/landing/costumes/thumb-duck.png',
    loop: loopFiles('/videos/landing/chat-loop'),
  },
  {
    id: 'raccoon',
    still: '/images/landing/costumes/still-raccoon.png',
    thumb: '/images/landing/costumes/thumb-raccoon.png',
    loop: loopFiles('/videos/landing/costume-raccoon-loop'),
  },
  {
    id: 'shark',
    still: '/images/landing/costumes/still-shark.png',
    thumb: '/images/landing/costumes/thumb-shark.png',
    loop: loopFiles('/videos/landing/costume-shark-loop'),
  },
]

export default function CustomizeScene() {
  const { t } = useTranslation('landing')
  const items = useMemo<ShowcaseItem[]>(
    () => COSTUMES.map(({ id, ...c }) => ({
      ...c,
      name: t(`stage.customize.costumes.${id}.name`),
      alt: t(`stage.customize.costumes.${id}.alt`),
    })),
    [t],
  )
  return (
    <ShowcaseScene
      id="customize"
      chapter="04"
      label={t('stage.nav.customize')}
      ariaLabel={t('stage.customize.ariaLabel')}
      tag="WARDROBE"
      title={[
        t('stage.customize.title1'),
        <Trans key="title2" ns="landing" t={t} i18nKey="stage.customize.title2" components={{ accent: <span className="text-[var(--q-duck)]" /> }} />,
      ]}
      body={t('stage.customize.body')}
      items={items}
      pickerLabels={{ prev: t('stage.customize.prev'), next: t('stage.customize.next') }}
    />
  )
}
