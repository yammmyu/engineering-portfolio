# Journal

Running log of substantial work. **Newest entry first.** Read the top entry before
starting; append a new one before you finish.

Keep entries short. What changed, why, and what you left open — not a diff summary, which
git already has. Skip an entry for a typo fix; write one for anything a future agent would
be surprised by.

Template:

```
## YYYY-MM-DD — Title
**Did:** ...
**Why:** ...
**Open:** ...
```

---

## 2026-09-22 — Project figures: photographs replace the diagrams

**Did:** Swapped `public/projects/proj_humanoid.jpg` for a photo of the actual dual-arm
humanoid mid-parcel-handling, supplied by the user. This closes the first half of the
"figures undercut the work" item below.

The source is 1206×907 (4:3) and the frame is 16:10 `object-cover`, so ~150px of height was
going to be cropped either way. Chose the crop rather than leaving it to the browser, which
would have taken it off both edges: cropped to 1026×641 at offset (0, 180), dropping the
dead floor, power strip and stool on the left and keeping the head, both arms, the gripper,
the parcel and the tote.

Picked that framing by rendering both candidates at 272px — the figure's real width since
the column was capped — rather than judging them full size. Full-width, the robot reduces to
a pale shape on a busy floor; tighter, it still reads as a dual-arm humanoid handling a
parcel. Worth repeating for any future figure: `docs/CONTENT.md` says to crop for ~360px,
and the cap made that 272px.

Then the same for **P-03**: `proj_pcb.jpg` was a raw KiCad canvas, and is now a photo of the
two fabricated boards on a table. Source was 5712×4284; cropped to 5200×3250 at offset
(100, 400) — again chosen rather than delegated, to drop the carpet and a dark object in the
bottom-right instead of having `object-cover` trim the board edges. Downscaled to 1200×750.

Quality 50 on that one, not the usual 80: the wood grain compresses badly and q80 came to
266kB, the heaviest figure on the sheet by a wide margin. At q50 it is 148kB — in line with
the others — with no artefacts visible on the boards at any size the page shows them.

**Why:** Requested. Both previous figures were diagrams whose labels were illegible at the
figure's real width, which is exactly what CONTENT.md warns about.

**Open:**
- **P-02 is still a diagram** — an annotated slide of the TurtleBot3. Last one; a photo of
  the robot would finish the set.
- The P-03 description says **"Three KiCad boards"** and the photo shows two. Nothing on the
  page claims the figure is complete, so this is not a defect, but a reader may notice.
  Worth either a third board in shot or leaving as is — the user's call.
- The PCB photo is the warmest, most saturated thing on the sheet, and copper sits close to
  the amber accent. It reads as copper rather than as branding, so it is left alone; worth
  watching if more warm figures arrive.
- The photo shows an internal lab setup and third-party hardware branding. Flagged to the
  user; publishing it is their call, and they asked for it.
- `public/og.png` does **not** need regenerating: the share card is built from the hero, not
  from any project figure.

## 2026-08-11 — Design review: recruiter-facing gaps, and the mechanical half of the fixes

**Did:** Reviewed the built site in a browser at 1440×900 rather than from the source, which
is how most of this was found. The craft was not the problem; what the page *answers* was. A
recruiter could read the whole thing and not learn where he studies, when he graduates, when
he is free, or that he has held an internship. Landed everything that needed no facts from
him:

- **Three rows were silently unlinked on desktop.** `aimbot`, `controller` and `arm` point
  at screenshots that don't exist. `ProjectFigure` removed itself on `error` as designed —
  but the `GITHUB ↗` marker lives in the *other* branch of `project.image ? … : …`, so a
  declared-but-missing image ate the branch and those rows rendered with an empty right
  third and nothing saying they went anywhere. The failure state now lives in `ProjectRow`.
  Same broken promise the stretched row link fixed once, arriving by a new route.
- **Share card.** There were no OG tags at all, so a link shared into a message previewed as
  a bare URL. Added them plus `public/og.png`, generated from the real hero by
  `scripts/og.html` — an iframe of the built page with everything but the hero hidden, so
  the card cannot drift from the site. `check.mjs` now verifies the tags are absolute, agree
  on origin, and point at a file that exists (negative-tested, not assumed).
