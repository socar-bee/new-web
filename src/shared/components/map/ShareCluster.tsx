'use client'

interface ShareClusterProps {
  count: number
}

export default function ShareCluster({ count }: ShareClusterProps) {
  return (
    <div className="relative h-full w-full">
      {/* Ping animation */}
      <div className="absolute top-0 left-1/2 z-[5] -translate-x-1/2">
        <div
          className="bg-brand-400 h-[36px] w-[36px] translate-x-[6px] translate-y-[6px] animate-ping rounded-full opacity-[0.12]"
          style={{ animationDuration: '2.5s' }}
        />
      </div>

      {/* Marker */}
      <div className="relative z-[10] flex flex-col items-center">
        <div className="border-brand-400 bg-brand-100 flex h-[48px] w-[48px] items-center justify-center rounded-full border-[2.5px] shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
          <span className="text-brand-700 text-[16px] leading-none font-bold">{count}</span>
        </div>
      </div>
    </div>
  )
}
