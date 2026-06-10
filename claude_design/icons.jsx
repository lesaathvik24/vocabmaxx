// icons.jsx — lucide-style inline SVG icons (1.75px stroke, 20px default)
// Open-source iconography per DESIGN.md §2.5. Exported to window.

function Icon({ name, size = 20, stroke = 1.75, className = '', style }) {
  const p = ICON_PATHS[name];
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true" focusable="false"
    >
      {p}
    </svg>
  );
}

const ICON_PATHS = {
  dashboard: (<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>),
  layers: (<><path d="M12 2 3 7l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>),
  plus: (<><path d="M12 5v14"/><path d="M5 12h14"/></>),
  plusCircle: (<><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></>),
  book: (<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>),
  chart: (<><path d="M3 3v18h18"/><path d="m7 14 3-4 4 3 5-7"/></>),
  trending: (<><path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/></>),
  sun: (<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>),
  moon: (<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>),
  search: (<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>),
  sliders: (<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></>),
  chevronLeft: (<path d="m15 18-6-6 6-6"/>),
  chevronRight: (<path d="m9 18 6-6-6-6"/>),
  arrowRight: (<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>),
  check: (<path d="M20 6 9 17l-5-5"/>),
  checkCircle: (<><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>),
  x: (<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>),
  rotate: (<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></>),
  flame: (<path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-1.5.6-2.7 1.4-3.6C9 8.5 9.2 9.7 10 10c0-2 1-3.5 2-8Z"/>),
  clock: (<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  calendar: (<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>),
  sparkles: (<><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z"/><path d="M19 4v3M20.5 5.5h-3M5 17v2M6 18H4"/></>),
  command: (<path d="M15 6a3 3 0 1 0 3 3h-3V6Zm-6 0a3 3 0 1 1-3 3h3V6Zm0 12a3 3 0 1 0 3-3H9v3Zm6 0a3 3 0 1 1-3-3h3v3Z"/>),
  zap: (<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>),
  volume: (<><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></>),
  star: (<path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.3 9.3l6.1-.7L12 3Z"/>),
  pencil: (<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></>),
  target: (<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>),
  bookmark: (<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/>),
  inbox: (<><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z"/></>),
  menu: (<><path d="M4 6h16M4 12h16M4 18h16"/></>),
};

window.Icon = Icon;
