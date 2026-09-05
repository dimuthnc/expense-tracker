# factory-ui

A small CSS design system in the dark-navy / mono-label / accent-bar idiom.
Two files, no build step, no framework.

```
tokens.css       every colour, size, font and duration in the system
components.css   the classes built on top of them
index.html       living reference — open it in a browser
```

## Use it

```html
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
<body class="fx-page">
```

Fonts are declared as tokens with fallbacks, so the system works before the
webfonts land. Load them however you like — the reference page uses Google
Fonts; self-hosting with `font-display: swap` is faster and avoids the
third-party request.

## The rules that make it a system

**Accents mean things.** Amber is human judgement. Teal is machine work. Blue
is emphasis or an aside. Coral is a section marker or a warning. The moment you
pick an accent because it looks good in that spot, the palette stops reading as
a system and starts reading as decoration. This is the single most important
constraint in the whole file.

**Mono is for structure, never for prose.** Labels, counters, status, tags. If
a sentence needs to be read rather than scanned, it is not mono.

**One loud thing per screen.** The display heading, or the big number, or the
diagram — not all three. Everything else stays quiet.

**Numbered badges need a real sequence.** `1 / 2 / 3` on things that are not
ordered is the fastest way to make a page look generated.

**The serif italic is a scalpel.** One phrase per page. Two, and it becomes a
texture instead of an emphasis.

## Extend it

Add a component by composing tokens, never raw values:

```css
.fx-callout {
  padding: var(--fx-5);
  background: var(--fx-surface);
  border: 1px solid var(--fx-rule);
  border-left: var(--fx-bar) solid var(--fx-thought);
  border-radius: var(--fx-radius);
}
```

If you find yourself typing a hex code or a pixel value outside `tokens.css`,
that is the signal you need a new token.

## Retheming

Everything cascades from `:root`. Swapping the four accents and the base gives
you a different identity with the same bones. A light theme is already wired up
behind `<html data-fx-theme="light">`.

## Diagrams

`.fx-track` is deliberately generic. Anything more specific — an architecture
sketch, a pipeline illustration — should be hand-authored SVG using the same
tokens: 1–2px strokes, `currentColor` where possible, `var(--fx-machine)` and
`var(--fx-human)` for the two layers. That drawing is what will make the site
yours rather than a restyle of someone else's deck.