- **Tags stopped pretending to be controls** — boxed chips at the weight of the language
  toggle, on a list with no filter. Now one line of mono marks.
- **Skills BOM cites project rows** instead of repeating the tag vocabulary. `usedIn` holds
  ids; the `P-NN` comes from `PROJECT_REFS` so it cannot drift when rows move. Only what the
  descriptions actually state is cited — three rows read `—`, which is the honest entry and
  a better prompt to the user than a guess would be.
- **Density:** figure column capped at 17rem and pushed to the sheet edge, row padding down
  a step. Given four full columns the figures grew to ~400px and set the height of every row
  that had one. Split `Further work` off the bottom of the list.
- **Hero caption** stopped truncating. It was the `truncate` element beside a `shrink-0`
  hint, so the figure's own name was always what got thrown away — `3R PLANAR IK · PICK & …`
  at every width, 1440px included. Label shortened, hint now yields first. This was on the
  open list from the README entry below.
- **Voice:** `about_body_1` said "with a passion for", which PRODUCT.md forbids by name.
- Footer carries a `REV.` field; `Project` takes an optional `date`, format-checked.
- **P-01 now links** to the public MUJIN write-up repo, at the user's request. It was the
  only row with nowhere to go, so *no row exercises the link-less path any more* — the
  support is still there and still correct, but nothing on the page will catch you breaking
  it. Noted at the registry entry too.

**Why:** Requested. The full ranked review is in the conversation; this is what landed.

**Open:**
- **`Experience.jsx` is written but not wired.** `ROLES` is empty, the component returns
  null, nothing imports it. It needs employer, title, location and dates — facts, so they
  wait for the user. Wiring steps are in the file's own header comment, including the sheet
  renumber to evidence-first (experience 01, projects 02, about 03, contact 04), which the
  user has already approved.
- **The title block still spends a cell on `LANGUAGES: EN · 中文`**, duplicating the toggle
  40px away in the nav, while institution, graduation year, location and an availability
  *window* appear nowhere on the site. Highest-value pixels on the page; blocked on facts.
- **No project has a date yet.** The rail renders one the moment it exists. Until then it is
  a 2-column rail holding a 4-character label, which reads loose — that resolves with the
  data rather than needing a layout change, so don't "fix" it by narrowing the rail.
- **The figures undercut the work.** P-01 is a block diagram whose labels are unreadable at
  270px, P-02 an annotated slide, P-03 a raw KiCad canvas — all three carrying white grounds
  and foreign palettes onto the sheet. A photograph of the real hardware would land
  instantly. `docs/CONTENT.md` already says a photo beats a diagram; this is that rule going
  unenforced. Needs images from the user.
- **`about_body_2` disagrees with itself across languages** — EN "photography and running",
  ZH 摄影、徒步 (hiking). Left alone rather than guessed at. The EN also has no full stop.
- **Joint-angle labels can still land on a limb.** The offset is along the bisector, so a
  label only ever collides with a *different* joint's link; `drawAngles` tests candidates
  against other labels but not against the segments. Not attempted — the file was being
  edited concurrently (the two-mode work above), and a geometry change wanted a clean base.

## 2026-08-11 — Kinematic sketch: two modes with a handover between them

**Did:** The figure was one continuous thing that blended the pick-and-place cycle and the
pointer together. It is now two states with a deliberate handover, which is what it was
always trying to be.

`attract` still blends, but the cycle clock is gated on it
([KinematicSketch.jsx](../src/components/KinematicSketch.jsx)):

- above `CYCLE_REWIND` (0.97) the clock is wound back to zero,
- below `CYCLE_RESUME` (0.08) it runs,
- between them it is parked, and that band *is* the transition.

So letting go returns the arm to the program's first frame and starts the job from the
top, rather than dropping it into the middle of a move nobody watched it begin.

