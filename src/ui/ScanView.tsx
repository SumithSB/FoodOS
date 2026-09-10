import { useRef } from 'react'
import { detectScannerBackend, useBarcodeScanner } from '../scan/useBarcodeScanner.ts'
import type { ScannerBackend } from '../scan/useBarcodeScanner.ts'

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
    <section aria-label="Barcode scanner" className="rounded-lg border border-gray-300 p-4">
      <h2 className="text-base font-semibold text-gray-900">Scan a barcode</h2>
      <p className="mt-1 text-sm text-gray-600">
        Point the camera at a UK packaged-food barcode. Backend:{' '}
        <code className="rounded bg-gray-100 px-1">{backend}</code>
      </p>
      <video
        ref={videoRef}
        muted
        playsInline
        className="mt-2 aspect-[4/3] w-full rounded bg-black object-cover"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        {!scanning ? (
          <button
            type="button"
            onClick={() => void handleStart()}
            className="rounded bg-gray-900 px-4 py-2 text-white"
          >
            Start camera
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded border border-gray-400 px-4 py-2"
          >
            Stop camera
          </button>
        )}
      </div>
    </section>
  )
}
