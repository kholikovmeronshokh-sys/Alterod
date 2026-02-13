import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Lang = 'en' | 'ru'
type MoodId =
  | 'focus'
  | 'happy'
  | 'chill'
  | 'energy'
  | 'night'
  | 'dreamy'
  | 'coding'
  | 'summer'
  | 'retro'
  | 'storm'

type LocalizedText = Record<Lang, string>
type ErrorKey = 'none' | 'noTracks' | 'loadFailed'

type Mood = {
  id: MoodId
  name: LocalizedText
  vibe: LocalizedText
  query: string
  gradient: string
  accent: string
  card: string
}

type Track = {
  id: number
  title: string
  artist: string
  artwork: string
  preview: string
  collection: string
}

type Benefit = {
  title: LocalizedText
  desc: LocalizedText
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const TRACK_LIMIT = 20

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const copy = {
  en: {
    heroTitle: 'Music mood engine for product people',
    heroSubtitle:
      'Alterod is a startup concept where emotions shape color, motion, and music in one adaptive interface.',
    currentScene: 'Current Scene',
    tracksWord: 'tracks',
    loading: 'Loading tracks...',
    noTracks: 'No tracks found for this mood. Try another mood.',
    loadFailed: 'Could not load music right now. Please try again.',
    language: 'Language',
    missionKicker: 'Why Alterod',
    missionTitle: 'A mood-first platform that turns music into daily momentum',
    missionSubtitle:
      'We designed Alterod to quickly lift focus, energy, and emotional balance through curated sound experiences.',
    nowPlaying: 'Now Playing',
    idlePlayer: 'Choose a track to start the mood flow',
    previous: 'Previous',
    next: 'Next',
    play: 'Play',
    pause: 'Pause',
    loop: 'Loop',
    loopOn: 'Loop On',
    loopOff: 'Loop Off',
    share: 'Share',
    shareCopied: 'Track link copied',
    shareFailed: 'Could not share this track',
    autoDj: 'Auto-DJ is on: plays next track in order',
    shortcuts: 'Shortcuts',
    shortcutsHint: 'Space play/pause, Left/Right prev-next, L loop',
    installApp: 'Install App',
  },
  ru: {
    heroTitle: 'Музыкальный mood-движок для продуктовых команд',
    heroSubtitle:
      'Alterod - это стартап-концепт, где эмоции управляют цветом, анимацией и музыкой в одном адаптивном интерфейсе.',
    currentScene: 'Текущая сцена',
    tracksWord: 'треков',
    loading: 'Загрузка треков...',
    noTracks: 'Для этого настроения треки не найдены. Попробуйте другой режим.',
    loadFailed: 'Сейчас не удалось загрузить музыку. Попробуйте еще раз.',
    language: 'Язык',
    missionKicker: 'Почему Alterod',
    missionTitle: 'Платформа, где музыка становится источником настроения и продуктивности',
    missionSubtitle:
      'Alterod создан для быстрого подъема фокуса, энергии и эмоционального баланса через продуманные музыкальные сценарии.',
    nowPlaying: 'Сейчас играет',
    idlePlayer: 'Выберите трек, чтобы запустить настроение',
    previous: 'Назад',
    next: 'Вперед',
    play: 'Пуск',
    pause: 'Пауза',
    loop: 'Повтор',
    loopOn: 'Повтор Вкл',
    loopOff: 'Повтор Выкл',
    share: 'Поделиться',
    shareCopied: 'Ссылка на трек скопирована',
    shareFailed: 'Не удалось поделиться треком',
    autoDj: 'Auto-DJ включен: треки идут по порядку',
    shortcuts: 'Клавиши',
    shortcutsHint: 'Space пуск/пауза, Left/Right назад-вперед, L повтор',
    installApp: 'Установить',
  },
} as const

const BENEFITS: Benefit[] = [
  {
    title: { en: 'Instant Mood Lift', ru: 'Моментальный подъем настроения' },
    desc: {
      en: 'One tap switches atmosphere, color, and playlist for your current emotional state.',
      ru: 'Один клик меняет атмосферу, цвет и плейлист под текущее эмоциональное состояние.',
    },
  },
  {
    title: { en: 'Smart Daily Rhythm', ru: 'Умный ритм дня' },
    desc: {
      en: 'From deep focus to evening reset, each mode is built for real-life routines.',
      ru: 'От глубокой концентрации до вечернего перезапуска: каждый режим под ваш реальный день.',
    },
  },
  {
    title: { en: 'Startup-grade UX', ru: 'UX уровня стартапа' },
    desc: {
      en: 'Fast, responsive, and designed to feel premium on both desktop and mobile.',
      ru: 'Быстро, адаптивно и с премиальным ощущением на десктопе и мобильных устройствах.',
    },
  },
]

const MOODS: Mood[] = [
  {
    id: 'focus',
    name: { en: 'Focus Mode', ru: 'Режим Фокус' },
    vibe: { en: 'Deep work and clean execution', ru: 'Глубокая концентрация и чистое исполнение' },
    query: 'lofi focus instrumental',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #38bdf8 100%)',
    accent: '#38bdf8',
    card: 'rgba(15, 23, 42, 0.65)',
  },
  {
    id: 'happy',
    name: { en: 'Happy Boost', ru: 'Режим Радости' },
    vibe: { en: 'Positive lift and fast momentum', ru: 'Позитивный подъем и быстрый импульс' },
    query: 'upbeat pop happy',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #db2777 45%, #fb923c 100%)',
    accent: '#fb923c',
    card: 'rgba(76, 29, 149, 0.65)',
  },
  {
    id: 'chill',
    name: { en: 'Chill Flow', ru: 'Спокойный Поток' },
    vibe: { en: 'Soft atmosphere for long sessions', ru: 'Мягкая атмосфера для длинной сессии' },
    query: 'chill electronic downtempo',
    gradient: 'linear-gradient(135deg, #022c22 0%, #065f46 45%, #2dd4bf 100%)',
    accent: '#2dd4bf',
    card: 'rgba(2, 44, 34, 0.7)',
  },
  {
    id: 'energy',
    name: { en: 'Energy Push', ru: 'Энергия Рывка' },
    vibe: { en: 'High tempo launch sprint', ru: 'Высокий темп и запусковой спринт' },
    query: 'workout electronic hype',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #b91c1c 45%, #facc15 100%)',
    accent: '#facc15',
    card: 'rgba(69, 10, 10, 0.68)',
  },
  {
    id: 'night',
    name: { en: 'Night Drive', ru: 'Ночной Драйв' },
    vibe: { en: 'Neon pulse and cinematic texture', ru: 'Неоновый пульс и киношная текстура' },
    query: 'synthwave night drive',
    gradient: 'linear-gradient(135deg, #111827 0%, #312e81 45%, #7c3aed 100%)',
    accent: '#a78bfa',
    card: 'rgba(17, 24, 39, 0.72)',
  },
  {
    id: 'dreamy',
    name: { en: 'Dreamy Air', ru: 'Мечтательный Воздух' },
    vibe: { en: 'Floaty mood and creative visuals', ru: 'Воздушное настроение и креативные визуалы' },
    query: 'dream pop ambient',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0891b2 40%, #67e8f9 100%)',
    accent: '#67e8f9',
    card: 'rgba(12, 74, 110, 0.68)',
  },
  {
    id: 'coding',
    name: { en: 'Code Flow', ru: 'Код Поток' },
    vibe: { en: 'Steady rhythm for coding marathons', ru: 'Ровный ритм для код-марафона' },
    query: 'coding beats instrumental',
    gradient: 'linear-gradient(135deg, #052e16 0%, #166534 45%, #84cc16 100%)',
    accent: '#84cc16',
    card: 'rgba(5, 46, 22, 0.72)',
  },
  {
    id: 'summer',
    name: { en: 'Summer Pop', ru: 'Летний Поп' },
    vibe: { en: 'Sunset vibe and bright smiles', ru: 'Закатное настроение и яркие эмоции' },
    query: 'summer dance pop',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fdba74 100%)',
    accent: '#fdba74',
    card: 'rgba(124, 45, 18, 0.68)',
  },
  {
    id: 'retro',
    name: { en: 'Retro Wave', ru: 'Ретро Волна' },
    vibe: { en: '80s synth spirit for bold layouts', ru: 'Дух synth 80-х для смелого дизайна' },
    query: 'retro synthwave electro',
    gradient: 'linear-gradient(135deg, #172554 0%, #4338ca 45%, #c084fc 100%)',
    accent: '#c084fc',
    card: 'rgba(23, 37, 84, 0.7)',
  },
  {
    id: 'storm',
    name: { en: 'Storm Edge', ru: 'Грозовой Край' },
    vibe: { en: 'Dark pressure and dramatic build', ru: 'Темный напор и драматическое развитие' },
    query: 'dark electronic cinematic',
    gradient: 'linear-gradient(135deg, #111827 0%, #334155 45%, #94a3b8 100%)',
    accent: '#cbd5e1',
    card: 'rgba(15, 23, 42, 0.72)',
  },
]