**The rewind threshold is the whole trick and it is worth not "simplifying".** The cycle
contributes `(1 - attract)` of the goal, so rewinding at 0.97 moves the blended goal by
**1.81px** on the frame it happens — measured, with a clock jump of 5.02s, against an
ordinary 5.6px step elsewhere in the same run. Rewinding when the pointer *arrives*, when
attract is still ~0, whips the arm across the figure instead.

It also gives brush-past behaviour for free: 0.25s of hover peaks at attract 0.65, never
rewinds, and resumes mid-cycle. Only a real interaction restarts the program.

`ATTRACT_TAU.release` 0.5 → 0.7s, so giving the arm back reads as the machine returning to
work rather than being dropped. Measured end to end: readout flips to MANUAL 0.15s after
the pointer arrives, the cycle rewinds at 0.83s; on release the readout returns to AUTO at
0.48s and the program starts at 1.77s. Worst joint movement per frame during the handover
in is 3.3px — *less* than the 4.3px the cycle itself uses.

Added an `Auto` / `Manual` readout to the footer (`hero_fig_mode_auto` / `_manual`). The
handover is already legible in the motion — the cell fades, the program stops — but naming
it in the vocabulary a machine would use is what tells a visitor the running arm was never
just a loop.

**Why:** Requested: normally an arm doing pick and place, smoothly; pointer in, smooth
transition to interactive; pointer away, smooth transition back and start the motion again
from the beginning.

**Open:**
- The mode readout is deliberately **not** an `aria-live` region: it only changes in
  response to a pointer, so announcing it reaches exactly the people who cannot have caused
  it.
- Driving the arm hard with the cursor still peaks at ~49px of joint movement per frame.
  That is the rate cap saturating through a posture flip, unchanged by this work, and is
  the same figure as before.
- The footer now carries three readouts. It fits at 320px, but a fourth would not.

## 2026-08-11 — Hosting: Cloudflare Workers, not Vercel

**Did:** Added [wrangler.jsonc](../wrangler.jsonc) and rewrote the deployment section of
[README.md](../README.md), which described a Vercel setup that was never built.

**Why:** The site is pure static — no router, no server code, no env vars — so every Vercel
differentiator (ISR, image optimization, Next.js support) is worth nothing here, and the
choice came down to limits and friction. Cloudflare wins on both: unlimited bandwidth
against Vercel Hobby's 100 GB, static asset requests that don't count against the free-plan
invocation cap, and no non-commercial clause to worry about on a page whose entire purpose
is getting hired. The domain is already on Cloudflare Registrar, so registrar, DNS, and host
collapse into one vendor — the old plan's grey-cloud DNS-only mode meant paying Cloudflare's
overhead for none of its benefit.

Deliberately **not** Cloudflare Pages: it is in maintenance mode, with its features being
folded into Workers, and Cloudflare directs new projects to Workers static assets.

Two config choices that look wrong at a glance and aren't, both commented in the file:
`not_found_handling` is `404-page` rather than the reflexive `single-page-application`,
because with no client-side router the SPA setting would answer every bogus URL with the
whole portfolio and a 200; and `workers_dev` is `false` so the custom domain is the only
live URL.

No new dependency — Cloudflare's build environment supplies wrangler, so nothing was added
to `package.json` to deploy this.

The domain is **yanyu-chen.com**, bound in `routes` as a `custom_domain` rather than clicked
into the dashboard, so the repo records where this deploys. Apex only — www is meant to be a
Redirect Rule to it, not a second binding, for the same reason `workers_dev` is off.

**Open:** Nothing in the repo is blocking. What remains is dashboard-side: connecting
`yammmyu/engineering-portfolio` under Workers so the first build runs, and adding the
www → apex Redirect Rule. The first deploy is what creates the DNS record and certificate.

`not_found_handling` points at a `public/404.html` that doesn't exist, so unmatched paths
currently get Cloudflare's default 404. A styled one needs its own en/zh strings and is a
content decision, not a deploy fix.

