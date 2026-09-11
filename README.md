# Data Health — a status pattern for CORE UI

A working prototype of **Data Health**, a status pattern that expresses the health of a data
source across three CORE UI surfaces: a Table, a Card and a Dashboard summary. Built for the
Epsilon design challenge (Part 3, FED Development).

Open `prototype/index.html` from any static server. No build step, no framework.

## What is CORE UI's and what is Data Health's

The prototype is built on CORE UI's real markup and CSS, captured from its public Storybook
(v21.7.0). Everything Data Health adds or changes is marked, so nothing has to be taken on trust:

- **In the page:** every element Data Health adds or changes carries a `data-dh` attribute naming
  what it is (`status badge`, `status column`, `ring drawn by app.js`, `narrowed away`, …).
  CORE UI's own elements carry nothing.
- **In Show code:** the panel under the preview prints the live HTML of the page on show, straight
  from the document, and highlights every `data-dh` line with a count above the listing. There is
  no second copy of the markup to drift.
- **In the files:** `prototype/assets/` is CORE UI's (compiled tokens, icon font, component rules
  extracted from the Storybook captures). `prototype/shell.css`, `app.js` and `data.js` are Data
  Health's, and each says so at the top.

## Deviations from CORE UI, stated plainly

- **Behaviour is replaced, not reproduced.** CORE UI's components run on Angular, which is
  private on npm and cannot be run here. Tooltips, page turning, the chart tooltip and the
  legend click are a small plain script. Their checkbox select-all, sorting and column filters
  are not wired.
- **The ring is drawn by the prototype.** CORE UI's Radial is drawn by a charting library at
  runtime. The prototype draws the same geometry (outer 86.5, inner 70, centred at 87.5) itself.
- **Slice and legend colours are inline hex values.** CORE UI's demo writes them inline too, as
  token names.
- **Angular's fingerprints are stripped** from the captured markup: generated attributes and
  form-state classes.
- **The Show code row is Storybook's, not CORE UI's.** Its two buttons are Storybook's docs
  controls, measured on CORE UI's own docs page.

## The pattern in one paragraph

Seven states on one severity ladder — Failed, Warning, Healthy, Partial, Pending, Unverified,
Unknown — mapped onto CORE UI's shipped status tokens and icons. Each surface shows the status in
one slot: the table's icon column (or a Status column), the card's icon slot, and the dashboard
legend. Clicking a status in the dashboard narrows the table to it.

## Layout

```
prototype/
  index.html        the page shell
  shell.css         Data Health's styles
  app.js            Data Health's behaviour
  data.js           the seven states and the sample counts
  assets/           CORE UI's tokens, component rules and fonts, as captured
```

The Storybook captures the assets were built from, and the scripts that took them, are kept
outside this repository.
