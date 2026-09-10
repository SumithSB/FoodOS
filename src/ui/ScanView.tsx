import { useRef } from 'react'
import { detectScannerBackend, useBarcodeScanner } from '../scan/useBarcodeScanner.ts'
import type { ScannerBackend } from '../scan/useBarcodeScanner.ts'
import { Button } from './Button.tsx'
import { CameraIcon } from './icons.tsx'

interface Props {
  onBarcode: (barcode: string) => void
  onBackendChange: (backend: ScannerBackend) => void
}

export function ScanView({ onBarcode, onBackendChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { backend, error, scanning, start, stop } = useBarcodeScanner()

  const handleStart = async () => {
    const video = videoRef.current
    if (!video) return
    onBackendChange(detectScannerBackend())
    await start(video, onBarcode)
  }

  return (
    <section aria-label="Barcode scanner">
      <div className="mb-2 flex items-end justify-between px-5">
        <p className="apple-section-label !px-0 !pb-0">Scan</p>
        <p className="apple-caption font-mono">{backend}</p>
      </div>
      <div className="apple-group overflow-hidden">
        <div className="relative bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="aspect-[4/3] w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[88px] w-[148px] rounded-[12px] border-2 border-white/80" />
          </div>
        </div>
        <div className="apple-group-pad space-y-3">
          <p className="apple-caption">
            Point the camera at a UK packaged-food barcode.
          </p>
          {error && (
            <p role="alert" className="text-[15px] text-[color:var(--apple-red)]">
              {error}
            </p>
          )}
          {scanning ? (
            <Button variant="secondary" onClick={stop}>
              Stop Camera
            </Button>
          ) : (
            <Button onClick={() => void handleStart()}>
              <CameraIcon color="#fff" />
              Start Camera
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