Unrelated to hosting but found while auditing what the page loads: [index.html](../index.html)
pulls three font families from `fonts.googleapis.com` via a render-blocking stylesheet. It
is the only third-party runtime dependency on a page that otherwise ships ~60 kB and no
external calls, and `fonts.googleapis.com` is blocked in mainland China — a real cost given
how much of the audience [PRODUCT.md](PRODUCT.md) says reads Chinese. Self-hosting the fonts
would fix both. Descoped for now at the user's direction.

## 2026-08-05 — Kinematic sketch: slower cycle

**Did:** Retimed the pick-and-place cycle to 1.7× its original length — 4.66s → 7.9s — via
a single `PACE` constant in [pickPlace.js](../src/lib/pickPlace.js). The segment times
there are the *proportions* of the program, how a move weighs against a dwell; `PACE` is
the one dial for the speed of the whole thing, so retiming can't reshape it.

`TRAIL_MAX` went 64 → 104 frames with it. The trail is a duration, not a distance, so at
the slower pace the same 64 frames drew a much shorter stub of the path the arm is working.
It now covers ~1.7s, about a fifth of a cycle.

Re-measured, since the `JOINT_RATE` comment quotes the cycle's peak: peak joint speed
**350°/s → 205°/s**, so the 450°/s cap has more headroom than before and still never bites
the program. Worst joint movement per frame in the cycle 7.1px → 4.3px. Tip still tracks
its path to 0.25px, zero limit or link-length violations, no self-collision during the
cycle. Pointer-driven behaviour is untouched by design.

**Why:** Requested — the motion read as too quick.

**Open:** Only the idle cycle slowed. The pointer's own follow constant
(`TARGET_TAU.active`, 0.07s) is deliberately still quick: lag there reads as the figure
being unresponsive rather than as the arm being deliberate. If the hand-driven motion also
wants calming, that is the knob, and a different judgement call.

## 2026-08-05 — README split: showcase vs. maintenance

**Did:** The `proj_portfolio` row links to this repo, so the README is the landing page a
recruiter hits — but it was written as a maintenance manual. Split it:

- **README.md** is now reader-facing. Leads with what the site is, then the two things worth
  a stranger's attention: the hero being a real solver, and the drawing-set metaphor being
  structural. The IK writeup stays — it is the strongest evidence in the repo — but sits in
  `<details>` so the page skims in thirty seconds and still rewards opening.
- **docs/CONTENT.md** is new and takes the procedures: adding a project, rows with no link,
  project images, tags, and the repo tree. Plus a table for the content that lives outside
  the projects list (title block, skills BOM, contact links) which was previously nowhere.
- Screenshots at `docs/img/hero-{light,dark}.png`, captured from the production build in
  headless Chrome at 2× and downscaled to 1400px. The pair doubles as evidence for the token
  system — same markup, no `dark:` variant anywhere.

Fixed the cross-references this broke: AGENTS.md pointed at `README.md#adding-a-project`,
PRODUCT.md at `README.md#the-hero-sketch`. Both anchors were gone. There is now a link
checker step in the method below — every internal doc link and anchor resolves as of this
entry.

**Why:** Requested. The README functions as part of the portfolio, not just as docs for
whoever maintains it.

**Open:**
- **The live URL is a `TODO` at the top of the README.** It is not recorded anywhere in the
  repo and not in either résumé PDF (only LinkedIn is), so it could not be filled in.
- The figure caption truncates at 1440px wide: `FIG. 01 · 3R PLANAR IK · PICK & …`. The
  `.label` is `truncate` and the hint next to it is `shrink-0`, so the title loses. Visible
  in `docs/img/hero-light.png`. Either shorten the label or let the hint drop first.
- Screenshots are of the hero only. Headless Chrome would not scroll to `#projects` —
  neither the hash nor a scripted `scrollIntoView` took, and a tall viewport just stretches
  the `min-h-[100svh]` hero. A projects-section shot would be worth having; it needs real
  CDP rather than `--screenshot`.
- The screenshots will drift as the site changes. Worth regenerating whenever the hero or
  the palette moves.

## 2026-08-05 — Kinematic sketch: joint limits, rate limiting, pick-and-place

