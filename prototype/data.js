/* Data Health — status model, sample data, and inlined CORE UI status icons.
 *
 * The seven Data Health states map onto CORE UI's shipped status vocabulary. CORE UI's Badge
 * exposes five colours (Apple / Pineapple / Lime / Plum / Slate); the token layer underneath
 * defines six semantic states. Where a state has no shipped slot (Partial), that is the one place
 * the pattern adds its own.
 *
 * Colour is DERIVED (hex) for building; the token name is what the pattern cites.
 * Icon ladder is CORE UI's own, shipped: hexagon (errorShield) -> triangle (warning) ->
 * circle (success) -> square (boxIndeterminate) -> hourglass (hourglassWait) -> help -> asterisk.
 */

// order = severity ladder, worst first
const STATUSES = [
  { key: 'failed',     label: 'Failed',     badge: 'Apple',     icon: 'errorShield',      token: '--coreui-status-error-*',   hex: '#F10E34' },
  { key: 'warning',    label: 'Warning',    badge: 'Pineapple', icon: 'warning',          token: '--coreui-status-warn-*',    hex: '#FFBF00' },
  { key: 'healthy',    label: 'Healthy',    badge: 'Lime',      icon: 'success',          token: '--coreui-status-success-*', hex: '#22A40E', hexDark: '#22A40E', hexLight: '#27BC10' },
  { key: 'partial',    label: 'Partial',    badge: 'Plum',      icon: 'boxIndeterminate', token: 'custom — no shipped slot',  hex: '#8E60D2', custom: true },
  { key: 'pending',    label: 'Pending',    badge: 'Pineapple', icon: 'hourglassWait',    token: '--coreui-status-warn-*',    hex: '#FFBF00' },
  { key: 'unverified', label: 'Unverified', badge: 'Plum',      icon: 'help',             token: '--coreui-status-info-*',    hex: '#8E60D2' },
  { key: 'unknown',    label: 'Unknown',    badge: 'Slate',     icon: 'asterisk',         token: '--coreui-status-neutral-*', hex: '#666666' },
];

const STATUS = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

// Sources per status. The dashboard summary reads these.
const FLEET = [
  ['failed', 5], ['warning', 7], ['healthy', 12], ['pending', 4], ['partial', 3], ['unverified', 2], ['unknown', 1],
];

/* Inlined CORE UI icons (24x24, single-colour). fill=currentColor so status colour drives them.
 * These are the exported CORE UI SVGs; only the fixed fill was swapped for currentColor. */