function getLangFromPath(pathname: string): Lang | null {
  const cleanPath = pathname.toLowerCase()
  if (cleanPath === '/ru' || cleanPath.startsWith('/ru/')) {
    return 'ru'
  }
  if (cleanPath === '/en' || cleanPath.startsWith('/en/')) {
    return 'en'
  }
  return null
}

function syncPathWithLang(nextLang: Lang, mode: 'push' | 'replace' = 'push') {
  const targetPath = `/${nextLang}`
  if (window.location.pathname === targetPath) {
    return
  }

  if (mode === 'replace') {
    window.history.replaceState({}, '', targetPath)
    return
  }

  window.history.pushState({}, '', targetPath)
}

function App() {
  const [lang, setLang] = useState<Lang>(() => getLangFromPath(window.location.pathname) ?? 'en')
  const [activeMoodId, setActiveMoodId] = useState<MoodId>('focus')
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey>('none')
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null)
  const [isCurrentPlaying, setIsCurrentPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loopTrackId, setLoopTrackId] = useState<number | null>(null)
  const [shareNotice, setShareNotice] = useState('')
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const trackCache = useRef<Partial<Record<MoodId, Track[]>>>({})
  const audioRefs = useRef<Record<number, HTMLAudioElement | null>>({})

  const activeMood = useMemo(
    () => MOODS.find((mood) => mood.id === activeMoodId) ?? MOODS[0],
    [activeMoodId],
  )

  const text = copy[lang]
  const currentTrack = tracks.find((track) => track.id === currentTrackId) ?? null
  const currentIndex = currentTrack ? tracks.findIndex((track) => track.id === currentTrack.id) : -1

  function pauseAllExcept(trackId: number) {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (!audio) return
      if (Number(id) !== trackId) {
        audio.pause()
      }
    })
  }

  function playTrackById(trackId: number) {
    const audio = audioRefs.current[trackId]
    if (!audio) return
    void audio.play().catch(() => {
      setIsCurrentPlaying(false)
    })
  }

  function toggleCurrentPlayback() {
    if (!currentTrackId) {
      if (tracks[0]) playTrackById(tracks[0].id)
      return
    }

    const audio = audioRefs.current[currentTrackId]
    if (!audio) return

    if (audio.paused) {
      void audio.play().catch(() => {
        setIsCurrentPlaying(false)
      })
    } else {
      audio.pause()
    }
  }

  function playNeighbor(direction: -1 | 1) {
    if (!tracks.length) return
    const startIndex = currentIndex >= 0 ? currentIndex : 0
    let nextIndex = startIndex + direction
    if (nextIndex < 0) nextIndex = tracks.length - 1
    if (nextIndex >= tracks.length) nextIndex = 0
    const nextTrack = tracks[nextIndex]
    if (!nextTrack) return
    playTrackById(nextTrack.id)
  }

  function getNextTrackInOrder(currentId: number): number | null {
    const index = tracks.findIndex((track) => track.id === currentId)
    if (index < 0 || tracks.length < 2) return null
    const nextIndex = index + 1 >= tracks.length ? 0 : index + 1
    return tracks[nextIndex]?.id ?? null
  }

  function setSingleLoopTrack(trackId: number | null) {
    setLoopTrackId(trackId)
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (!audio) return
      audio.loop = trackId !== null && Number(id) === trackId
    })
  }

  function toggleLoop(trackId: number) {
    if (loopTrackId === trackId) {
      setSingleLoopTrack(null)
      return
    }
    setSingleLoopTrack(trackId)
  }

  async function shareTrack(track: Track) {
    const url = `${window.location.origin}/${lang}?mood=${activeMood.id}&track=${track.id}`
    const payload = {
      title: `Alterod - ${track.title}`,
      text: `${track.title} - ${track.artist}`,
      url,
    }

    try {
      if (navigator.share) {
        await navigator.share(payload)
        setShareNotice('')
        return
      }

      await navigator.clipboard.writeText(url)
      setShareNotice(text.shareCopied)
    } catch {
      setShareNotice(text.shareFailed)
    }
  }

  useEffect(() => {
    const pathLang = getLangFromPath(window.location.pathname)

    if (!pathLang) {
      syncPathWithLang(lang, 'replace')
    }

    const onPopState = () => {
      const fromPath = getLangFromPath(window.location.pathname)
      setLang(fromPath ?? 'en')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [lang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--app-gradient', activeMood.gradient)
    root.style.setProperty('--accent', activeMood.accent)
    root.style.setProperty('--card-bg', activeMood.card)
  }, [activeMood])

  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      if (!audio) return
      audio.pause()
      audio.currentTime = 0
    })
    setCurrentTrackId(null)
    setIsCurrentPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    const cached = trackCache.current[activeMood.id]
    if (cached?.length) {
      setTracks(cached)
      setLoading(false)
      setErrorKey('none')
      return
    }

    const controller = new AbortController()

    async function loadTracks() {
      setLoading(true)
      setErrorKey('none')

      try {
        const term = encodeURIComponent(activeMood.query)
        const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=50`

        const response = await fetch(url, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Music API temporarily unavailable')
        }

        const data = (await response.json()) as {
          results?: Array<{
            trackId?: number
            trackName?: string
            artistName?: string
            artworkUrl100?: string
            previewUrl?: string
            collectionName?: string
          }>
        }

        const mapped = (data.results ?? [])
          .filter((item) => item.trackId && item.trackName && item.artistName && item.previewUrl)
          .slice(0, TRACK_LIMIT)
          .map((item) => ({
            id: item.trackId as number,
            title: item.trackName as string,
            artist: item.artistName as string,
            artwork: (item.artworkUrl100 ?? '').replace('100x100', '300x300'),
            preview: item.previewUrl as string,
            collection: item.collectionName ?? 'Single',
          }))

        trackCache.current[activeMood.id] = mapped
        setTracks(mapped)

        if (!mapped.length) {
          setErrorKey('noTracks')
        }
      } catch (fetchError) {
        if ((fetchError as Error).name === 'AbortError') {
          return
        }
        setTracks([])
        setErrorKey('loadFailed')
      } finally {
        setLoading(false)
      }
    }

    loadTracks()

    return () => controller.abort()
  }, [activeMood])

  useEffect(() => {
    if (!currentTrackId) return
    const stillExists = tracks.some((track) => track.id === currentTrackId)
    if (!stillExists) {
      setCurrentTrackId(null)
      setIsCurrentPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [tracks, currentTrackId])

  useEffect(() => {
    if (!shareNotice) return
    const timer = window.setTimeout(() => setShareNotice(''), 1800)
    return () => window.clearTimeout(timer)
  }, [shareNotice])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPromptEvent(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setInstallPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingContext =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (isTypingContext) return

      if (event.code === 'Space') {
        event.preventDefault()
        toggleCurrentPlayback()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        playNeighbor(-1)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        playNeighbor(1)
        return
      }

      if (event.key.toLowerCase() === 'l' && currentTrackId) {
        event.preventDefault()
        toggleLoop(currentTrackId)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentTrackId, tracks, loopTrackId])

  return (
    <main className="app-shell">
      <div className="noise-layer" aria-hidden="true" />

      <header className="hero">
        <div className="hero-topbar">
          <p className="eyebrow">Alterod</p>
          <div className="hero-actions">
            {installPromptEvent ? (
              <button
                type="button"
                className="install-btn"
                onClick={async () => {
                  await installPromptEvent.prompt()
                  await installPromptEvent.userChoice
                  setInstallPromptEvent(null)
                }}
              >
                {text.installApp}
              </button>
            ) : null}
            <div className="lang-switch" role="group" aria-label={text.language}>
              <button
                type="button"
                className={lang === 'en' ? 'active' : ''}
                onClick={() => {
                  setLang('en')
                  syncPathWithLang('en')
                }}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'ru' ? 'active' : ''}
                onClick={() => {
                  setLang('ru')
                  syncPathWithLang('ru')
                }}
              >
                RU
              </button>
            </div>
          </div>
        </div>

        <h1>{text.heroTitle}</h1>
        <p className="subtitle">{text.heroSubtitle}</p>
      </header>

      <section className="mission-section" aria-label="Alterod mission">
        <div className="mission-copy">
          <p className="eyebrow">{text.missionKicker}</p>
          <h2>{text.missionTitle}</h2>
          <p>{text.missionSubtitle}</p>
          <div className="mission-grid">
            {BENEFITS.map((item) => (
              <article key={item.title.en} className="mission-card">
                <h3>{item.title[lang]}</h3>
                <p>{item.desc[lang]}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="mission-visual" aria-hidden="true">
          <img
            src="https://ideogram.ai/assets/image/balanced/response/F3g0w369Su-AlCQoNF0mdw@2k"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className="mission-overlay">
            <span>ALTEROD</span>
            <strong>sound of momentum</strong>
          </div>
        </aside>
      </section>

      <section className="mood-grid" aria-label="Mood selector">
        {MOODS.map((mood) => {
          const isActive = mood.id === activeMood.id
          return (
            <button
              key={mood.id}
              type="button"
              className={`mood-card ${isActive ? 'active' : ''}`}
              onClick={() => setActiveMoodId(mood.id)}
            >
              <span className="mood-name">{mood.name[lang]}</span>
              <span className="mood-vibe">{mood.vibe[lang]}</span>
            </button>
          )
        })}
      </section>

      <section className="results-panel" aria-live="polite">
        <div className="results-head">
          <div>
            <p className="eyebrow">{text.currentScene}</p>
            <h2>{activeMood.name[lang]}</h2>
          </div>
          <span className="status-chip">
            {loading ? text.loading : `${tracks.length} ${text.tracksWord}`}
          </span>
        </div>

        <div className="now-playing-bar">
          <div className="now-playing-meta">
            <p className="eyebrow">{text.nowPlaying}</p>
            {currentTrack ? (
              <>
                <h3>{currentTrack.title}</h3>
                <p>{currentTrack.artist}</p>
              </>
            ) : (
              <p>{text.idlePlayer}</p>
            )}
            <p className="shortcuts-hint">
              <strong>{text.shortcuts}:</strong> {text.shortcutsHint}
            </p>
            <p className="auto-dj-hint">{text.autoDj}</p>
          </div>
          <div className="now-playing-controls">
            <button type="button" onClick={() => playNeighbor(-1)} disabled={!tracks.length}>
              {text.previous}
            </button>
            <button
              type="button"
              onClick={toggleCurrentPlayback}
              disabled={!tracks.length}
            >
              {isCurrentPlaying ? text.pause : text.play}
            </button>
            <button type="button" onClick={() => playNeighbor(1)} disabled={!tracks.length}>
              {text.next}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentTrackId) return
                toggleLoop(currentTrackId)
              }}
              disabled={!currentTrackId}
            >
              {loopTrackId === currentTrackId ? text.loopOn : text.loop}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!currentTrack) return
                void shareTrack(currentTrack)
              }}
              disabled={!currentTrack}
            >
              {text.share}
            </button>
          </div>
          <div className="now-playing-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        {shareNotice ? <p className="share-notice">{shareNotice}</p> : null}

        {errorKey !== 'none' ? <p className="error-text">{text[errorKey]}</p> : null}

        <div className="track-grid">
          {tracks.map((track) => (
            <article className="track-card" key={track.id}>
              <img src={track.artwork} alt={`${track.title} cover`} loading="lazy" decoding="async" />
              <div className="track-meta">
                <h3>{track.title}</h3>
                <p>{track.artist}</p>
                <small>{track.collection}</small>
              </div>
              <audio
                ref={(node) => {
                  audioRefs.current[track.id] = node
                }}
                controls
                controlsList="nodownload noplaybackrate noremoteplayback"
                preload="none"
                src={track.preview}
                onPlay={(event) => {
                  pauseAllExcept(track.id)
                  event.currentTarget.loop = loopTrackId === track.id
                  setCurrentTrackId(track.id)
                  setIsCurrentPlaying(true)
                  setCurrentTime(event.currentTarget.currentTime || 0)
                  setDuration(event.currentTarget.duration || 0)
                }}
                onPause={() => {
                  if (currentTrackId === track.id) {
                    setIsCurrentPlaying(false)
                  }
                }}
                onTimeUpdate={(event) => {
                  if (currentTrackId === track.id) {
                    setCurrentTime(event.currentTarget.currentTime || 0)
                  }
                }}
                onLoadedMetadata={(event) => {
                  if (currentTrackId === track.id) {
                    setDuration(event.currentTarget.duration || 0)
                  }
                }}
                onEnded={() => {
                  if (currentTrackId === track.id) {
                    setIsCurrentPlaying(false)
                    setCurrentTime(0)
                    if (loopTrackId !== track.id) {
                      const nextTrackId = getNextTrackInOrder(track.id)
                      if (nextTrackId !== null) {
                        playTrackById(nextTrackId)
                      }
                    }
                  }
                }}
              />
              <div className="track-actions">
                <button type="button" onClick={() => toggleLoop(track.id)}>
                  {loopTrackId === track.id ? text.loopOn : text.loopOff}
                </button>
                <button type="button" onClick={() => void shareTrack(track)}>
                  {text.share}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="app-footer">2026 yil Kholikov Meronshokh</footer>
    </main>
  )
}

export default App