**Did:** Two asks — make the arm hold poses a real one could, and give it a job instead of
a wander.

**Poses.** FABRIK was already a real iterative IK; what it had no model of was a machine.
Added to [ik.js](../src/lib/ik.js): per-joint angular limits (±90° shoulder from its
support, ±150° elbow, ±135° wrist), applied in **both** passes via `walkOut`/`walkIn`, and
`limitJointRate`. Three things I got wrong on the way, all recorded in comments where they
bite:

- Constraining only the forward pass. Looks equivalent — the forward pass is what gets
  drawn — but the backward pass then proposes headings that are clipped rather than
  followed, the outer joints saturate on their stops, and the tip stalls up to 93px short
  before snapping to a mirrored pose.
- Reading each pass's headings up front instead of deriving them from the joint just
  placed. That silently costs the pass its entire corrective effect (392px snaps).
- Rate-limiting by feeding the capped pose back to the solver. It re-solves from a halfway
  pose belonging to neither posture, changes its mind, and oscillates 141px short of a
  reachable target. Command and actual are now separate poses: the solver works from its
  own last answer and converges exactly (0.25px settled, same as unconstrained), and the
  drawn arm chases it.

The rate limit is the load-bearing idea and I didn't expect it to be. Joint limits *cut the
configuration space up*, and where a cut runs between two postures there is no continuous
path — a local solver arrives at the far one in one frame, and no amount of iteration or
limit-loosening changes that (±170° limits snap exactly as hard as ±150°). A joint with a
top speed can't. Pointer sweep across the workspace: **163px of joint movement in one frame
→ 20px**, and 20px *is* the cap. Self-intersecting poses **14% of frames → 8%**. Zero limit
or link-length violations anywhere.

**The cycle.** New [pickPlace.js](../src/lib/pickPlace.js) — keyframed, pure, smoothstep
per segment so every move starts and ends at rest. Two station pads, `ST 01`/`ST 02`, and a
part that is carried between them; the whole cell fades out as the pointer takes over, and
the cycle clock runs down with it so the program is paused rather than abandoned.

**Why:** Requested: "the arm can sometimes be in a very weird position that actual robot
arms would not have", and a pick-and-place motion.

**Open:**
- **Traverses are swung about the base, not ruled straight.** A straight traverse asks the
  tip to hold constant height across the middle of the workspace, which is where the arm
  must fold up tight — it jammed on its stops and fell 54px short of its own path. Arcs are
  also what a revolute arm actually does. Don't "fix" this back to a straight line.
- Stations sit at 0.62 of reach, not the 0.56 first tried: closer in means more folding,
  and at 0.56 the tip stopped 14px short of the bench. Both numbers are measured, not
  guessed — [tune/limit sweeps in the scratchpad were the method](../src/lib/pickPlace.js).
- The arm still self-intersects in ~8% of pointer-driven frames. That is what the
  `Self-collision` readout is for, and it is half what it was, but link-collision limits
  would be the next step if it bothers anyone.
- `JOINT_RATE` is 450°/s against a cycle that peaks at 350°/s. Speed the cycle up much and
  the cap will start rate-limiting the program itself, which shows up as the tip missing
  the stations. *(Superseded — the cycle was retimed the same day and now peaks at 205°/s.
  See the entry above.)*

## 2026-08-05 — Projects: drone out, MUJIN humanoid in

**Did:** Replaced `proj_drone` (autonomous frontier-exploration drone) with `proj_humanoid`,
the MUJIN internship work: a diffusion policy on an AgiBot Genie G1 dual-arm humanoid that
picks a parcel, judges whether the shipping label is showing, flips it if not, and places it
label-up. Written from `documenation/` in the source repo (note the folder is spelled without
the second `t`) — the KNOWHOW handover doc and the PoC report.

It goes **first** in the list: by the ordering rule it is the most robotics-dense entry here.

It is also **the first row with no link at all** — the code is on MUJIN's internal GitLab,
which would 404 for any visitor. That turned out to need three changes beyond the entry
itself:

