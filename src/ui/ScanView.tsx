import { useEffect, useRef } from 'react'
import { detectScannerBackend, useBarcodeScanner } from '../scan/useBarcodeScanner.ts'
import type { ScannerBackend } from '../scan/useBarcodeScanner.ts'

interface Props {
  paused: boolean
  lookingUp: boolean
  lookupError: string | null
  onBarcode: (barcode: string) => void
  onBackendChange: (backend: ScannerBackend) => void
}

export function ScanView({ paused, lookingUp, lookupError, onBarcode, onBackendChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onBarcodeRef = useRef(onBarcode)
  const { error, scanning, start, stop } = useBarcodeScanner()

  useEffect(() => {
    onBarcodeRef.current = onBarcode
  }, [onBarcode])

  useEffect(() => {
    if (paused) {
      stop()
      return
    }
    const video = videoRef.current
    if (!video) return
    onBackendChange(detectScannerBackend())
    void start(video, (code) => {
      stop()
      onBarcodeRef.current(code)
    })
    return () => stop()
  }, [paused, start, stop, onBackendChange])

  const handleShutter = () => {
    if (scanning) {
      stop()
      return
    }
    const video = videoRef.current
    if (!video) return
    onBackendChange(detectScannerBackend())
    void start(video, (code) => {
      stop()
      onBarcodeRef.current(code)
    })
  }

  const hint = lookupError
    ? lookupError
    : error
      ? error
      : scanning
        ? 'Align the barcode inside the frame'
        : 'Tap the shutter to start the camera'

  return (
    <section className="ic-stage" aria-label="Barcode scanner">
      <video ref={videoRef} muted playsInline />
      <div className="ic-vignette" aria-hidden="true" />
      <div className="ic-finder" aria-hidden="true">
        <span className="ic-corner ic-corner-tl" />
        <span className="ic-corner ic-corner-tr" />
        <span className="ic-corner ic-corner-bl" />
        <span className="ic-corner ic-corner-br" />
        {scanning && !lookingUp && <span className="ic-scanline" />}
      </div>

      {lookingUp && (
        <div className="ic-overlay" role="status">
          <div>
            <div className="ic-spinner" aria-hidden="true" />
            <p>Looking up this product…</p>
          </div>
        </div>
      )}

      <div className="ic-chrome-bottom">
        <p className={`ic-hint${lookupError || error ? ' ic-hint-error' : ''}`} role={lookupError || error ? 'alert' : undefined}>
          {hint}
        </p>
        <button
          type="button"
          className="ic-shutter"
          aria-label={scanning ? 'Stop camera' : 'Start camera'}
          aria-pressed={scanning}
          onClick={handleShutter}
        >
          <span className="ic-shutter-inner" />
        </button>
      </div>
    </section>
  )
}
