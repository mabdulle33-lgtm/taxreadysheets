/*
 * TaxReadySheets — the site's own line icons (original drawings, 24×24,
 * 1.75px stroke in currentColor). The HTML pages carry inline copies so they
 * work without JavaScript; scripts use icon() for anything they draw.
 */

export const ICONS = {
  // ----- trades and calculators -----
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M10.5 12.5v2h3v-2"/>',
  laptop: '<rect x="4" y="4.5" width="16" height="11" rx="1.5"/><path d="M2.5 19.5h19M12 12.5V7.5M9.5 10L12 7.5l2.5 2.5"/>',
  'calendar-check': '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15.2l2 2 4-4"/>',
  hardhat: '<path d="M5 16a7 7 0 0 1 14 0"/><path d="M10 9.5V6.5h4v3"/><rect x="3" y="16" width="18" height="3.5" rx="1.2"/>',
  scissors: '<circle cx="6.5" cy="17.5" r="2.8"/><circle cx="17.5" cy="17.5" r="2.8"/><path d="M8.6 15.6L18 4M15.4 15.6L6 4"/>',
  spray: '<path d="M8 10.5h7l1.2 3V20a1.5 1.5 0 0 1-1.5 1.5H8.3A1.5 1.5 0 0 1 6.8 20v-6.5z"/><path d="M9.5 10.5V7.5h4v3M9.5 7.5V4.5h6l-1.5 3"/><path d="M18.5 4.5h.01M20.5 7h.01M18.5 9.5h.01"/>',
  paw: '<circle cx="6.5" cy="10.5" r="1.8"/><circle cx="10" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="10.5" r="1.8"/><path d="M12.2 11.8c-2.5 0-4.8 3-4.8 5.3 0 1.6 1.2 2.5 2.7 2.3.9-.1 1.4-.5 2.1-.5s1.2.4 2.1.5c1.5.2 2.7-.7 2.7-2.3 0-2.3-2.3-5.3-4.8-5.3z"/>',
  blocks: '<rect x="3.5" y="13" width="7.5" height="7.5" rx="1.2"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.2"/><rect x="8.2" y="3.5" width="7.5" height="7.5" rx="1.2"/><path d="M6.2 16.8h2M11.9 7.2v.1M16.7 15.5v2.5"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5V16c1.5 1.4 3.5 2.2 5.5 2.2s4-.8 5.5-2.2v-4.5M21.5 9.5V15"/>',
  car: '<path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11"/><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M6 17v2.5M18 17v2.5M6.8 14h.01M17.2 14h.01"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8"/>',
  tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.8 8.8a1.4 1.4 0 0 1 0 2l-6.6 6.6a1.4 1.4 0 0 1-2 0z"/><circle cx="8.2" cy="8.2" r="1.5"/>',
  house: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5v10h13v-10"/><path d="M10 19.5v-5h4v5"/>',
  bed: '<path d="M3 18.5V6M3 14h18v4.5M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>',

  // ----- interface -----
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><rect x="8" y="5.5" width="8" height="3.5" rx=".8"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01"/>',
  sheet: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 9h17M3.5 14.5h17M9.5 9v11"/>',
  book: '<path d="M4 18.5V5.5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13v-4"/><path d="M8.5 8h6"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  landmark: '<path d="M12 3l9 5H3zM5 10.5v7M9.5 10.5v7M14.5 10.5v7M19 10.5v7M3 20.5h18"/>',
  'no-user': '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.7-3.6 3.3-5.5 6.5-5.5 1.2 0 2.3.3 3.2.8M16 15l5 5M21 15l-5 5"/>',
  device: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><rect x="9.5" y="10.5" width="5" height="4" rx=".8"/><path d="M10.5 10.5V9.3a1.5 1.5 0 0 1 3 0v1.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
  arrow: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  bolt: '<path d="M13 2.5L4.5 13.5H11l-1 8 8.5-11H12z"/>',
  pencil: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v2.5"/><rect x="4" y="7.5" width="16.5" height="12" rx="2"/><path d="M16 13.5h.01"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>'
};

/** Inline SVG markup for an icon (decorative: hidden from screen readers). */
export function icon(name, cls = 'icon') {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
