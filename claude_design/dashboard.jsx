// dashboard.jsx — Dashboard screen. Exported to window.

function statusDot(status) {
  const map = { new: 'var(--muted-foreground)', learning: 'var(--warning)', review: 'var(--accent)', mastered: 'var(--success)' };
  return `hsl(${map[status] || 'var(--muted-foreground)'})`;
}

function DueBanner({ due, onStart }) {
  if (due === 0) {
    return (
      <div className="card card-pad rise" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="rv-done-ring" style={{ width: 60, height: 60, marginBottom: 0 }}>
          <Icon name="checkCircle" size={30} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>All caught up</div>
          <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, marginTop: 3 }}>Nothing due right now. Capture a new word or get ahead.</div>
        </div>
        <button className="btn btn-outline">Review ahead</button>
      </div>
    );
  }
  return (
    <div className="due-banner rise" role="region" aria-label="Cards due for review">
      <div className="due-banner-glow" />
      <div style={{ position: 'relative', flex: 1 }}>
        <div className="eyebrow" style={{ color: 'hsl(var(--accent-foreground) / 0.8)' }}>Due now</div>
        <div className="display-xl" style={{ fontSize: 42, marginTop: 8 }}>
          {due} cards <span style={{ opacity: 0.7, fontWeight: 500, fontSize: 24 }}>ready to review</span>
        </div>
        <div style={{ marginTop: 8, opacity: 0.85, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="clock" size={16} /> About 4 minutes · spaced just right
        </div>
      </div>
      <button className="btn btn-lg" style={{ position: 'relative', background: 'hsl(var(--accent-foreground))', color: 'hsl(var(--accent))' }} onClick={onStart}>
        Start review <Icon name="arrowRight" size={18} />
      </button>
    </div>
  );
}

function StatTiles({ stats }) {
  const tiles = [
    { num: stats.learned, label: 'Words learned', icon: 'book' },
    { num: `${stats.streakDays}d`, label: 'Current streak', icon: 'flame', tint: 'var(--warning)' },
    { num: `${Math.round(stats.retention * 100)}%`, label: 'Retention', icon: 'target', tint: 'var(--success)' },
    { num: stats.due, label: 'Due today', icon: 'layers', tint: 'var(--accent)' },
  ];
  return (
    <div className="stat-grid">
      {tiles.map((t, i) => (
        <div className="stat rise" key={t.label} style={{ animationDelay: `${60 + i * 45}ms` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-num">{t.num}</div>
            <span style={{ color: t.tint ? `hsl(${t.tint})` : 'hsl(var(--muted-foreground))' }}><Icon name={t.icon} size={20} /></span>
          </div>
          <div className="stat-label">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

function WeekProgress({ stats }) {
  const pct = Math.round((stats.weekDone / stats.weekGoal) * 100);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const max = Math.max(...stats.history, 1);
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>This week</div>
        <div className="mono" style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{stats.weekDone}/{stats.weekGoal}</div>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'hsl(var(--muted))', marginTop: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'hsl(var(--accent))', borderRadius: 99 }} />
      </div>
      <div className="spark" style={{ marginTop: 20 }}>
        {stats.history.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: 44 }}>
              <div className={'spark-bar' + (i === stats.history.length - 1 ? ' today' : '')} style={{ height: `${Math.max((v / max) * 100, 8)}%` }} />
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>{days[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentCaptures({ words, onOpen }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>Recent captures</div>
        <button className="btn btn-ghost" style={{ height: 32, padding: '0 10px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
          View all <Icon name="arrowRight" size={15} />
        </button>
      </div>
      <div style={{ padding: '0 8px 10px' }}>
        {words.slice(0, 6).map((w) => (
          <div className="cap-row" key={w.id} onClick={() => onOpen && onOpen(w)} tabIndex={0} role="button"
               onKeyDown={(e) => { if (e.key === 'Enter') onOpen && onOpen(w); }}>
            <span className="dot" style={{ background: statusDot(w.status) }} title={w.status} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="cap-term">{w.term}</div>
              <div className="cap-def">{w.def}</div>
            </div>
            <span className="pill">{w.source}</span>
            <span className="mono" style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', width: 64, textAlign: 'right' }}>{w.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ words, stats, onStartReview, onOpenWord }) {
  return (
    <div className="vm-page">
      <div style={{ marginBottom: 22 }}>
        <div className="eyebrow">Tuesday, June 9</div>
        <h1 className="display-xl" style={{ fontSize: 28, margin: '6px 0 0' }}>Good afternoon, Jordan</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <DueBanner due={stats.due} onStart={onStartReview} />
        <StatTiles stats={stats} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 'var(--gap)', alignItems: 'start' }}>
          <RecentCaptures words={words} onOpen={onOpenWord} />
          <WeekProgress stats={stats} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, DueBanner, StatTiles, WeekProgress, RecentCaptures, statusDot });
