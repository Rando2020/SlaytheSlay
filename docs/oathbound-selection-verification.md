# Oathbound selection artwork

`assets/backgrounds/oath_select.webp` is the existing approved kneeling-knight/four-gods selection painting, copied unchanged from the local project asset. No replacement artwork or class mechanics were generated for this fix. Original dimensions: 1672 × 941.

`assets/backgrounds/oath_select_4k.webp` is a 3840 × 2161 Lanczos resize of that file, encoded as WebP quality 90. It is a display derivative, not native 4K artwork.

## Verification

Run `node --test tests/selection.test.cjs`. This checks that both selection resolutions and all registered hero poses are present, and that both class factories retain their starting stats, relics and decks.

The game has no compilation step or package dependency: deploy index.html and the assets directory together through a static web host. Opening index.html over file:// is unsuitable for WebGL image loading.

The main-branch raw.githack URL is a temporary source preview. It can show a third-party content notice and cache the branch; it does not include unmerged PR artwork. For reproducible review use a commit-pinned raw.githack URL. A permanent production host remains separate work.
