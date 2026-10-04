import { useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

// Opens the phone camera and calls onCode(text) once a QR is read.
export default function Scanner({
  onCode,
  onError,
}) {
  useEffect(() => {
    const scanner = new Html5Qrcode(
      'qr-reader'
    )

    let handled = false

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: {
            width: 240,
            height: 240,
          },
        },
        (text) => {
          if (handled) return

          handled = true

          scanner
            .stop()
            .catch(() => {})
            .finally(() => onCode(text))
        },
        () => {}
      )
      .catch(() =>
        onError?.(
          'Camera is not available. Allow camera access, or type the 6-digit code instead.'
        )
      )

    return () => {
      handled = true

      try {
        if (scanner.isScanning) {
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {})
        }
      } catch {
        /* already stopped */
      }
    }
  }, [])

  return (
    <div
      id="qr-reader"
      style={{
        width: '100%',
        maxWidth: 360,
        margin: '0 auto',
      }}
    />
  )
}