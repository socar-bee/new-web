'use client'

interface ParkingClusterProps {
  count: number
}

export default function ParkingCluster({ count }: ParkingClusterProps) {
  return (
    <div className="relative h-full w-full">
      {/* Ping animation */}
      <div className="absolute top-0 left-1/2 z-[5] -translate-x-1/2">
        <div
          className="bg-primary h-[28px] w-[28px] translate-x-[7px] translate-y-[7px] animate-ping rounded-full opacity-[0.12]"
          style={{ animationDuration: '2.5s' }}
        />
      </div>

      {/* Marker */}
      <div className="relative z-[10] flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="53" viewBox="0 0 48 53" fill="none">
          <mask id={`parking-cluster-mask-${count}`} fill="white">
            <path d="M24 0C37.2548 0 48 10.7452 48 24C48 35.6337 39.7221 45.3325 28.7354 47.5312L24 53L19.2637 47.5312C8.27735 45.3321 0 35.6334 0 24C0 10.7452 10.7452 0 24 0Z" />
          </mask>
          <path
            d="M24 0C37.2548 0 48 10.7452 48 24C48 35.6337 39.7221 45.3325 28.7354 47.5312L24 53L19.2637 47.5312C8.27735 45.3321 0 35.6334 0 24C0 10.7452 10.7452 0 24 0Z"
            fill="#0099ff"
          />
          <path
            d="M28.7354 47.5312L28.3429 45.5701L27.6716 45.7045L27.2234 46.2221L28.7354 47.5312ZM24 53L22.4882 54.3093L24.0002 56.0551L25.512 54.3092L24 53ZM19.2637 47.5312L20.7755 46.2219L20.3274 45.7045L19.6562 45.5702L19.2637 47.5312ZM24 0V2C36.1503 2 46 11.8497 46 24H48H50C50 9.6406 38.3594 -2 24 -2V0ZM48 24H46C46 34.6617 38.4134 43.5547 28.3429 45.5701L28.7354 47.5312L29.1278 49.4924C41.0309 47.1102 50 36.6057 50 24H48ZM28.7354 47.5312L27.2234 46.2221L22.488 51.6908L24 53L25.512 54.3092L30.2473 48.8404L28.7354 47.5312ZM24 53L25.5118 51.6907L20.7755 46.2219L19.2637 47.5312L17.7518 48.8406L22.4882 54.3093L24 53ZM19.2637 47.5312L19.6562 45.5702C9.58616 43.5544 2 34.6614 2 24H0H-2C-2 36.6053 6.96855 47.1098 18.8711 49.4923L19.2637 47.5312ZM0 24H2C2 11.8497 11.8497 2 24 2V0V-2C9.6406 -2 -2 9.6406 -2 24H0Z"
            fill="#007acc"
            mask={`url(#parking-cluster-mask-${count})`}
          />
          <text
            x="24"
            y="30"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="18"
            fontWeight="700"
            fontFamily="Pretendard, sans-serif"
          >
            {count}
          </text>
        </svg>
      </div>
    </div>
  )
}
