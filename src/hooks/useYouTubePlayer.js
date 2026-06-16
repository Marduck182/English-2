import { useEffect, useRef, useState, useCallback } from 'react'

// Module-level queue — survives component unmounts
let apiReady = false
const pending = []

function loadApi() {
  if (window.YT?.Player) { apiReady = true; return }
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return
  const prev = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true
    prev?.()
    pending.forEach(fn => fn())
    pending.length = 0
  }
  const s = document.createElement('script')
  s.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(s)
}

// Attach YT API to an EXISTING <iframe id={iframeId}> that already has
// enablejsapi=1 in its src. Do NOT pass videoId — the src already has it.
export function useYouTubePlayer(iframeId) {
  const playerRef   = useRef(null)
  const tickRef     = useRef(null)
  const [isReady,     setIsReady]     = useState(false)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [playerError, setPlayerError] = useState(null)

  useEffect(() => {
    if (!iframeId) return
    let dead = false

    function init() {
      if (dead) return
      playerRef.current = new window.YT.Player(iframeId, {
        events: {
          onReady() {
            if (dead) return
            setIsReady(true)
            setPlayerError(null)
            const d = playerRef.current?.getDuration?.()
            if (d) setDuration(d)
          },
          onError(e) {
            if (!dead) setPlayerError(e.data)
          },
          onStateChange(e) {
            if (dead) return
            const S = window.YT.PlayerState
            if (e.data === S.PLAYING) {
              setIsPlaying(true)
              const d = playerRef.current?.getDuration?.()
              if (d) setDuration(d)
              tickRef.current = setInterval(() => {
                const t = playerRef.current?.getCurrentTime?.()
                if (t != null) setCurrentTime(t)
              }, 150)
            } else {
              clearInterval(tickRef.current)
              setIsPlaying(false)
              const t = playerRef.current?.getCurrentTime?.()
              if (t != null) setCurrentTime(t)
            }
          },
        },
      })
    }

    if (apiReady) {
      init()
    } else {
      pending.push(init)
      loadApi()
    }

    return () => {
      dead = true
      const idx = pending.indexOf(init)
      if (idx !== -1) pending.splice(idx, 1)
      clearInterval(tickRef.current)
      try { playerRef.current?.destroy() } catch (_) {}
      playerRef.current = null
      setIsReady(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setPlayerError(null)
    }
  }, [iframeId])

  const seekTo = useCallback((s) => {
    playerRef.current?.seekTo?.(s, true)
    setCurrentTime(s)
  }, [])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    const state = playerRef.current.getPlayerState?.()
    if (state === window.YT?.PlayerState?.PLAYING) playerRef.current.pauseVideo()
    else playerRef.current.playVideo()
  }, [])

  const setRate = useCallback((r) => {
    playerRef.current?.setPlaybackRate?.(r)
  }, [])

  return { isReady, isPlaying, currentTime, duration, playerError, seekTo, togglePlay, setRate }
}
