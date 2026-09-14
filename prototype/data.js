/* Data Health — the status model and the sample data each surface shows.
 *
 * Seven states, worst first. Each state has an icon (assets/status/<key>.svg) and a chart colour (hex), used by the
 * dashboard's chart and legend. The indicator's own colours live in data-health.css.
 *
 * The rows are CORE UI's own demo data. Rows and cards that appear in the design file's mockups keep the state shown
 * there; the rest are filled out so every state appears on every surface. */

const STATUSES = [
  { key: 'failed',    label: 'Failed',    hex: '#F10E34' },
  { key: 'warning',   label: 'Warning',   hex: '#FFBF00' },
  { key: 'healthy',   label: 'Healthy',   hex: '#27BC10' },
  { key: 'partial',   label: 'Partial',   hex: '#0063E6' },
  { key: 'pending',   label: 'Pending',   hex: '#66A1F0' },
  { key: 'unknown',   label: 'Unknown',   hex: '#8E60D2' },
  { key: 'undefined', label: 'Undefined', hex: '#BBA0E4' },
];
const STATUS = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

// Sources per state — the dashboard summary's counts.
const FLEET = { failed: 6, warning: 7, healthy: 12, partial: 6, pending: 4, unknown: 2, undefined: 2 };

// CORE UI's Table live demo rows, verbatim (Campaign Performance Data).
const DEMO_ROWS = {
  'Birthday Discount': { budget: '$50,000',  spend: '$25,000', views: '500',    clicks: '1,200', updated: '01/15/24 11:05 AM CDT' },
  'Dog Lovers':        { budget: '$10,000',  spend: '$0',      views: '0',      clicks: '0',     updated: '01/14/24 09:30 AM CDT' },
  "Father's Day Sale": { budget: '$30,500',  spend: '$22,100', views: '6,000',  clicks: '4,000', updated: '01/13/24 02:22 PM CDT' },
  "Mother's Day Sale": { budget: '$30,000',  spend: '$15,000', views: '4,500',  clicks: '3,000', updated: '01/13/24 08:15 AM CDT', ai: true },
  'New Arrivals':      { budget: '$100,000', spend: '$42,600', views: '12,000', clicks: '9,650', updated: '01/12/24 04:45 PM CDT' },
  'Summer Deals':      { budget: '$45,000',  spend: '$23,500', views: '5,600',  clicks: '960',   updated: '01/11/24 01:00 PM CDT', ai: true, shared: true },
};

// Option A table: the demo's rows grouped by state, one group header per state.
const TABLE_GROUPS = [
  ['failed',    ['Birthday Discount', 'Birthday Discount']],
  ['warning',   ['Dog Lovers', 'Dog Lovers', "Father's Day Sale"]],
  ['healthy',   ["Father's Day Sale"]],
  ['partial',   ["Father's Day Sale", "Mother's Day Sale"]],
  ['pending',   ['New Arrivals', 'Summer Deals']],
  ['unknown',   ['Birthday Discount', 'Dog Lovers']],
  ['undefined', ["Mother's Day Sale"]],
];

