import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const getPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by your browser.'
        setError(err)
        reject(new Error(err))
        return
      }
      setLoading(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false)
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        },
        (err) => {
          setLoading(false)
          const msg = err.code === 1 ? 'Location permission denied.' : 'Unable to retrieve your location.'
          setError(msg)
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }, [])

  return { getPosition, loading, error }
}
