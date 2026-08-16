/**
 * Pure SVG Icons Library (Lucide style, zero emojis)
 * Self-contained SVG string generator for Chrome Extension UI
 */

const createSvg = (paths, size = 18, className = '') => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon ${className}">${paths}</svg>`;
};

export const Icons = {
  // App Brand Logo (Vector SVG)
  appLogo: (size = 24, cls = '') => `
    <svg width="${size}" height="${size}" viewBox="0 0 1024 1024" class="app-logo-svg ${cls}" version="1.1" xmlns="http://www.w3.org/2000/svg" style="display:block; border-radius: 6px;">
      <path d="M512.002 512.002m-491.988 0a491.988 491.988 0 1 0 983.976 0 491.988 491.988 0 1 0-983.976 0Z" fill="#FDDF6D" />
      <path d="M300.576 481.542c-36.536 0-66.156 29.62-66.156 66.156h132.314c-0.004-36.536-29.622-66.156-66.158-66.156zM877.628 472.678c-36.536 0-66.158 29.62-66.158 66.156h132.314c0.002-36.538-29.616-66.156-66.156-66.156z" fill="#F9A880" />
      <path d="M617.43 931.356c-271.716 0-491.986-220.268-491.986-491.986 0-145.168 62.886-275.632 162.888-365.684C129.054 155.124 20.014 320.828 20.014 512c0 271.716 220.268 491.986 491.986 491.986 126.548 0 241.924-47.796 329.098-126.298-67.106 34.31-143.124 53.668-223.668 53.668z" fill="#FCC56B" />
      <path d="M492.588 379.726c-11.054 0-20.014-8.962-20.014-20.014 0-25.816-21.004-46.818-46.818-46.818s-46.818 21.004-46.818 46.818c0 11.054-8.962 20.014-20.014 20.014-11.054 0-20.014-8.962-20.014-20.014 0-47.888 38.96-86.848 86.848-86.848s86.848 38.96 86.848 86.848c-0.002 11.054-8.964 20.014-20.018 20.014zM830.634 379.726c-11.054 0-20.014-8.962-20.014-20.014 0-25.816-21.004-46.818-46.818-46.818-25.814 0-46.818 21.004-46.818 46.818 0 11.054-8.962 20.014-20.014 20.014s-20.014-8.962-20.014-20.014c0-47.888 38.96-86.848 86.848-86.848s86.848 38.96 86.848 86.848c-0.004 11.054-8.964 20.014-20.018 20.014zM600.658 795.232c-53.02 0-102-28.8-127.822-75.16-5.38-9.658-1.91-21.848 7.744-27.226 9.656-5.38 21.846-1.91 27.226 7.744 18.764 33.686 54.342 54.608 92.852 54.608 37.528 0 73.512-21.136 93.908-55.16 5.684-9.478 17.978-12.558 27.458-6.874 9.482 5.684 12.558 17.976 6.874 27.458-27.588 46.024-76.728 74.61-128.24 74.61z" fill="#7F184C" />
      <path d="M934.5 222.718c-57.164-83.336-136.698-147.41-230.004-185.294-10.242-4.156-21.914 0.774-26.076 11.016-4.158 10.242 0.774 21.914 11.016 26.076 86.01 34.922 159.338 94 212.05 170.848 53.96 78.66 82.48 170.864 82.48 266.638 0 260.248-211.724 471.97-471.97 471.97S40.03 772.244 40.03 512 251.752 40.03 512 40.03c11.054 0 20.014-8.962 20.014-20.014S523.054 0 512 0C229.68 0 0 229.68 0 512s229.68 512 512 512 512-229.68 512-512c0-103.894-30.948-203.926-89.5-289.282z" fill="#333333" />
      <path d="M492.588 379.726c11.054 0 20.014-8.962 20.014-20.014 0-47.888-38.962-86.848-86.848-86.848s-86.848 38.96-86.848 86.848c0 11.054 8.962 20.014 20.014 20.014 11.054 0 20.014-8.962 20.014-20.014 0-25.816 21.002-46.818 46.818-46.818s46.818 21.004 46.818 46.818c0.004 11.054 8.964 20.014 20.018 20.014zM716.982 359.712c0-25.816 21.002-46.818 46.818-46.818s46.818 21.004 46.818 46.818c0 11.054 8.962 20.014 20.014 20.014s20.014-8.962 20.014-20.014c0-47.888-38.962-86.848-86.848-86.848-47.886 0-86.848 38.96-86.848 86.848 0 11.054 8.962 20.014 20.014 20.014s20.018-8.96 20.018-20.014zM507.804 700.594c-5.38-9.656-17.57-13.124-27.226-7.744-9.658 5.38-13.124 17.568-7.744 27.226 25.824 46.36 74.804 75.16 127.822 75.16 51.512 0 100.652-28.586 128.244-74.606 5.684-9.482 2.608-21.774-6.874-27.458-9.478-5.684-21.774-2.604-27.458 6.874-20.398 34.024-56.382 55.16-93.908 55.16-38.514-0.004-74.094-20.928-92.856-54.612z" fill="#333333" />
      <path d="M628.142 34.028m-20.014 0a20.014 20.014 0 1 0 40.028 0 20.014 20.014 0 1 0-40.028 0Z" fill="#333333" />
    </svg>
  `,

  // History & Clock
  history: (size = 18, cls = '') => createSvg(`
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
    <path d="M12 7v5l4 2"></path>
  `, size, cls),

  clock: (size = 18, cls = '') => createSvg(`
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  `, size, cls),
  // Capture / Snipping
  scissors: (size = 18, cls = '') => createSvg(`
    <circle cx="6" cy="6" r="3"></circle>
    <circle cx="6" cy="18" r="3"></circle>
    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
  `, size, cls),

  camera: (size = 18, cls = '') => createSvg(`
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  `, size, cls),

  // AI & Brand
  sparkles: (size = 18, cls = '') => createSvg(`
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    <path d="M5 3v4"></path>
    <path d="M19 17v4"></path>
    <path d="M3 5h4"></path>
    <path d="M17 19h4"></path>
  `, size, cls),

  bot: (size = 18, cls = '') => createSvg(`
    <path d="M12 8V4H8"></path>
    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
    <path d="M2 14h2"></path>
    <path d="M20 14h2"></path>
    <path d="M15 13v2"></path>
    <path d="M9 13v2"></path>
  `, size, cls),

  // Messaging / Send
  send: (size = 18, cls = '') => createSvg(`
    <path d="m22 2-7 20-4-9-9-4Z"></path>
    <path d="M22 2 11 13"></path>
  `, size, cls),

  // Image Upload
  image: (size = 18, cls = '') => createSvg(`
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
    <circle cx="9" cy="9" r="2"></circle>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
  `, size, cls),

  // Settings & Configuration
  settings: (size = 18, cls = '') => createSvg(`
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  `, size, cls),

  layers: (size = 18, cls = '') => createSvg(`
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  `, size, cls),

  key: (size = 18, cls = '') => createSvg(`
    <circle cx="7.5" cy="15.5" r="5.5"></circle>
    <path d="m21 2-9.6 9.6"></path>
    <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
  `, size, cls),

  // Actions & Utilities
  plus: (size = 18, cls = '') => createSvg(`
    <path d="M5 12h14"></path>
    <path d="M12 5v14"></path>
  `, size, cls),

  trash: (size = 18, cls = '') => createSvg(`
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  `, size, cls),

  copy: (size = 18, cls = '') => createSvg(`
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
  `, size, cls),

  check: (size = 18, cls = '') => createSvg(`
    <polyline points="20 6 9 17 4 12"></polyline>
  `, size, cls),

  checkCircle: (size = 18, cls = '') => createSvg(`
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  `, size, cls),

  alertCircle: (size = 18, cls = '') => createSvg(`
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  `, size, cls),

  refresh: (size = 18, cls = '') => createSvg(`
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
    <path d="M21 3v5h-5"></path>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
    <path d="M3 21v-5h5"></path>
  `, size, cls),

  x: (size = 18, cls = '') => createSvg(`
    <path d="M18 6 6 18"></path>
    <path d="m6 6 12 12"></path>
  `, size, cls),

  maximize: (size = 18, cls = '') => createSvg(`
    <polyline points="15 3 21 3 21 9"></polyline>
    <polyline points="9 21 3 21 3 15"></polyline>
    <line x1="21" y1="3" x2="14" y2="10"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  `, size, cls),

  externalLink: (size = 18, cls = '') => createSvg(`
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  `, size, cls),

  // Study Tools
  bookOpen: (size = 18, cls = '') => createSvg(`
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  `, size, cls),

  languages: (size = 18, cls = '') => createSvg(`
    <path d="m5 8 6 6"></path>
    <path d="m4 14 6-6 2-3"></path>
    <path d="M2 5h12"></path>
    <path d="M7 2h1"></path>
    <path d="m22 22-5-10-5 10"></path>
    <path d="M14 18h6"></path>
  `, size, cls),

  fileText: (size = 18, cls = '') => createSvg(`
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
  `, size, cls),

  graduationCap: (size = 18, cls = '') => createSvg(`
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
  `, size, cls),

  stopCircle: (size = 18, cls = '') => createSvg(`
    <circle cx="12" cy="12" r="10"></circle>
    <rect width="6" height="6" x="9" y="9"></rect>
  `, size, cls),

  gripHorizontal: (size = 18, cls = '') => createSvg(`
    <circle cx="9" cy="9" r="1"></circle>
    <circle cx="9" cy="15" r="1"></circle>
    <circle cx="15" cy="9" r="1"></circle>
    <circle cx="15" cy="15" r="1"></circle>
    <circle cx="12" cy="9" r="1"></circle>
    <circle cx="12" cy="15" r="1"></circle>
  `, size, cls),

  pin: (size = 18, cls = '') => createSvg(`
    <line x1="12" y1="17" x2="12" y2="22"></line>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  `, size, cls),

  helpCircle: (size = 18, cls = '') => createSvg(`
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  `, size, cls),

  globe: (size = 18, cls = '') => createSvg(`
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  `, size, cls),

  messageCircle: (size = 18, cls = '') => createSvg(`
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
  `, size, cls),

  chevronUp: (size = 18, cls = '') => createSvg(`
    <polyline points="18 15 12 9 6 15"></polyline>
  `, size, cls),

  edit: (size = 18, cls = '') => createSvg(`
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  `, size, cls),

  slash: (size = 18, cls = '') => createSvg(`
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
  `, size, cls),

  chevronDown: (size = 18, cls = '') => createSvg(`
    <polyline points="6 9 12 15 18 9"></polyline>
  `, size, cls),

  chevronRight: (size = 18, cls = '') => createSvg(`
    <polyline points="9 18 15 12 9 6"></polyline>
  `, size, cls),

  cpu: (size = 18, cls = '') => createSvg(`
    <rect width="16" height="16" x="4" y="4" rx="2"></rect>
    <rect width="6" height="6" x="9" y="9" rx="1"></rect>
    <path d="M15 2v2"></path>
    <path d="M15 20v2"></path>
    <path d="M2 15h2"></path>
    <path d="M2 9h2"></path>
    <path d="M20 15h2"></path>
    <path d="M20 9h2"></path>
    <path d="M9 2v2"></path>
    <path d="M9 20v2"></path>
  `, size, cls),
};


