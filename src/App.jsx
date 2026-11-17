import { useEffect, useState } from 'react'
import './App.css'
import API from './config';

//const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const sports = [
  'All sports',
  'Badminton',
  'Basketball',
  'Cricket',
  'Football',
  'Tennis',
  'Volleyball',
  'Table tennis',
  'Carrom',
  'Chess',
]

async function readResponse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function mapBooking(booking) {
  if (!booking) return null

  return {
    ...booking,
    started: new Date(booking.startTime).getTime(),
    until: new Date(booking.endTime).getTime(),
  }
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getRemaining(until, now) {
  const total = Math.max(0, Math.floor((until - now) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function sportIcon(sport) {
  const icons = {
    Badminton: '🏸',
    Basketball: '🏀',
    Cricket: '🏏',
    Football: '⚽',
    Tennis: '🎾',
    Volleyball: '🏐',
    'Table tennis': '🏓',
    Carrom: '◉',
    Chess: '♞',
  }

  return icons[sport] || '✦'
}

function App() {
  const [filter, setFilter] = useState('All sports')
  const [courts, setCourts] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [courtError, setCourtError] = useState('')
  const [student, setStudent] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [showLogin, setShowLogin] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)

  function showToast(message, type = 'info', duration = 4000) {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  async function loadCourts() {
    try {
      const response = await fetch(`${API}/courts`)
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || `Request failed: ${response.status}`)
      }

      setCourts(
        data.map((court) => ({
          ...court,
          sport: court.sport === 'Table Tennis' ? 'Table tennis' : court.sport,
          place: court.location,
          booking: mapBooking(court.booking),
        })),
      )
      setCourtError('')
    } catch (error) {
      console.error('Could not load courts:', error)
      setCourtError(
        'Could not load courts. Make sure the Spring Boot backend is running.',
      )
    } finally {
      setLoadingCourts(false)
    }
  }

  async function loadMyBookings() {
    const response = await fetch(`${API}/bookings/mine`, {
      credentials: 'include',
    })
    const data = await readResponse(response)

    if (!response.ok) {
      throw new Error(data?.message || 'Could not load your bookings.')
    }

    setMyBookings(data)
    return data
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadCourts()
    const refresh = setInterval(loadCourts, 10000)
    return () => clearInterval(refresh)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreStudentSession() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include',
        })

        if (!response.ok) return

        const data = await readResponse(response)
        if (cancelled || !data) return

        setStudent(data.fullName)
        await loadMyBookings()
      } catch {
        if (!cancelled) {
          setStudent('')
          setMyBookings([])
        }
      }
    }

    restoreStudentSession()
    return () => {
      cancelled = true
    }
  }, [])

  const currentStudentBooking = myBookings.find(
    (booking) =>
      booking.status === 'ACTIVE' &&
      new Date(booking.endTime).getTime() > now,
  )

  const bookingCourt = currentStudentBooking
    ? courts.find(
        (court) => String(court.id) === String(currentStudentBooking.courtId),
      )
    : null

  const myBooking =
    currentStudentBooking && bookingCourt
      ? {
          ...bookingCourt,
          booking: mapBooking(currentStudentBooking),
        }
      : null

  const availableCount = courts.filter(
    (court) => court.active && court.available,
  ).length

  const shownCourts = courts.filter(
    (court) => filter === 'All sports' || court.sport === filter,
  )

  async function login(event) {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)

    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('fullName') || '').trim()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')

    try {
      if (authMode === 'register') {
        const registerResponse = await fetch(`${API}/auth/register`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password }),
        })
        const registerData = await readResponse(registerResponse)

        if (!registerResponse.ok) {
          throw new Error(registerData?.message || 'Could not create the account.')
        }
      }

      const loginResponse = await fetch(`${API}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await readResponse(loginResponse)

      if (!loginResponse.ok) {
        throw new Error(loginData?.message || 'Could not sign in.')
      }

      setStudent(loginData.fullName)
      await loadMyBookings()
      setShowLogin(false)
      setAuthMode('login')
      showToast(
        authMode === 'register'
          ? `Account created! Welcome, ${loginData.fullName}.`
          : `Signed in as ${loginData.fullName}.`,
        'success',
      )
      event.currentTarget.reset()
    } catch (error) {
      setAuthError(error.message || 'Could not connect to the backend.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setStudent('')
      setMyBookings([])
      showToast('You have signed out.', 'info')
    }
  }

  function bookCourt(court) {
    if (!student) {
      setAuthMode('login')
      setShowLogin(true)
      showToast('Please sign in to reserve a court.', 'info')
      return
    }

    if (myBooking) {
      showToast(
        'You already have an active booking in progress. Please finish that session first.',
        'error',
        5000,
      )
      return
    }

    if (!court.available) {
      showToast('This court is no longer available. Refreshing courts...', 'error')
      loadCourts()
      return
    }

    setConfirmModal({
      title: 'Confirm Court Booking',
      court,
      duration: durationMinutes,
      message: `Reserve ${court.name} for ${durationMinutes} minutes under ${student}?`,
      confirmText: 'Confirm Booking',
      cancelText: 'Cancel',
      isDanger: false,
      onConfirm: () => executeBooking(court),
    })
  }

  async function executeBooking(court) {
    setConfirmModal(null)

    try {
      const response = await fetch(`${API}/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: court.id,
          durationMinutes,
        }),
      })
      const data = await readResponse(response)

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            data?.message ||
              'You already have an active booking in progress. Please finish that session first.',
          )
        } else if (response.status === 401) {
          throw new Error('Your session has expired. Please sign in again.')
        } else {
          throw new Error(data?.message || 'Could not create the booking.')
        }
      }

      await Promise.all([loadCourts(), loadMyBookings()])

      showToast(
        `Booking confirmed! Code: ${data.bookingCode} (${formatClock(new Date(data.startTime).getTime())} - ${formatClock(new Date(data.endTime).getTime())})`,
        'success',
        6000,
      )
    } catch (error) {
      showToast(error.message || 'Could not connect to the backend.', 'error', 5000)
      await loadCourts()
    }
  }

  function endSession() {
    if (!myBooking) return

    setConfirmModal({
      title: 'End Session Early',
      court: myBooking,
      message: `Are you sure you want to end your session on ${myBooking.name} and release it for other players?`,
      confirmText: 'End Session Now',
      cancelText: 'Keep Playing',
      isDanger: true,
      onConfirm: () => executeEndSession(),
    })
  }

  async function executeEndSession() {
    setConfirmModal(null)
    if (!myBooking) return

    try {
      const response = await fetch(
        `${API}/bookings/${myBooking.booking.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      const data = await readResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || 'Could not end the session.')
      }

      await Promise.all([loadCourts(), loadMyBookings()])
      showToast('Your session has ended. Court is now free for others.', 'success')
    } catch (error) {
      showToast(error.message || 'Could not connect to the backend.', 'error', 5000)
    }
  }

  function openAuth(mode) {
    setAuthMode(mode)
    setAuthError('')
    setShowLogin(true)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="Courtside home">
          <img
            className="university-logo"
            src="./anurag-university-logo.png"
            alt="Anurag University logo"
          />
          <span className="brand-name">
            court<span>side</span>
          </span>
        </a>

        <p className="side-label">UNIVERSITY</p>
        <div className="campus">
          <span className="campus-icon">🏫</span>
          <span>
            <b>Anurag University</b>
            <small>Sports complex</small>
          </span>
        </div>

        <p className="side-label">MENU</p>
        <a className="side-link active" href="#dashboard">▦ &nbsp; Dashboard</a>
        <a className="side-link" href="#courts">⌕ &nbsp; Find a court</a>
        <a className="side-link" href="#history">◷ &nbsp; My bookings</a>

        <p className="side-label">SPORTS</p>
        {sports.slice(1).map((sport) => (
          <button
            className="side-link"
            key={sport}
            onClick={() => {
              setFilter(sport)
              document.querySelector('#courts')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <span className="side-sport-icon">{sportIcon(sport)}</span>
            {sport}
          </button>
        ))}

        <div className="side-note">
          <b>Ready to play?</b>
          <p>Find a free court and get your game on.</p>
          <a href="#courts">Explore courts →</a>
        </div>
      </aside>

      <main className="main" id="dashboard">
        <header className="topbar">
          <span>Anurag University <i>/</i> <b>Dashboard</b></span>
          <div className="account">
            {student ? (
              <>
                <span className="student">● &nbsp; {student}</span>
                <button className="login-button signout-button" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button className="login-button" onClick={() => openAuth('login')}>
                  Student Login
                </button>
                <button className="login-button" onClick={() => openAuth('register')}>
                  Register
                </button>
              </>
            )}
          </div>
        </header>

        <div className="content">
          <div className="welcome">
            <div>
              <p className="kicker">ANURAG UNIVERSITY · CAMPUS SPORTS</p>
              <h1>
                Good day{student ? `, ${student.split(' ')[0]}` : ''}
                <span className="accent-mark">✳</span>
              </h1>
              <p className="sub">Your next game is just around the corner.</p>
            </div>
            <div className="date">
              📅 &nbsp;
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {myBooking ? (
            <section className="session" id="session">
              <div className="session-copy">
                <p className="kicker">YOUR SESSION IS LIVE</p>
                <h2>{myBooking.sport} · {myBooking.name}</h2>
                <p className="session-place">{myBooking.place}</p>
                <p>Booking ID: {myBooking.booking.bookingCode}</p>
                <div className="session-times">
                  <span>
                    <small>STARTED</small>
                    <b>{formatDateTime(myBooking.booking.started)}</b>
                  </span>
                  <span>
                    <small>SCHEDULED END</small>
                    <b>{formatDateTime(myBooking.booking.until)}</b>
                  </span>
                </div>
              </div>
              <div className="countdown">
                <small>TIME REMAINING</small>
                <strong>{getRemaining(myBooking.booking.until, now)}</strong>
              </div>
              <button className="end-button" onClick={endSession}>End session</button>
            </section>
          ) : (
            <section className="hero">
              <div>
                <p className="kicker">YOUR DAILY PLAYBOOK</p>
                <h2>Bring your game.<br />We’ll find the court.</h2>
                <p>Check availability and reserve a court for your chosen time.</p>
                <a href="#courts" className="hero-button">Find your court →</a>
              </div>
              <div className="hero-ball" aria-hidden="true">🏸</div>
              <span className="hero-tag">9 SPORTS · ONE UNIVERSITY</span>
            </section>
          )}

          <section className="stats" aria-label="Court availability summary">
            <article>
              <span>🏟</span>
              <small>TOTAL COURTS</small>
              <b>{String(courts.length).padStart(2, '0')}</b>
              <p>Across 9 sports</p>
            </article>
            <article>
              <span>✓</span>
              <small>AVAILABLE NOW</small>
              <b>{String(availableCount).padStart(2, '0')}</b>
              <p>Ready when you are</p>
            </article>
            <article>
              <span>⚡</span>
              <small>BOOKING LENGTH</small>
              <b>Up to 60 min</b>
              <p>Choose your session length</p>
            </article>
            <article>
              <span>◷</span>
              <small>YOUR ACTIVITY</small>
              <b>{currentStudentBooking ? '01' : '00'}</b>
              <p>{currentStudentBooking ? 'Session in progress' : 'No active session'}</p>
            </article>
          </section>

          <section className="courts" id="courts">
            <div className="section-title">
              <div>
                <p className="kicker">THE LINEUP</p>
                <h2>Find your court<span>.</span></h2>
                <p>Available courts are green. Occupied courts are red.</p>
              </div>
              <span className="availability">{availableCount} courts available</span>
            </div>

            <div className="booking-options">
              <label htmlFor="booking-duration">Booking length</label>
              <select
                id="booking-duration"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
              <span>Maximum session: 1 hour</span>
            </div>

            <div className="filters">
              {sports.map((sport) => (
                <button
                  key={sport}
                  className={filter === sport ? 'selected' : ''}
                  onClick={() => setFilter(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>

            <div className="court-grid">
              {loadingCourts ? (
                <p>Loading courts…</p>
              ) : courtError ? (
                <p role="alert">{courtError}</p>
              ) : shownCourts.length === 0 ? (
                <p>No courts found for this sport.</p>
              ) : (
                shownCourts.map((court, index) => {
                  const booking = court.booking
                  const occupied = Boolean(booking && booking.until > now)
                  const isMine =
                    currentStudentBooking?.bookingCode === booking?.bookingCode

                  return (
                    <article className={`court-card color-${index % 4}`} key={court.id}>
                      <div className="court-art">
                        <span>{court.sport}</span>
                        <strong>{sportIcon(court.sport)}</strong>
                        <small>{court.id}</small>
                      </div>

                      <div className="court-info">
                        <div>
                          <h3>{court.name}</h3>
                          <p>{court.place}</p>
                        </div>
                        <span className={`status ${court.available ? 'available' : 'busy'}`}>
                          {!court.active
                            ? 'Unavailable'
                            : court.available
                              ? 'Available'
                              : 'Occupied'}
                        </span>
                      </div>

                      {occupied && booking && (
                        <div className="court-booking">
                          <div>
                            <small>STARTED</small>
                            <b>{formatClock(booking.started)}</b>
                          </div>
                          <div>
                            <small>ENDS AT</small>
                            <b>{formatClock(booking.until)}</b>
                          </div>
                          <div className="time-left">
                            <small>TIME LEFT</small>
                            <b>{getRemaining(booking.until, now)}</b>
                          </div>
                        </div>
                      )}

                      <div className="court-bottom">
                        <span>
                          ◷ &nbsp;
                          {occupied
                            ? `${booking.durationMinutes} min session`
                            : `${durationMinutes} min session`}
                        </span>

                        {occupied ? (
                          <span className="busy-label">
                            {isMine ? 'Your booking' : 'In use'}
                          </span>
                        ) : court.available ? (
                          <button
                            disabled={Boolean(myBooking) || !student}
                            onClick={() => bookCourt(court)}
                          >
                            {!student
                              ? 'Login to book'
                              : myBooking
                                ? 'One booking at a time'
                                : 'Book court →'}
                          </button>
                        ) : (
                          <span className="busy-label">Unavailable</span>
                        )}
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            <p className="footnote">
              Courts, student accounts, and bookings are stored in the backend database.
            </p>
          </section>

          <section className="courts" id="history">
            <div className="section-title">
              <div>
                <p className="kicker">YOUR ACCOUNT</p>
                <h2>My booking history<span>.</span></h2>
                <p>Only your bookings are shown here.</p>
              </div>
              <span className="availability">{myBookings.length} sessions</span>
            </div>

            {!student ? (
              <p>Sign in to view your booking history.</p>
            ) : myBookings.length === 0 ? (
              <p>You haven’t made any bookings yet.</p>
            ) : (
              <div className="court-grid">
                {myBookings.map((booking, index) => (
                  <article className={`court-card color-${index % 4}`} key={booking.id}>
                    <div className="court-info">
                      <div>
                        <h3>{booking.courtName}</h3>
                        <p>{booking.sport}</p>
                      </div>
                      <span
                        className={`status ${
                          booking.status === 'ACTIVE' ? 'busy' : 'available'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="court-booking">
                      <div>
                        <small>BOOKING ID</small>
                        <b>{booking.bookingCode}</b>
                      </div>
                      <div>
                        <small>STARTED</small>
                        <b>{formatDateTime(new Date(booking.startTime).getTime())}</b>
                      </div>
                      <div>
                        <small>ENDS AT</small>
                        <b>{formatDateTime(new Date(booking.endTime).getTime())}</b>
                      </div>
                    </div>

                    <div className="court-bottom">
                      <span>{booking.durationMinutes} minute session</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <form
            className="login-modal"
            onSubmit={login}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowLogin(false)}
              aria-label="Close"
            >
              ×
            </button>
            <img
              className="modal-university-logo"
              src="./anurag-university-logo.png"
              alt="Anurag University logo"
            />
            <p className="kicker">ANURAG UNIVERSITY STUDENT PORTAL</p>
            <h2 id="login-title">
              {authMode === 'register' ? 'Create student account' : 'Student Login'}
            </h2>
            <p className="login-description">
              {authMode === 'register'
                ? 'Create your account to reserve a court.'
                : 'Sign in to reserve a court and follow your session.'}
            </p>

            {authMode === 'register' && (
              <label>
                Full name
                <input
                  name="fullName"
                  type="text"
                  placeholder="Your full name"
                  maxLength="100"
                  required
                />
              </label>
            )}

            <label>
              University email
              <input
                name="email"
                type="email"
                placeholder="name@anurag.edu.in"
                maxLength="150"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                minLength="8"
                maxLength="72"
                required
              />
            </label>

            {authError && <p role="alert">{authError}</p>}

            <button className="confirm-button" type="submit" disabled={authBusy}>
              {authBusy
                ? 'Please wait…'
                : authMode === 'register'
                  ? 'Create account'
                  : 'Sign in'}
              <span>→</span>
            </button>

            <p className="demo-note">
              {authMode === 'register' ? 'Already registered? ' : 'Need an account? '}
              <button
                type="button"
                onClick={() => {
                  setAuthError('')
                  setAuthMode(authMode === 'register' ? 'login' : 'register')
                }}
              >
                {authMode === 'register' ? 'Sign in' : 'Register'}
              </button>
            </p>
          </form>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div
            className="modal-card confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setConfirmModal(null)}
              aria-label="Close modal"
            >
              ×
            </button>

            <span className="modal-tag">Confirmation</span>
            <h3>{confirmModal.title}</h3>
            <p className="modal-copy">{confirmModal.message}</p>

            {confirmModal.court && (
              <div className="confirm-court-badge">
                <span className="confirm-court-icon">
                  {sportIcon(confirmModal.court.sport)}
                </span>
                <div>
                  <strong>{confirmModal.court.name}</strong>
                  <small>{confirmModal.court.place || confirmModal.court.location || confirmModal.court.sport}</small>
                </div>
                {confirmModal.duration && (
                  <span className="confirm-duration-tag">
                    {confirmModal.duration} mins
                  </span>
                )}
              </div>
            )}

            <div className="confirm-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setConfirmModal(null)}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                className={`confirm-button ${confirmModal.isDanger ? 'danger-button' : ''}`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App