// Option B table: CORE UI's Filters & Action Bar live demo rows, verbatim, with a state in the Status column.
const FAB_ROWS = [
  { name: 'Birthday Discount', channel: 'display', budget: '$50,000',  spend: '$25,000', pacing: 'On Target',     views: '500',    clicks: '1,200', status: 'failed' },
  { name: 'Dog Lovers',        channel: 'mobile',  budget: '$10,000',  spend: '$0',      pacing: 'Underspending', views: '0',      clicks: '0',     status: 'failed' },
  { name: "Father's Day Sale", channel: 'video',   budget: '$30,500',  spend: '$22,100', pacing: 'Overspending',  views: '6,000',  clicks: '4,000', status: 'warning' },
  { name: "Mother's Day Sale", channel: 'video',   budget: '$30,500',  spend: '$15,000', pacing: 'On Target',     views: '4,500',  clicks: '3,000', status: 'warning' },
  { name: 'New Arrivals',      channel: 'mobile',  budget: '$100,000', spend: '$42,600', pacing: 'Underspending', views: '12,000', clicks: '9,650', status: 'healthy' },
  { name: 'Summer Deals',      channel: 'display', budget: '$25,000',  spend: '$25,000', pacing: 'On Target',     views: '2,000',  clicks: '900',   status: 'healthy' },
  { name: 'Birthday Discount', channel: 'display', budget: '$50,000',  spend: '$25,000', pacing: 'On Target',     views: '500',    clicks: '1,200', status: 'healthy' },
  { name: 'Dog Lovers',        channel: 'mobile',  budget: '$10,000',  spend: '$0',      pacing: 'Underspending', views: '0',      clicks: '0',     status: 'pending' },
  { name: "Father's Day Sale", channel: 'video',   budget: '$30,500',  spend: '$22,100', pacing: 'Overspending',  views: '6,000',  clicks: '4,000', status: 'pending' },
  { name: "Mother's Day Sale", channel: 'video',   budget: '$30,500',  spend: '$15,000', pacing: 'On Target',     views: '4,500',  clicks: '3,000', status: 'unknown' },
  { name: 'New Arrivals',      channel: 'mobile',  budget: '$100,000', spend: '$42,600', pacing: 'Underspending', views: '12,000', clicks: '9,650', status: 'partial' },
  { name: 'Summer Deals',      channel: 'display', budget: '$25,000',  spend: '$25,000', pacing: 'On Target',     views: '2,000',  clicks: '900',   status: 'partial' },
  { name: 'Birthday Discount', channel: 'display', budget: '$50,000',  spend: '$25,000', pacing: 'On Target',     views: '500',    clicks: '1,200', status: 'healthy' },
  { name: 'Dog Lovers',        channel: 'mobile',  budget: '$10,000',  spend: '$0',      pacing: 'Underspending', views: '0',      clicks: '0',     status: 'undefined' },
  { name: "Father's Day Sale", channel: 'video',   budget: '$30,500',  spend: '$22,100', pacing: 'Overspending',  views: '6,000',  clicks: '4,000', status: 'warning' },
  { name: "Mother's Day Sale", channel: 'video',   budget: '$30,500',  spend: '$15,000', pacing: 'On Target',     views: '4,500',  clicks: '3,000', status: 'failed' },
  { name: 'New Arrivals',      channel: 'mobile',  budget: '$100,000', spend: '$42,600', pacing: 'Underspending', views: '12,000', clicks: '9,650', status: 'healthy' },
  { name: 'Summer Deals',      channel: 'display', budget: '$25,000',  spend: '$25,000', pacing: 'On Target',     views: '2,000',  clicks: '900',   status: 'pending' },
  { name: 'Birthday Discount', channel: 'display', budget: '$50,000',  spend: '$25,000', pacing: 'On Target',     views: '500',    clicks: '1,200', status: 'unknown' },
  { name: 'Dog Lovers',        channel: 'mobile',  budget: '$10,000',  spend: '$0',      pacing: 'Underspending', views: '0',      clicks: '0',     status: 'undefined' },
];

// Option B dashboard: customers per state per month, stacked (the design file's bar chart).
const BAR_MONTHS = [
  { month: 'Oct', failed: 38, warning: 64, healthy: 212, pending: 27 },
  { month: 'Nov', failed: 45, warning: 71, healthy: 188, partial: 52, pending: 33, unknown: 18 },
  { month: 'Dec', failed: 57, warning: 83, healthy: 164, partial: 61, pending: 42, unknown: 24, undefined: 16 },
  { month: 'Jan', failed: 49, warning: 58, healthy: 201, partial: 44, pending: 36, unknown: 21, undefined: 12 },
  { month: 'Feb', warning: 47, healthy: 176, partial: 39, undefined: 22 },
  { month: 'Mar', failed: 31, warning: 52, healthy: 243 },
];

// The four cards' states, in reading order, per rendering (the design file's Icon and Lozenge card slides).
const CARD_STATUSES = { icon: ['failed', 'healthy', 'warning', 'unknown'], lozenge: ['failed', 'warning', 'healthy', 'unknown'] };

// The three icon families (the design file's Option A / B / C). Each is a folder under assets/status/, seven SVGs
// named by state. B's data stack carries class="dh-stack" so the theme can recolour it (data-health.css).
const OPTIONS = [
  { key: 'A', label: 'Option A: “Classic”', dir: 'a' },
  { key: 'B', label: 'Option B: “Stack”',   dir: 'b' },
  { key: 'C', label: 'Option C: “Hybrid”',  dir: 'c' },
];
const OPTION = Object.fromEntries(OPTIONS.map((o) => [o.key, o]));
