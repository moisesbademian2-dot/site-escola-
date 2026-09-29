---
version: 1
slug: "index-html-auth-screen"
primary_target: "index.html#auth-screen"
related_targets: []
---

# Surface: login/signup (index.html #auth-screen)

Scope: the pre-login screen only (login, public signup, first-admin setup, forgot/reset
password forms) — `index.html` lines inside `#auth-screen`, plus `.auth-*` rules in
`style.css`. The authenticated app shell (sidebar, dashboard, all other screens) is out of
scope and keeps its current light/navy/amber system untouched.

Mode: Operate. The visitor's job is "get into my account," not "be persuaded." A parent
or student is frequently doing this on a phone in the evening; staff on a desktop during
the school day. Legibility and speed outrank expression, but the institution should still
be unmistakable in the first glance.

Audience/job/constraints: five roles (diretor, coordenador, professor, aluno,
responsável) share this one form; role is chosen inside the sign-up flow, not here. Must
preserve every existing form element `id` (`login-email`, `signup-role`,
`signup-matricula`, `signup-matricula-verificar`, `signup-matricula-confirm`,
`setup-*`, `forgot-*`, `reset-*`, etc.) — `js/app.js` and `js/core.js` wire behavior to
those ids and none may be renamed. Must keep the matrícula verify/confirm flow (a green
inline confirmation panel before the rest of the responsável form appears) and the
first-admin setup notice. Real crest logo at `logo2.0-quadrada.png`.

## Direction contract

**THESIS:** The institution announces itself before it asks anything of the visitor — a
bold navy geometric crest-pattern crown tops the card — then gets out of the way for a
plain, fast, unmistakably operational form below. Refuses both the previous build's
dark-cosmic full-bleed scene (too Persuade-flavored for a daily-use login) and the
generic centered-logo-on-gradient-blob template every AI login screen defaults to.

**OWN-WORLD:** Page ground is calm light neutral (`--bg`, not black). The card itself
carries the two-tone split: top ~36% is a geometric mosaic in navy ink
(`#0f172a`→`#1e3a8a`→`#1e40af`) — overlapping circles, rings, and triangles at varied
scale and opacity, authored as a tiled inline SVG pattern, not a photo or gradient
approximation — capped by a white rounded-square badge (overlapping the pattern/white
seam) holding the real crest. Bottom ~64% is pure white with the rounded-top overlap seam
from the reference. Inputs are flat filled rounded rectangles (`--surface-2` fill, no
border by default, label in small caps above, no icon prefixes — a deliberate departure
from every other form in this app, earned by this specific reference) with a navy focus
ring. Primary button: solid navy, full width, white text — the header's own ink color,
not amber. Amber is rationed to exactly one role: the "Cadastre-se"/"Entrar" switch-mode
link text and the tiny verification-success accent, so the restrained-accent strategy
holds and the button doesn't compete with the header for attention.

**STORY:** Visitor sees the crest and pattern, immediately reads "this is our school's
system," reads the plain heading, fills two fields, presses one dark full-width button.
Wrong password/new-here get a one-line inline message, not a page change. Switching to
sign-up flips the card's lower half only; the crest header stays put as the constant.

**FIRST VIEWPORT:** A single card, max-width ~440px, centered on the light page ground,
own drop shadow (soft, offset, no colored halo). Header band: pattern fills it edge to
edge inside the card's rounded top corners; badge sits centered, straddling the
pattern/white seam. Directly under the seam: page/form title, then stacked full-width
fields, then the button, then the mode-switch line, then the small lock/security hint —
same content this screen already carries, re-skinned, not re-organized.

**FORM:** Brief-pinned by the user's own reference screenshot (mobile login/sign-up pair,
black header pattern + white form + black button); no concept-seed roll — a user-pinned
direction always beats the roll. Translated from the reference's black/white monochrome
into this school's confirmed navy/amber identity (PRODUCT.md Brand Commitments), and from
its native-app single-purpose screen into this app's existing multi-form single-card
container (login / signup / setup / forgot / reset all live in one card, switching
internally) so every current auth capability survives the reskin.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish
review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Build path: code-led (no image-generation tool available in this session) — the ambition
above is what the finish review audits in the built HTML/CSS, not a rendered comp.

Unresolved decisions: none — reference is explicit enough to build directly.
