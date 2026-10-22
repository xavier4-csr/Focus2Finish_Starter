import { useEffect, useState } from 'react'
import RedirectSimulator from "./RedirectSimulator";

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Request failed (${response.status})`)
  }
  if (response.status === 204) return null
  return response.json()
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [resources, setResources] = useState([])
  const [sessions, setSessions] = useState([])
  const [title, setTitle] = useState('')
  const [output, setOutput] = useState('')
  const [minutes, setMinutes] = useState(25)
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [nextActivity, setNextActivity] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    try {
      const [t, r, s] = await Promise.all([
        request('/tasks/'), request('/resources/'), request('/sessions/'),
      ])
      setTasks(t)
      setResources(r)
      setSessions(s)
      setError('')
    } catch (e) {
      setError(`Cannot reach the API. Is Django running? ${e.message}`)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!activeSession || remaining <= 0) return
    const id = window.setInterval(() => setRemaining(v => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(id)
  }, [activeSession, remaining > 0])

  async function addTask(e) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await request('/tasks/', {
        method: 'POST',
        body: JSON.stringify({ title, expected_output: output, estimated_minutes: Number(minutes), status: 'todo' }),
      })
      setTitle(''); setOutput(''); setMessage('Task added.'); await load()
    } catch (e) { setError(e.message) }
  }

  async function addResource(e) {
    e.preventDefault()
    if (!resourceTitle.trim()) return
    try {
      await request('/resources/', {
        method: 'POST',
        body: JSON.stringify({ title: resourceTitle, url: resourceUrl, estimated_minutes: Number(minutes), content_type: 'article' }),
      })
      setResourceTitle(''); setResourceUrl(''); setMessage('Learning resource saved.'); await load()
    } catch (e) { setError(e.message) }
  }

  async function startTask(task) {
    try {
      const session = await request('/sessions/', {
        method: 'POST',
        body: JSON.stringify({ task: task.id, intended_minutes: task.estimated_minutes || 25, outcome: 'started' }),
      })
      setActiveSession(session)
      setRemaining((task.estimated_minutes || 25) * 60)
      setMessage(`Focus session started: ${task.title}`)
      setError('')
    } catch (e) { setError(e.message) }
  }

  async function finishSession(outcome = 'completed') {
    if (!activeSession) return
    try {
      await request(`/sessions/${activeSession.id}/finish/`, {
        method: 'POST',
        body: JSON.stringify({ outcome, reflection: '' }),
      })
      setActiveSession(null); setRemaining(0)
      setMessage(outcome === 'completed' ? 'Session completed. Nice work.' : 'Session recorded.')
      await load()
    } catch (e) { setError(e.message) }
  }

  async function suggestNext() {
    try {
      const result = await request('/next-activity/')
      setNextActivity(result)
      if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
      setError('')
    } catch (e) { setError(e.message) }
  }

  function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }

  const doneCount = tasks.filter(t => t.status === 'done').length
  const focusMinutes = sessions.filter(s => s.ended_at).reduce((sum, s) => sum + (s.intended_minutes || 0), 0)

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">F</div>
        <div><div className="eyebrow">YOUR PERSONAL PRODUCTIVITY ASSISTANT</div><h1>Focus2Finish</h1></div>
        <span className="local-pill">Local MVP</span>
      </header>

      {error && <div className="notice error">{error}</div>}
      {message && !error && <div className="notice">{message}</div>}

      <section className="hero panel">
        <div>
          <p className="eyebrow light">MAKE YOUR SCREEN TIME COUNT</p>
          <h2>Less scrolling.<br />More finished work.</h2>
          <p className="hero-copy">Choose one useful thing. Give it your attention. Record what you finish.</p>
          <button className="button bright" onClick={suggestNext}>Suggest my next activity →</button>
        </div>
        <div className="focus-clock">
          <span className="eyebrow light">{activeSession ? 'SESSION IN PROGRESS' : 'YOUR FOCUS TIMER'}</span>
          <strong>{activeSession ? formatTime(remaining) : `${minutes} min`}</strong>
          <span>{activeSession ? activeSession.task_title || 'Focus session' : 'Small steps count.'}</span>
          {activeSession && <button className="button bright" onClick={() => finishSession('completed')}>Finish session</button>}
          {activeSession && <button className="text-button" onClick={() => finishSession('partial')}>End early</button>}
        </div>
      </section>

      <section className="stats">
        <div className="stat panel"><span>Tasks completed</span><strong>{doneCount}</strong><small>Keep building momentum</small></div>
        <div className="stat panel"><span>Recorded focus sessions</span><strong>{sessions.length}</strong><small>{focusMinutes} planned minutes completed</small></div>
        <div className="stat panel"><span>Learning resources</span><strong>{resources.length}</strong><small>Your ready-to-learn vault</small></div>
      </section>

      {nextActivity && <section className="panel next-card">
        <div><p className="eyebrow">SUGGESTED NEXT ACTIVITY</p><h3>{nextActivity.title}</h3>
          <p>{nextActivity.expected_output || nextActivity.description || nextActivity.message || `${nextActivity.estimated_minutes || 20} minutes`}</p>
        </div>
        {nextActivity.url && <a className="button secondary" href={nextActivity.url} target="_blank" rel="noreferrer">Open resource ↗</a>}
        {nextActivity.type === 'task' && <span className="tag">{nextActivity.estimated_minutes} min</span>}
      </section>}

      <div className="columns">
        <section className="panel section">
          <div className="section-heading"><div><p className="eyebrow">YOUR NEXT WIN</p><h2>Add a task</h2></div><span className="icon-bubble">✓</span></div>
          <form onSubmit={addTask} className="form">
            <label>What do you want to finish?<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Learn AI fundamentals" required /></label>
            <label>What will you produce?<input value={output} onChange={e => setOutput(e.target.value)} placeholder="e.g. Write 3 key concepts" /></label>
            <label>Estimated minutes<select value={minutes} onChange={e => setMinutes(Number(e.target.value))}><option value={15}>15 minutes</option><option value={25}>25 minutes</option><option value={45}>45 minutes</option></select></label>
            <button className="button primary">Add task</button>
          </form>
          <div className="list">
            {tasks.length === 0 && <p className="empty">Your task list is clear. Add one small goal to begin.</p>}
            {tasks.map(task => <article className="list-item" key={task.id}>
              <div className={`status-dot ${task.status}`} />
              <div className="item-main"><strong>{task.title}</strong><span>{task.expected_output || 'Choose a small deliverable'} · {task.estimated_minutes} min</span></div>
              {task.status !== 'done' ? <button className="small-button" onClick={() => startTask(task)}>Start</button> : <span className="tag">Done</span>}
            </article>)}
          </div>
        </section>

        <section className="panel section">
          <div className="section-heading"><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Learning vault</h2></div><span className="icon-bubble">↗</span></div>
          <form onSubmit={addResource} className="form">
            <label>Resource title<input value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="e.g. Intro to AI" required /></label>
            <label>Link (optional)<input type="url" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="https://..." /></label>
            <button className="button secondary">Save resource</button>
          </form>
          <div className="list">
            {resources.length === 0 && <p className="empty">Save a useful article, course or video here so it's ready when you need it.</p>}
            {resources.map(resource => <article className="list-item" key={resource.id}>
              <div className="resource-icon">↗</div>
              <div className="item-main"><strong>{resource.title}</strong><span>{resource.estimated_minutes} min · {resource.content_type}</span></div>
              {resource.url && <a className="small-button link-button" href={resource.url} target="_blank" rel="noreferrer">Open</a>}
            </article>)}
          </div>
        </section>
      </div>

      <footer>Built for intentional learning. Your local prototype stores data in your local PostgreSQL database.</footer>
    </main>
  )
}
