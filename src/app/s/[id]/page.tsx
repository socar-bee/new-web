import { notFound } from 'next/navigation'
import { cache } from 'react'

import LdJson from '@/shared/components/scripts/LdJson'

import { META_KEYWORDS, removeOperatorPrefix } from '@/shared/lib/seo'

import type { Metadata } from 'next'

import { fetchSharedParkingLotDetail } from '@/app/s/[id]/model/api'

import SharedDetailView from './view'

interface PageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 600

const getSharedDetail = cache(fetchSharedParkingLotDetail)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  // NOTE: 비정상 seq는 백엔드 500 유발 → 호출 전에 404로 차단 (modu-web-app /s 와 동일 가드)
  if (!/^\d+$/.test(id)) return notFound()

  try {
    const detail = await getSharedDetail(id)
    if (!detail) return notFound()

    const address = detail.basic.newAddress || detail.basic.address
    const title = removeOperatorPrefix(detail.basic.name)
    const desc = `${title}은 ${address}에 위치합니다.`

    const host = process.env.NEXT_PUBLIC_WEBAPP_HOST || 'https://app.modu.kr'
    const pageUrl = `${host}/s/${id}`
    const ogImage = detail.basic.photos[0]?.file_name ?? `${host}/images/light_img_linkbanner.png`

    return {
      title,
      description: desc,
      keywords: META_KEYWORDS.PARKINGLOT_DETAIL,
      alternates: { canonical: pageUrl },
      openGraph: {
        title,
        description: desc,
        siteName: '모두의주차장',
        locale: 'ko_KR',
        url: pageUrl,
        images: ogImage
      }
    }
  } catch {
    return notFound()
  }
}

export default async function SharedParkingPage({ params }: PageProps) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return notFound()
  const seq = Number(id)

  let initialDetail = undefined
  try {
    initialDetail = await getSharedDetail(id)
  } catch {
    return notFound()
  }

  const meta = await generateMetadata({ params })
  const jsonTitle = String(meta.title ?? '모두의주차장 - 주변 주차장 찾기')
  const jsonDesc =
    typeof meta.description === 'string'
      ? meta.description
      : '지도 화면에서 근처의 주차장 위치와 가격을 한 눈에 확인하세요. 편리하게 주차장을 예약하고, 주차 정보를 공유하세요.'

  return (
    <>
      <LdJson title={jsonTitle} desc={jsonDesc} keywords={META_KEYWORDS.PARKINGLOT_DETAIL} />
      <SharedDetailView seq={seq} initialDetail={initialDetail} />
    </>
  )
}