- `ProjectRow` gated its hover affordances on `primary`. The row wash and the `P-NN` nudge
  fired regardless, so a row with nothing to click still lit up on hover — the same broken
  promise as the corner-only link the comment above it describes, pointing the other way.
- `projects_subheading` said "Each row links to the repository", which stopped being true.
  Now "Most rows link to the repository".
- README gained a *Rows with no link* section, since this is now a supported state rather
  than an oversight.

Deliberately left out of the description: the internal GitLab URL, the policy server's IP,
and the safety-invariant internals. Kept the shape of the claim to what the PoC report itself
states.

**Why:** Requested. The humanoid work is the strongest robotics entry on the list and the
drone was the weaker of the two autonomy projects.

**Open:**
- **No figure yet** — `/projects/proj_humanoid.jpg` is referenced and missing, so the row
  renders text-only. The PoC report's cover photo (the robot orienting a parcel, embedded as
  `word/media/image1.jpg` in `Humanoid_PoC_Report.docx`) would suit it, but it is MUJIN
  material and wasn't copied in without a decision on clearance.
- If a shareable demo video or a public PDF of the PoC report exists, that would give the row
  a `demo` link and put the hover affordances back.
- The `~90%` task success / `~53%` first-grasp / `~12 s` cycle numbers are in the report over
  38 trials, which it flags as an uncontrolled experiment. Left out of the one-liner; worth
  reconsidering if the row ever gets a longer treatment.

**Caution for next time:** `translations.json` is hand-aligned. I rewrote it with `json.dump`
and blew away the formatting across the whole file — a 2-key change became a 235-line diff,
on top of uncommitted work that had no committed copy to fall back on. Recovered by
rebuilding from HEAD's bytes and re-applying only the semantic deltas, down to 55 lines. Rule
added to AGENTS.md; don't repeat it.

## 2026-08-05 — Kinematic sketch: fixed at three links, envelope jitter

**Did:** The joint stepper is gone; `LINK_RATIOS` is three long and `JOINT_COUNT` derives
from it. The footer states the count as a figure of the drawing rather than offering it as
a control, and `hero_fig_add_joint` / `hero_fig_remove_joint` are out of translations.json.
The `groundLevel` guard for two-link chains went with it — the note about why a two-link
arm must not get it is kept where the constraint is passed, since that is the thing a
future shortening of the chain would break.

Fixed the jitter outside the reach envelope. `clampTarget` was pulling an out-of-range goal
onto the envelope, which puts it exactly where the only solution is the fully straight arm
— and full stretch is a singularity: the far joint can sit ~5° off straight while moving
the tip only 0.25px, which is `solveFabrik`'s tolerance. So it stopped a different few
degrees short each frame and the outer joint sawtoothed over ~6° the whole time the pointer
was outside. `clampTarget`'s outer limit is now optional and the caller passes only the
inner one, so an out-of-range goal takes solveFabrik's exact straight-line branch. Measured
over a sweep outside the envelope: θ3 worst frame-to-frame 6.07° → 0.00°, and the tip still
lands exactly on the drawn envelope, because the chain sums to `maxReach`.

**Why:** Reported as "very jittery when my cursor is outside that half circle, especially
j3". The inner clamp stays — inside `minReach` there is no pose at all and FABRIK flails.

**Open:** Crossing the envelope *inward* the wrist unfolds ~30° in a few frames. That is
the singularity itself (dθ/ds is unbounded at full stretch), not the tolerance bug: it is
monotonic, not oscillating, and it is left alone deliberately. Tightening `tolerance` to
0.02 was tried and rejected — it only removed 0.06° of reversal in a thin band just inside
the envelope, invisible, for more iterations per frame.

## 2026-08-05 — Kinematic sketch: angle dead zone, pointer handover

**Did:** Three motion defects in [KinematicSketch.jsx](../src/components/KinematicSketch.jsx).

