// shell.jsx — AppShell, Sidebar, Topbar. Exported to window.
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'review', label: 'Review', icon: 'layers', badge: 'due' },
  { id: 'capture', label: 'Capture', icon: 'plusCircle' },
  { id: 'words', label: 'Words', icon: 'book' },
  { id: 'insights', label: 'Insights', icon: 'chart' },
];

function Sidebar({ route, onNavigate, dueCount }) {
  return (
    <nav className="vm-side" aria-label="Primary">
      <div className="vm-brand">
        <div className="vm-mark" aria-hidden="true">V</div>
        <div>
          <div className="vm-brand-name">VocabMaxx</div>
          <div className="vm-brand-sub">Everyday vocabulary</div>
        </div>
      </div>

      <div className="vm-navlabel">Practice</div>
      {NAV.map((n) => (
        <button
          key={n.id}
          className="vm-nav"
          aria-current={route === n.id ? 'page' : undefined}
          onClick={() => onNavigate(n.id)}
        >
          <Icon name={n.icon} size={19} />
          <span>{n.label}</span>
          {n.badge === 'due' && dueCount > 0 && <span className="vm-nav-badge">{dueCount}</span>}
        </button>
      ))}

      <div className="vm-side-foot">
        <button className="vm-nav" onClick={() => onNavigate('settings')}>
          <Icon name="sliders" size={19} /><span>Settings</span>
        </button>
        <div className="vm-user">
          <div className="vm-avatar" aria-hidden="true">JL</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Jordan Lee</div>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Free · beta</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Topbar({ title, theme, onToggleTheme }) {
  return (
    <header className="vm-top">
      <div className="vm-top-title">{title}</div>
      <label className="vm-search" aria-label="Search words">
        <Icon name="search" size={17} />
        <input placeholder="Search your words…" />
        <span className="vm-kbd">/</span>
      </label>
      <div style={{ flex: 1 }} />
      <button
        className="btn btn-outline btn-icon"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title="Toggle theme"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
      <button className="btn btn-primary">
        <Icon name="plus" size={17} /> Add word
      </button>
    </header>
  );
}

function AppShell({ route, title, theme, onNavigate, onToggleTheme, density, dueCount, children }) {
  return (
    <div className="vm-app" data-density={density}>
      <Sidebar route={route} onNavigate={onNavigate} dueCount={dueCount} />
      <div className="vm-main">
        <Topbar title={title} theme={theme} onToggleTheme={onToggleTheme} />
        <div className="vm-content">{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, Sidebar, Topbar, NAV });
