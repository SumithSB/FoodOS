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
    <section
      aria-label="Barcode scanner"
      className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-card-foreground">
            Scan a barcode
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Point the camera at a UK packaged-food barcode.
          </p>
        </div>
        <p className="shrink-0 rounded-full border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          backend {backend}
        </p>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-black">
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
          <div className="h-24 w-40 rounded border-2 border-accent/80" />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {scanning ? (
        <Button variant="secondary" onClick={stop} className="w-full sm:w-auto">
          Stop camera
        </Button>
      ) : (
        <Button onClick={() => void handleStart()} className="w-full sm:w-auto">
          <CameraIcon />
          Start camera
        </Button>
      )}
    </section>
  )
}
