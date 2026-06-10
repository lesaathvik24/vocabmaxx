// review.jsx — the flip-card SRS review session (centerpiece). Exported to window.
const { useState: useStateRv, useEffect: useEffectRv, useCallback } = React;

const GRADES = [
  { id: 'again', label: 'Again', key: '1' },
  { id: 'hard', label: 'Hard', key: '2' },
  { id: 'good', label: 'Good', key: '3' },
  { id: 'easy', label: 'Easy', key: '4' },
];

function ReviewSession({ queue, onExit, onComplete, motion }) {
  const [idx, setIdx] = useStateRv(0);
  const [flipped, setFlipped] = useStateRv(false);
  const [results, setResults] = useStateRv([]);
  const [leaving, setLeaving] = useStateRv(false);
  const done = idx >= queue.length;
  const card = queue[idx];

  const flip = useCallback(() => { if (!done) setFlipped((f) => !f); }, [done]);

  const grade = useCallback((g) => {
    if (done || !flipped) return;
    setLeaving(true);
    const delay = motion ? 150 : 0;
    setResults((r) => [...r, { id: card.id, grade: g }]);
    setTimeout(() => {
      setFlipped(false);
      setIdx((i) => i + 1);
      setLeaving(false);
    }, delay);
  }, [done, flipped, card, motion]);

  // keyboard parity
  useEffectRv(() => {
    const h = (e) => {
      if (e.key === 'Escape') { onExit(); return; }
      if (done) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); return; }
      if (flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) { e.preventDefault(); grade(g.id); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [flip, grade, flipped, done, onExit]);

  const pct = Math.round((idx / queue.length) * 100);
  const eta = card ? projectIntervals(card) : {};

  return (
    <div className="rv-stage" role="dialog" aria-modal="true" aria-label="Review session">
      <div className="rv-top">
        <button className="btn btn-ghost btn-icon" onClick={onExit} aria-label="Exit review (Esc)">
          <Icon name="x" size={20} />
        </button>
        <div className="rv-progress-track" aria-hidden="true">
          <div className="rv-progress-fill" style={{ width: `${done ? 100 : pct}%` }} />
        </div>
        <div className="mono" style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', minWidth: 54, textAlign: 'right' }}>
          {Math.min(idx + (done ? 0 : 1), queue.length)} / {queue.length}
        </div>
      </div>

      {done ? (
        <DoneScreen results={results} onExit={onExit} onComplete={onComplete} />
      ) : (
        <div className="rv-body">
          <div className="rv-scene">
            <div
              className={'rv-card' + (flipped ? ' flipped' : '')}
              style={{ opacity: leaving ? 0 : 1, transition: leaving && motion ? 'opacity 140ms ease, transform var(--flip-ms) var(--flip-ease)' : undefined }}
              onClick={flip}
              role="button"
              tabIndex={0}
              aria-label={flipped ? 'Definition shown. Grade your recall.' : `Recall the meaning of ${card.term}. Press space to reveal.`}
            >
              {/* FRONT — the prompt */}
              <div className="rv-face rv-front">
                <div>
                  <div className="rv-term">{card.term}</div>
                  <div className="rv-ipa">{card.ipa}</div>
                  <div className="rv-hint" style={{ justifyContent: 'center', marginTop: 26 }}>
                    <span className="vm-kbd">Space</span> to reveal
                  </div>
                </div>
              </div>

              {/* BACK — the substance, set in serif */}
              <div className="rv-face rv-back">
                <div className="rv-back-head">
                  <div>
                    <div className="rv-term" style={{ fontSize: 32 }}>{card.term}</div>
                    <div className="rv-meta">
                      <span className="rv-pos">{card.pos}</span>
                      <span className="rv-ipa" style={{ marginTop: 0 }}>{card.ipa}</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon" style={{ width: 34, height: 34, flex: 'none' }} aria-label="Play pronunciation" onClick={(e) => e.stopPropagation()}>
                    <Icon name="volume" size={18} />
                  </button>
                </div>
                <div className="rv-def">{card.def}</div>
                <div className="rv-ex">{card.ex}</div>
                <div className="syn-row">
                  {card.syn.map((s) => <span className="pill pill-accent" key={s}>{s}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* grade buttons — disabled until revealed (keyboard parity 1-4) */}
          <div className="grade-row" aria-hidden={!flipped}>
            {GRADES.map((g) => (
              <button
                key={g.id}
                className={`grade grade-${g.id}`}
                disabled={!flipped}
                onClick={() => grade(g.id)}
              >
                <span className="grade-key">{g.key}</span>
                <span className="grade-label">{g.label}</span>
                <span className="grade-eta">{flipped ? eta[g.id] : '\u00b7'}</span>
              </button>
            ))}
          </div>
          <div className="rv-hint">
            {flipped
              ? <><span className="vm-kbd">1</span><span className="vm-kbd">2</span><span className="vm-kbd">3</span><span className="vm-kbd">4</span> grade · how well did you recall it?</>
              : <>Try to recall it, then reveal</>}
          </div>
        </div>
      )}
    </div>
  );
}

function DoneScreen({ results, onExit, onComplete }) {
  const counts = results.reduce((a, r) => { a[r.grade] = (a[r.grade] || 0) + 1; return a; }, {});
  const correct = (counts.good || 0) + (counts.easy || 0) + (counts.hard || 0);
  const rate = results.length ? Math.round((correct / results.length) * 100) : 0;
  useEffectRv(() => { onComplete && onComplete(results); }, []);
  return (
    <div className="rv-body">
      <div className="rv-done rise">
        <div className="rv-done-ring"><Icon name="checkCircle" size={46} /></div>
        <div className="display-xl" style={{ fontSize: 34 }}>Session complete</div>
        <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 16 }}>
          You reviewed {results.length} cards with {rate}% recall. Nice streak \u2014 keep it warm.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {GRADES.map((g) => (
            <div key={g.id} className="card" style={{ padding: '12px 18px', minWidth: 78, boxShadow: 'none' }}>
              <div className="display-xl" style={{ fontSize: 24 }}>{counts[g.id] || 0}</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{g.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button className="btn btn-outline btn-lg" onClick={onExit}>Back to dashboard</button>
          <button className="btn btn-primary btn-lg" onClick={onExit}><Icon name="sparkles" size={18} /> Capture a word</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReviewSession, DoneScreen, GRADES });
