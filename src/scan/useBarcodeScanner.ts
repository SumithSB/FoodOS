import { useCallback, useEffect, useRef, useState } from 'react'

export type ScannerBackend = 'unknown' | 'native' | 'zxing' | 'unsupported'

interface NativeDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>
}

type NativeDetectorCtor = new (options?: { formats: string[] }) => NativeDetector

function nativeCtor(): NativeDetectorCtor | null {
  const ctor = (window as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector
  return ctor ?? null
}

function hasCamera(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  )
}

/** Feature-detect the scanning backend without starting the camera. */
export function detectScannerBackend(): ScannerBackend {
  if (!hasCamera()) return 'unsupported'
  // BarcodeDetector is unsupported in Safari on iOS — fall back to ZXing.
  if (nativeCtor()) return 'native'
  return 'zxing'
}

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code']

/**
 * Camera barcode scanner. Uses the native BarcodeDetector API where
 * available, otherwise the @zxing/browser WASM fallback. The active
 * backend is exposed so the UI can show it in a debug corner.
 */
export function useBarcodeScanner() {
  const [backend, setBackend] = useState<ScannerBackend>('unknown')
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null)
  const resultRef = useRef<(barcode: string) => void>(() => {})

  const stopTracks = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    zxingControlsRef.current?.stop()
    zxingControlsRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  const startNative = useCallback(
    async (video: HTMLVideoElement, ctor: NativeDetectorCtor) => {
      const detector = new ctor({ formats: NATIVE_FORMATS })
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      await video.play()
      const loop = async () => {
        if (!streamRef.current) return
        try {
          const codes = await detector.detect(video)
          const value = codes.find((c) => c.rawValue)?.rawValue
          if (value) {
            resultRef.current(value)
            return
          }
        } catch {
          // Detection on a single frame can fail; keep scanning.
        }
        rafRef.current = requestAnimationFrame(() => void loop())
      }
      rafRef.current = requestAnimationFrame(() => void loop())
    },
    [],
  )

  const startZxing = useCallback(async (video: HTMLVideoElement) => {
    const { BrowserMultiFormatReader } = await import('@zxing/browser')
    const reader = new BrowserMultiFormatReader()
    const devices = await BrowserMultiFormatReader.listVideoInputDevices().catch(() => [])
    const rear =
      devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0]
    const controls = await reader.decodeFromVideoDevice(
      rear?.deviceId,
      video,
      (result) => {
        const value = result?.getText()
        if (value) resultRef.current(value)
      },
    )
    zxingControlsRef.current = controls
  }, [])

  const start = useCallback(
    async (video: HTMLVideoElement, onResult: (barcode: string) => void) => {
      setError(null)
      resultRef.current = (barcode: string) => {
        onResult(barcode)
      }
      const ctor = nativeCtor()
      try {
        if (!hasCamera()) {
          setBackend('unsupported')
          setError('No camera is available on this device or context.')
          return
        }
        if (ctor) {
          setBackend('native')
          await startNative(video, ctor)
        } else {
          setBackend('zxing')
          await startZxing(video)
        }
        setScanning(true)
      } catch (err) {
        stopTracks()
        setError(
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access and try again.'
            : `Could not start the camera: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
    [startNative, startZxing, stopTracks],
  )

  const stop = useCallback(() => {
    stopTracks()
  }, [stopTracks])

  useEffect(() => stopTracks, [stopTracks])

  return { backend, error, scanning, start, stop, detectBackend: detectScannerBackend }
}
