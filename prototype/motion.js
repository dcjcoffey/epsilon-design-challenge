/* Data Health — the motion table. ONE source of truth for every animation: the prototype plays it (app.js),
 * the After Effects exporter reads it, and the deck's Animation Spec slide quotes it.
 *
 * A motion is a list of tracks. Each track animates one property of one element from `from` to `to`, starting
 * `delay` ms after the motion begins (or after the element named in `after` comes to rest) and taking `duration` ms,
 * along one of CORE UI's easing curves. `stagger` starts each successive element that much later; `pulse` goes out
 * and back; `order` names the elements' sequence; `matches` ties a track's duration and rise to another element's.
 *
 * The values between the SAVED markers are written by the deck's Save button (tools/serve.mjs rewrites that block),
 * so what DC tunes in the prototype IS the default. Do not hand-edit inside the markers.
 *
 * The sketches (DC, 2026-09-14) the tracks come from:
 *   01  ring grows from its centre to full size as one piece while fading in
 *   02  "SPIN" — the ring turns clockwise as it grows, one full turn, landing at rest
 *   —   the ring starts after the title lands (after: 'title')
 *   03  "INDIVIDUAL ROWS" — each legend row rises into place and fades in, one after another, after the ring rests
 *   04  the card title plays on entry with the rows' rise and fade values (matches: 'legendRow')
 *   05  "RING GLOW AFTER LANDING" — each segment's halo swells and fades in turn, clockwise from Healthy, and while it
 *       glows the segment takes the SELECTED look (CORE UI's donut dims a marked slice to 0.35) and comes back
 *   06  "URGENT BOUNCE AND GLOW" — once the rows are in, the Failed and Warning legend icons bounce up and glow in
 *       their own colour, Failed first
 *   07  "SEGMENT HOVER — PIECE LIFTS OUT" — a hovered slice lifts outward from the centre and settles back (a
 *       `trigger: 'hover'` track: not part of the show; app.js's hover handlers read it)
 *   Fades are linear (DC: "the fade arrives with the landing"); moves use CORE UI's entering curve. */

const EASINGS = {
  easingStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',   // CORE UI: elements already on screen
  easingOut:      'cubic-bezier(0, 0, 0.2, 1)',     // CORE UI: ENTERING
  easingIn:       'cubic-bezier(0.4, 0, 1, 1)',     // CORE UI: LEAVING
  linear:         'linear',
};
const EASING_LABELS = { easingStandard: 'Standard', easingOut: 'Ease out (entering)', easingIn: 'Ease in (leaving)', linear: 'Linear' };
const TIMINGS = { superFast: 100, fast: 200, medium: 300, slow: 400 };   // CORE UI's four durations

// ---- SAVED FROM THE DECK — written by the Save button; do not hand-edit ----
const SAVED = {
  "loop": false,
  "loopHold": 1000,
  "tracks": [
    { "element": "ring", "after": "title", "property": "scale", "from": 0, "to": 1, "delay": 150, "duration": 800, "easing": "easingOut" },
    { "element": "ring", "after": "title", "property": "opacity", "from": 0, "to": 1, "delay": 150, "duration": 800, "easing": "linear" },
    { "element": "ring", "after": "title", "property": "rotate", "from": -360, "to": 0, "delay": 150, "duration": 800, "easing": "easingOut" },
    { "element": "legendRow", "after": "ring", "property": "translateY", "from": 16, "to": 0, "delay": 1000, "duration": 400, "easing": "easingOut", "stagger": 150 },
    { "element": "legendRow", "after": "ring", "property": "opacity", "from": 0, "to": 1, "delay": 1000, "duration": 400, "easing": "linear", "stagger": 150 },
    { "element": "title", "matches": "legendRow", "property": "translateY", "from": 16, "to": 0, "delay": 0, "duration": 400, "easing": "easingOut" },
    { "element": "title", "matches": "legendRow", "property": "opacity", "from": 0, "to": 1, "delay": 0, "duration": 400, "easing": "linear" },
    { "element": "segment", "after": "ring", "property": "glow", "pulse": true, "from": 0, "to": 4, "delay": -150, "duration": 500, "easing": "easingStandard", "stagger": 100, "order": ["healthy", "partial", "pending", "unknown", "undefined", "failed", "warning"] },
    { "element": "segment", "after": "ring", "property": "opacity", "pulse": true, "from": 1, "to": 0.35, "delay": -150, "duration": 500, "easing": "easingStandard", "stagger": 100, "order": ["healthy", "partial", "pending", "unknown", "undefined", "failed", "warning"] },
    { "element": "urgentIcon", "after": "legendRow", "property": "translateY", "pulse": true, "from": 0, "to": -6, "delay": 0, "duration": 1400, "easing": "easingStandard", "stagger": 0, "order": ["failed", "warning"] },
    { "element": "urgentIcon", "after": "legendRow", "property": "glow", "pulse": true, "from": 0, "to": 6, "delay": 0, "duration": 1400, "easing": "easingStandard", "stagger": 0, "order": ["failed", "warning"] },
    { "element": "hoverSegment", "trigger": "hover", "property": "liftOut", "from": 0, "to": 6, "delay": 0, "duration": 200, "easing": "easingStandard" }
  ]
};
// ---- END SAVED ----

function motionDefaults() {
  return {
    loop: SAVED.loop !== false,
    loopHold: SAVED.loopHold,
    radialEnter: { name: 'Radial', component: 'Dashboard Radial', tracks: SAVED.tracks.map((t) => ({ ...t, order: t.order && [...t.order] })) },
  };
}
let MOTION = motionDefaults();