const ICON_PATHS = {
  errorShield: '<path d="M20.7,5.7L13.2,1.3c-.4-.2-.8-.3-1.2-.3s-.8.1-1.2.3L3.2,5.7c-.3.2-.6.5-.8.9-.2.4-.3.8-.3,1.2v8.6c0,.4,0,.8.3,1.2s.5.7.8.9l7.5,4.3c.4.2.8.3,1.2.3s.8-.1,1.2-.3l7.7-4.3c.4-.2.6-.5.8-.9.2-.4.3-.8.3-1.2V7.7c0-.4,0-.8-.3-1.2-.2-.4-.5-.7-.9-.9ZM12,17.5c-.3,0-.5,0-.8-.2-.2-.1-.4-.4-.5-.6-.1-.2-.1-.5,0-.8,0-.3.2-.5.4-.7.2-.2.4-.3.7-.4.3,0,.5,0,.8,0,.3,0,.5.3.6.5.2.2.2.5.2.8,0,.2,0,.4,0,.5,0,.2-.2.3-.3.5s-.3.2-.4.3-.3.1-.5.1ZM13.6,7.9l-.9,4.7c0,.5-.2.5-.5.5h-.5c-.3,0-.5,0-.5-.5l-.8-4.7c0-.2,0-.4,0-.5,0-.2.2-.3.3-.5.1-.1.3-.2.5-.3.2,0,.4-.1.5-.1h.4c.4,0,.7.2,1,.4.3.3.4.6.4,1Z"/>',
  warning: '<path d="M22.7,19L13.6,3.2c-.5-.9-1.7-1.2-2.5-.7-.3.2-.5.4-.7.7L1.2,19c-.5.9-.2,2,.7,2.5.3.2.6.3,1.2.2h18.3c.8,0,1.6-.8,1.6-1.9,0-.3,0-.6-.3-.9ZM12,19.4c-.8,0-1.5-.7-1.5-1.5s.7-1.5,1.5-1.5,1.5.7,1.5,1.5-.7,1.5-1.5,1.5h0ZM12.8,14.6c0,.2-.2.3-.4.3h-.8c-.2,0-.4-.2-.4-.4l-.8-5.2c0-.4,0-.9.3-1.2.7-.8,1.9-.7,2.5-.1,0,0,0,0,0,0,.2.3.4.7.3,1.2l-.8,5.3Z"/>',
  success: '<path d="M12,1C5.9,1,1,5.9,1,12s4.9,11,11,11,11-4.9,11-11S18.1,1,12,1ZM18.1,9l-6.8,8c-.3.3-.6.5-1,.5-.4,0-.8,0-1.1-.3l-3.2-2.7c-.3-.3-.5-.6-.5-1,0-.4,0-.8.3-1.1.3-.3.6-.5,1-.5.4,0,.8,0,1.1.3l2.1,1.7,5.8-6.9c.3-.3.6-.5,1-.5.4,0,.8,0,1.1.4.3.3.5.6.5,1s0,.8-.4,1.1h0Z"/>',
  boxIndeterminate: '<path d="M19.7,1.5H4.3c-1.8,0-3.3,1.4-3.3,3.1v14.6c0,1.7,1.5,3.1,3.3,3.1h15.4c1.8,0,3.3-1.4,3.3-3.1V4.7c0-1.7-1.5-3.1-3.3-3.1ZM16.4,13.6H7.6c-.6,0-1.1-.7-1.1-1.6s.5-1.6,1.1-1.6h8.8c.6,0,1.1.7,1.1,1.6s-.5,1.6-1.1,1.6Z"/>',
  hourglassWait: '<path d="M10.4,17.9h-6s0,0,0,0c0-3.3,2-6,4.4-6s2,.5,2.8,1.4c.4-.5.8-1,1.4-1.4-.3-.4-.7-.7-1.1-1,1.9-1.4,3.3-4,3.3-7s0,0,0,0h.5c.5,0,1-.4,1-1v-.9c0-.6-.4-1-1-1H2c-.5,0-1,.4-1,1v.9c0,.6.4,1,1,1h.5s0,0,0,0c0,3,1.3,5.6,3.3,7-1.9,1.4-3.3,4-3.3,7s0,0,0,0h-.5c-.5,0-1,.4-1,1v.9c0,.6.4,1,1,1h9.5c-.6-.8-.9-1.8-1.1-2.9h0ZM4.4,3.9s0,0,0,0h8.7s0,0,0,0c0,3.3-2,6-4.4,6s-4.4-2.7-4.4-6h0Z"/><path d="M18.7,15.8h0s-.8.8-.8.8c0,0-.2,0-.3,0-.6,0-1,.5-1,1s.4,1,1,1,1-.5,1-1,0-.1,0-.2l.8-.8h0c.2-.3.2-.6,0-.8-.2-.2-.5-.2-.7,0Z"/><path d="M22,14.4c0,0,.1,0,.2-.1l.4-.4c.2-.3.2-.7,0-1l-.7-.7c-.3-.3-.7-.2-.9,0l-.4.4s0,.1,0,.2c-.5-.3-1.1-.5-1.7-.7v-.8h.8c.5,0,1-.4,1-1h0c0-.6-.4-1.1-1-1.1h-3.4c-.5,0-1,.4-1,1h0c0,.6.4,1.1,1,1.1h.8v.8c-2.5.5-4.4,2.7-4.4,5.3s2.4,5.4,5.3,5.4,5.3-2.4,5.3-5.4-.4-2.3-1-3.2h0ZM17.7,21.6c-2.2,0-4-1.8-4-4.1s1.8-4.1,4-4.1,4,1.8,4,4.1-1.8,4.1-4,4.1Z"/>',
  help: '<path d="M12,1C5.9,1,1,5.9,1,12s4.9,11,11,11,11-4.9,11-11S18.1,1,12,1ZM11.8,18.6c-.3,0-.6,0-.9-.3-.3-.2-.5-.4-.6-.7-.1-.3-.2-.6,0-1,0-.3.2-.6.5-.8s.5-.4.8-.5c.3,0,.7,0,1,0,.3.1.6.3.7.6.2.3.3.6.3.9s-.2.9-.5,1.2c-.3.3-.7.5-1.2.5ZM13.2,13.4h-2.9c-.4-2.5,2.4-3.2,2.4-4.4s-.5-1-1.1-1-1.1.3-1.6.8l-1.8-1.6c1-1.1,2.3-1.8,3.9-1.8s3.8,1,3.8,3.3-2.8,2.5-2.6,4.6Z"/>',
  asterisk: '<path d="M10.2,2.8v4.7l-3.3-3.3c-.3-.3-.8-.5-1.3-.5s-1,.2-1.3.5c-.3.3-.5.8-.5,1.3s.2,1,.5,1.3l3.3,3.3H2.8c-.5,0-1,.2-1.3.5-.3.3-.5.8-.5,1.3s.2,1,.5,1.3c.3.3.8.5,1.3.5h5.4l-3.4,3.4c-.2.2-.3.4-.4.6,0,.2-.1.5-.1.7,0,.2,0,.5.1.7,0,.2.2.4.4.6.2.2.4.3.6.4.2,0,.5.1.7.1.2,0,.5,0,.7-.1.2,0,.4-.2.6-.4l2.7-2.7v4.1c0,.5.2,1,.5,1.3.3.3.8.5,1.3.5s1-.2,1.3-.5c.3-.3.5-.8.5-1.3v-4.7l3.3,3.3c.3.3.8.5,1.3.5s1-.2,1.3-.5c.3-.3.5-.8.5-1.3s-.2-1-.5-1.3l-3.3-3.3h4.7c.5,0,1-.2,1.3-.5.3-.3.5-.8.5-1.3s-.2-1-.5-1.3c-.3-.3-.8-.5-1.3-.5h-4.1l3.4-3.4c.3-.3.5-.8.5-1.3s-.2-1-.5-1.3c-.3-.3-.8-.5-1.3-.5s-1,.2-1.3.5l-4,4V2.8c0-.5-.2-1-.5-1.3-.3-.3-.8-.5-1.3-.5s-1,.2-1.3.5c-.3.3-.5.8-.5,1.3Z"/>',
};

function iconSvg(id, size = 16) {
  const inner = ICON_PATHS[id] || '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" role="img" aria-hidden="true">${inner}</svg>`;
}
