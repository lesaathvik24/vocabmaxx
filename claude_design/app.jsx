// app.jsx — root: routing, tweaks→CSS-variable wiring, review queue. Mounts the app.
const { useState, useEffect, useMemo } = React;

const ACCENTS = {
  '#0d9488': { h: 174, s: '64%' }, // teal
  '#4f46e5': { h: 244, s: '74%' }, // indigo
  '#475569': { h: 215, s: '24%' }, // slate
  '#7c3aed': { h: 262, s: '70%' }, // plum
};
const READ_FONTS = {
  'Source Serif': "'Source Serif 4', Georgia, serif",
  'Lora': "'Lora', Georgia, serif",
  'Newsreader': "'Newsreader', Georgia, serif",
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#0d9488",
  "readFont": "Source Serif",
  "density": "regular",
  "dark": false,
  "reduceMotion": false,
  "flipMs": 460
}/*EDITMODE-END*/;

const TITLES = { dashboard: 'Dashboard', review: 'Review', capture: 'Capture', words: 'Words', insights: 'Insights', settings: 'Settings' };

function ComingSoon({ route }) {
  const meta = {
    capture: { icon: 'plusCircle', h: 'Capture words fast', s: 'Single word, paragraph extraction, or bulk import \u2014 designed in a later phase.' },
    words: { icon: 'book', h: 'Your word library', s: 'Browse, filter and edit every word you\u2019ve captured.' },
    insights: { icon: 'chart', h: 'See your growth', s: 'Retention curves, problem words and learning velocity.' },
    settings: { icon: 'sliders', h: 'Settings', s: 'Account, review limits and notification preferences.' },
  }[route] || { icon: 'inbox', h: 'Nothing here yet', s: '' };
  return (
    <div className="vm-page">
      <div className="card card-pad rise" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 64, gap: 4 }}>
        <div className="rv-done-ring" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}><Icon name={meta.icon} size={40} /></div>
        <div className="display-xl" style={{ fontSize: 24 }}>{meta.h}</div>
        <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 15, maxWidth: 380 }}>{meta.s}</div>
        <span className="pill" style={{ marginTop: 14 }}>Phase 4+ · this prototype focuses on Shell · Dashboard · Review</span>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState('dashboard');
  const [inReview, setInReview] = useState(false);
  const [stats, setStats] = useState(STATS);

  // apply theme + tokens
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    const a = ACCENTS[t.accent] || ACCENTS['#0d9488'];
    root.style.setProperty('--accent-h', a.h);
    root.style.setProperty('--accent-s', a.s);
    root.style.setProperty('--font-read', READ_FONTS[t.readFont] || READ_FONTS['Source Serif']);
    root.style.setProperty('--flip-ms', (t.reduceMotion ? 0 : t.flipMs) + 'ms');
  }, [t.dark, t.accent, t.readFont, t.flipMs, t.reduceMotion]);

  const queue = useMemo(() => WORDS.filter((w) => w.status !== 'mastered').slice(0, stats.due), [stats.due]);

  const startReview = () => { setInReview(true); };
  const completeReview = (results) => {
    setStats((s) => ({ ...s, due: 0, reviewedToday: results.length, weekDone: Math.min(s.weekGoal, s.weekDone + results.length) }));
  };

  const goto = (r) => {
    if (r === 'review') { startReview(); return; }
    setRoute(r);
  };

  return (
    <>
      <AppShell
        route={route}
        title={TITLES[route]}
        theme={t.dark ? 'dark' : 'light'}
        density={t.density}
        dueCount={stats.due}
        onNavigate={goto}
        onToggleTheme={() => setTweak('dark', !t.dark)}
      >
        {route === 'dashboard'
          ? <Dashboard words={WORDS} stats={stats} onStartReview={startReview} onOpenWord={() => {}} />
          : <ComingSoon route={route} />}
      </AppShell>

      {inReview && (
        <ReviewSession
          queue={queue.length ? queue : WORDS.slice(0, 8)}
          motion={!t.reduceMotion}
          onExit={() => setInReview(false)}
          onComplete={completeReview}
        />
      )}

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#0d9488', '#4f46e5', '#475569', '#7c3aed']}
          onChange={(v) => setTweak('accent', v)} />

        <TweakSection label="Reading" />
        <TweakRadio label="Definition serif" value={t.readFont}
          options={['Source Serif', 'Lora', 'Newsreader']}
          onChange={(v) => setTweak('readFont', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)} />

        <TweakSection label="Motion" />
        <TweakToggle label="Reduce motion" value={t.reduceMotion} onChange={(v) => setTweak('reduceMotion', v)} />
        <TweakSlider label="Card flip speed" value={t.flipMs} min={180} max={900} step={20} unit="ms"
          disabled={t.reduceMotion} onChange={(v) => setTweak('flipMs', v)} />

        <TweakSection label="Try it" />
        <TweakButton label="Start a review session" onClick={() => setInReview(true)} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