The angle arc strobed across its own limb at 180°. `jointSweep` returns (-π, π], so a
straight joint reports +180° or -180° on solver noise alone, and that sign picks the side
the arc sweeps and the side the label sits on — and the label's bisector is degenerate
there too, so it swung a full 180° as the joint crossed over. Added `stableSweepSign` in
[ik.js](../src/lib/ik.js): a 6° dead zone around straight inside which the previous side is
held. Inside it the label falls back to the limb's normal on the latched side, which is
what the bisector converges to on either approach — checked in node, they agree to 0.01 at
178.9°, so the swap is invisible.

The goal no longer *switches* between the pointer and the idle sweep at the canvas edge;
it's a blend weighted by an eased `attract` (0.22s taking hold, 0.5s letting go), and
`TARGET_TAU` interpolates with it so responsiveness doesn't step partway through. The
pointer's last position is kept after it leaves, so the arm eases out of where the cursor
was. Dropped the trail-clear on leave — nothing jumps now, and blanking it was the most
visible part of leaving.

Pointer capture on pointerdown, so a held drag past the edge keeps the arm reaching for the
cursor instead of ending the gesture mid-stroke with the button still down. The envelope
stops it, not the canvas border.

Also switched the idle orbit from wall-clock `elapsed` to a per-frame accumulated
`idlePhase`. The loop pauses off-screen and in a hidden tab, but the clock didn't, so
coming back teleported the orbit — a latent version of the same jump.

**Why:** All three read as the figure snapping rather than moving. Reported by the user as
"it launches itself back" and "jittery angle indicator".

**Open:** `ATTRACT_TAU` values are judged, not measured — if the handover feels sluggish on
the way in, `grab` is the knob. The dead zone is fixed at 6°; a much longer link chain
could want it wider, since the same angular noise moves the tip further.

## 2026-08-05 — Agent scaffolding

**Did:** Added [AGENTS.md](../AGENTS.md) (conventions, architecture, styling, motion, i18n,
a11y, working agreements), [docs/PRODUCT.md](PRODUCT.md) (audience, the drawing-set
through-line, invariants, voice), this journal, and `CLAUDE.md` importing AGENTS.md so
Claude Code picks it up automatically.

Added `npm run check` ([scripts/check.mjs](../scripts/check.mjs)), which enforces the
mechanical half of AGENTS.md: both languages on every translation key, project id →
`_title`/`_desc` pairing, no duplicate ids, tags registered in `TAG_LABEL_KEYS` and
translated, orphan keys, every `t('...')` call site resolving, no literal hex outside
`index.css` and the canvas palette, and no Tailwind opacity modifiers on token colours
(the `bg-paper/50` footgun). Missing project images warn rather than fail, since the
graceful fallback in `ProjectFigure` is by design.

Also promoted `.claude/settings.local.json` to a shared `.claude/settings.json` so agents
don't get prompted for `npm run check` / `build` / `dev`, and gitignored the local file.

Fixed one real defect: the `proj_portfolio` row linked to
`github.com/yanyuc/engineering-portfolio`, which 404s. The account is `yammmyu`; corrected
and verified 200.

**Why:** The codebase is unusually well-reasoned — nearly every non-obvious line carries a
comment explaining what was tried and why it was rejected — but none of that was written
down as rules, so a future agent could plausibly "tidy up" the comments or add a rounded
card and quietly destroy the thing that makes it good. Docs alone drift, hence the check
script.

**Open:**
- **Two more project links 404 and may be private repos — needs the user to confirm:**
  `yanyuc/robotic-arm` (`proj_arm`) and `nusrobomaster-comp/PCB27` (`proj_pcb`). Not
  guessed at, since neither has an obvious correct target. If they are private, the rows
  currently link readers to a 404.
- Five project images are referenced but don't exist yet: `proj_drone`, `proj_slam`,
  `proj_aimbot`, `proj_controller`, `proj_arm`. Rows fall back to the text-only layout, so
  this is not broken — but those are five of the eight rows without a figure.
- `public/projects/` is untracked in git, and there were uncommitted edits across ten files
  when this session started. Left alone; the user drives git.
- `Contact.jsx` links `github.com/yammmyu`, and `resume-en.pdf` / `resume-zh.pdf` are
  served from `public/` — worth a periodic check that the résumés are current.
