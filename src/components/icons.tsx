import React from "react";

// Brand icon set: 24×24 stroke icons (round caps, 2.2px) so every prop and
// diagram node shares one visual language instead of mixed system emoji.
// Chip/DiagramBeat translate known emoji via EMOJI_ICONS; unknown strings
// fall back to text rendering.

const P: Record<string, React.ReactNode> = {
  bug: (
    <>
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <path d="M9 8.5c0-1.7 1.3-3 3-3s3 1.3 3 3M7 12H3.5M7 16H4M20.5 12H17M20 16h-3M12 8.5V20M8.5 6.5 7 4.5M15.5 6.5 17 4.5" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="5" r="2.2" />
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="8" r="2.2" />
      <path d="M6 7.2v9.6M18 10.2c0 4-4 4.8-7.5 5.4" />
    </>
  ),
  chat: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4.5 4V16H6a2 2 0 0 1-2-2Z" />,
  robot: (
    <>
      <rect x="5" y="8" width="14" height="10" rx="2.5" />
      <path d="M12 8V4.5M9.5 21v-3M14.5 21v-3" />
      <circle cx="9.3" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="13" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  shield: <path d="M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6Z" />,
  box: (
    <>
      <path d="M4 8 12 4l8 4v8l-8 4-8-4Z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  tag: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.6a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-5.5 5.5a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 4 11.1Z" />
      <circle cx="8.6" cy="8.6" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </>
  ),
  terminal: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="m7 10 3 2.6L7 15.2M12.5 15.5H17" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  send: <path d="M20.5 3.5 3.5 10.7l6.2 2.6 2.6 6.2ZM20.5 3.5 9.7 13.3" />,
  book: (
    <>
      <path d="M4.5 5.5A2 2 0 0 1 6.5 4H19.5v14H6.5a2 2 0 0 0-2 2Z" />
      <path d="M4.5 19.5v-14M8.5 8h7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  note: (
    <>
      <path d="M5 4.5h10.5L19.5 8.5V19.5H5Z" />
      <path d="M15 4.5V9h4.5M8.5 13h7M8.5 16.5h5" />
    </>
  ),
  thread: (
    <>
      <path d="M6 4.5h12M6 9h12M6 13.5h12M6 18h7" />
    </>
  ),
  chart: <path d="M4.5 19.5v-6M10 19.5V9M15.5 19.5v-8M21 19.5V5M4.5 19.5H21" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m11 11 8.5 8.5M16 16l2.5-2.5M18.5 18.5 21 16" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.5h8L18.5 8v12.5H6Z" />
      <path d="M14 3.5V8h4.5" />
    </>
  ),
  folder: <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.5l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18Z" />,
  graph: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
      <path d="m7.8 7 8.3.8M7 7.8l.6 8.3M9.8 17.4l4.8-.6M17.6 9.9l-.7 4.7" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  clipboard: (
    <>
      <rect x="5.5" y="5" width="13" height="15.5" rx="2" />
      <rect x="9" y="3" width="6" height="3.5" rx="1" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </>
  ),
  puzzle: (
    <>
      <path d="M5 9h4a2 2 0 1 1 4 0h4v4a2 2 0 1 0 0 4v4h-4a2 2 0 1 0-4 0H5v-4a2 2 0 1 1 0-4Z" />
    </>
  ),
  scales: (
    <>
      <path d="M12 4v15M7.5 19.5h9M12 4l-5.5 2M12 4l5.5 2" />
      <path d="M6.5 6 4 12a2.7 2.7 0 0 0 5 0Z M17.5 6 15 12a2.7 2.7 0 0 0 5 0Z" />
    </>
  ),
  scroll: (
    <>
      <path d="M7 4h11a2 2 0 0 1 2 2v1h-4" />
      <path d="M16 7v11a2.5 2.5 0 0 1-5 0V6a2 2 0 0 0-4 0v1h4M11 18.5a2.5 2.5 0 0 1-2.5 2.5H7a2.5 2.5 0 0 1-2.5-2.5V17H11" />
      <path d="M9 11h4M9 14h4" />
    </>
  ),
  hand: (
    <>
      <path d="M8 12V6.5a1.4 1.4 0 0 1 2.8 0V11M10.8 11V5a1.4 1.4 0 0 1 2.8 0v6M13.6 11V6a1.4 1.4 0 0 1 2.8 0v7.5" />
      <path d="M8 12l-1.6-1.7a1.5 1.5 0 0 0-2.3 1.9l3.6 5.2A6 6 0 0 0 12.7 20h.4a5.4 5.4 0 0 0 5.4-5.4V13" />
    </>
  ),
  badge: (
    <>
      <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M6 16a2.6 2.6 0 0 1 5 0M14 10h4M14 13.5h4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 5V2.8M12 21.2V19M5 12H2.8M21.2 12H19M7 7 5.4 5.4M18.6 18.6 17 17M17 7l1.6-1.6M5.4 18.6 7 17" />
    </>
  ),
  plug: (
    <>
      <path d="M9 7V3.5M15 7V3.5" />
      <path d="M7.5 7h9v3.5a4.5 4.5 0 0 1-9 0Z" />
      <path d="M12 15v5.5" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3.5" width="10" height="17" rx="2" />
      <path d="M10.5 18h3" />
    </>
  ),
  sparkle: <path d="M12 3.5 13.8 10 20.5 12 13.8 14 12 20.5 10.2 14 3.5 12l6.7-2Z" />,
  broom: <path d="M14.5 3.5 10 9.5M10 9.5l-5.5 4c-1 3 1 6.5 2.5 7 2.5-.5 5.5-1.5 7-4Z M7 20l1.8-3M10.3 19l1.5-2.8" />,
};

export const EMOJI_ICONS: Record<string, string> = {
  "🐛": "bug", "🔀": "branch", "💬": "chat", "🤖": "robot", "⏰": "clock",
  "🛡️": "shield", "🛡": "shield", "📦": "box", "🏷️": "tag", "🏷": "tag",
  "📨": "mail", "✉️": "mail", "🖥️": "terminal", "🖥": "terminal",
  "🔎": "search", "🔍": "search", "🕵️": "search", "🕵": "search",
  "✈️": "send", "📖": "book", "🎯": "target", "📝": "note", "🧵": "thread",
  "📊": "chart", "📈": "chart", "☀️": "sun", "🔒": "lock", "🗝️": "key",
  "🗝": "key", "📅": "calendar", "👁": "eye", "👀": "eye", "📄": "file",
  "📁": "folder", "🕸️": "graph", "🕸": "graph", "📚": "book", "🌙": "moon",
  "📋": "clipboard", "📱": "phone", "✨": "sparkle", "🧹": "broom",
  "🐙": "branch", "⚙️": "gear", "⚙": "gear", "🔌": "plug",
  "🧩": "puzzle", "⚖️": "scales", "⚖": "scales", "📜": "scroll",
  "🙋": "hand", "🪪": "badge",
};

export const Ico: React.FC<{
  name: string;
  size?: number;
  color?: string;
}> = ({ name, size = 48, color = "currentColor" }) => {
  const paths = P[name];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      {paths}
    </svg>
  );
};

/** Renders a known emoji as its brand icon, or the raw string as a fallback. */
export const IconOrEmoji: React.FC<{
  icon: string;
  size?: number;
  color?: string;
}> = ({ icon, size = 48, color }) => {
  const name = EMOJI_ICONS[icon];
  if (name) return <Ico name={name} size={size} color={color} />;
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>;
};
