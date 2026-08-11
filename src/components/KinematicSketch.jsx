import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../context/LanguageContext.jsx'
import {
  vec,
  resolveIk,
  solveFabrik,
  clampTarget,
  jointSweep,
  jointPositions,
  hasSelfCollision,
  minimumReach,
  stableSweepSign,
  limitJointRate,
} from '../lib/ik.js'
import { pickPlaceCycle } from '../lib/pickPlace.js'

const MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace'
// Frames of tip history, so this is a duration and not a distance. It went up
// with the cycle's pace: the trail is there to show the path the arm is
// working, and at a slower speed the same 64 frames drew a much shorter stub
// of it.
const TRAIL_MAX = 104

// The goal is eased; the pose is not. FABRIK already moves incrementally from
// wherever the arm is, so easing the joints on top of it only fights the
// solver. A time constant — the time to close ~63% of the gap — rather than a
// fraction per frame, so the arm moves at the same rate at 60Hz and 120Hz.
//
// The idle constant came down from 0.14 when the idle motion became a program
// rather than a wander: the lag now rounds the corners of a path that was drawn
// square, which is what a controller blending between waypoints does anyway,
// but much more of it and the arm stops visibly reaching the stations.
const TARGET_TAU = { active: 0.07, idle: 0.1 }
// How firmly the pointer holds the arm, 0 to 1, and the time constants of it
// building and letting go. The goal used to *switch* between the pointer and
// the idle motion the instant the cursor crossed the figure's edge: it snapped
// to the cursor on the way in, and on the way out it threw the arm at whatever
// phase the idle motion happened to have reached. The goal is now a blend of
// the two, so the pointer attracts the arm rather than seizing it.
//
// Letting go takes noticeably longer than taking hold. Taking hold wants to
// feel answered; giving back wants to read as the machine returning to work of
// its own accord, which is a slower gesture than a person's.
const ATTRACT_TAU = { grab: 0.24, release: 0.7 }

// The two ends of the handover, in units of `attract`.
//
// Above REWIND the pointer plainly has the arm, so the cycle is wound back to
// its first frame — letting go then starts the job from the top rather than
// dropping the arm into the middle of a move nobody watched it begin. Waiting
// this long is what makes the rewind invisible: the cycle contributes
// (1 - attract) of the goal, so at 0.97 winding it right across the workspace
// shifts the blended goal by a couple of pixels. Rewinding on the first frame
// of the hover instead whips the arm across the figure.
//
// Below RESUME the arm is its own again and the program runs. Between the two
// the clock is parked, which is the whole of the transition: on the way in the
// arm leaves its work where it stands, on the way out it eases back to the
// first frame and waits there until it is properly handed back.
//
// A brush past the figure never reaches REWIND, so it resumes mid-cycle rather
// than restarting. That is the right behaviour for a cursor that was on its way
// somewhere else.
const CYCLE_REWIND = 0.97
const CYCLE_RESUME = 0.08
// Above this the readout says the arm is being driven by hand. It only names
// which side of the handover we are on, so anywhere mid-blend will do.
const MANUAL_AT = 0.5

// Joint limits: how far each joint may turn the chain, measured from the
// support at the base and from the previous link after that. Without them
// FABRIK will happily fold a link back through the one before it or lay the arm
// down through its own mount — legal for a chain of line segments, and not for
// anything with a motor at each joint. The shoulder's ±90° is the bench: the
// first link never points below the horizontal it is mounted on.
const JOINT_LIMITS = [
  [-90, 90], // shoulder, from the support
  [-150, 150], // elbow
  [-135, 135], // wrist
].map(([lo, hi]) => [(lo * Math.PI) / 180, (hi * Math.PI) / 180])

// Top speed of a joint, radians per second. The stops alone are not enough:
// they cut the configuration space up, and where a cut runs between two
// postures the arm has to change from one to the other with nothing in
// between — a local solver gets there in a single frame, and it read as the
// arm teleporting. A joint with a top speed cannot, so the flip becomes a fast
// swing instead. Measured on a pointer sweep: 163px of joint movement in one
// frame without this, 16px with it — and 16px is the cap itself, which is to
// say the arm is moving rather than jumping.
//
// The pick-and-place cycle peaks at 205°/s, so 450 sits well clear of it: the
// program is never rate-limited, only the flips are. Speed the cycle back up
// and check that headroom is still there — the cap biting the program shows up
// as the tip missing the stations rather than as anything that looks like a
// speed limit.
const JOINT_RATE = (450 * Math.PI) / 180
// Half-width of the dead zone around a straight joint, inside which the angle
// arc keeps whichever side of the limb it is already on. See `stableSweepSign`.
const STRAIGHT_DEADZONE = (6 * Math.PI) / 180
// A backgrounded tab resumes with a huge delta; cap it so the arm eases back
// in rather than teleporting.
const MAX_FRAME = 0.064
// How far below the base joint the hatched support is drawn. FABRIK holds the
// joints above it as a positional constraint, which cannot flip the arm the way
// a branch preference could.
const SUPPORT_OFFSET = 14

// Ring sizes: a heavier one at the fixed base, the end effector's accent dot at
// the tip. Links stop this far clear of them — the ring's own 1.5px stroke is
// centred on the radius, so trimming to the radius alone would still leave the
// link overlapping its inner half and merging with it.
const JOINT_R = { base: 6, middle: 5, tip: 4.5 }
const JOINT_CLEARANCE = 1.25
// Side of the part the arm carries. Big enough to read as a component at a
// glance, small enough that the end effector's accent dot still shows through
// the middle of it while it is gripped.
const PART = 11
const jointRadius = (i, count) =>
  i === 0 ? JOINT_R.base : i === count - 1 ? JOINT_R.tip : JOINT_R.middle

// Link length ratios, and with them the joint count — the arm is a fixed
// three-link chain. These are the first three links of the [70, 50, 60, 40]
// chain from the Math IA, normalised against the first.
const LINK_RATIOS = [1, 0.72, 0.86]
const JOINT_COUNT = LINK_RATIOS.length

/**
 * A three-link planar arm solving inverse kinematics toward the pointer, drawn
 * as a CAD sketch: reach envelope, hatched ground support, per-joint angles,
 * and a dimension callout on the end effector.
 */
export default function KinematicSketch() {
  const t = useTranslation()
  const canvasRef = useRef(null)
  // What the solver believes, and what is drawn chasing it — see JOINT_RATE.
  const poseRef = useRef(null)
  const shownRef = useRef(null)
  const [collision, setCollision] = useState(false)
  // Which side of the handover the arm is on — see MANUAL_AT.
  const [manual, setManual] = useState(false)
  const [reach, setReach] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

    let width = 0
    let height = 0
    let raf = 0

    const pointer = { x: 0, y: 0, active: false }
    const trail = []
    let dragging = false
    let onScreen = true
    let lastCollision = null
    let lastManual = null
    let lastReach = null
    let lastFrame = 0
    // The eased goal the arm actually chases.
    let smoothTarget = null
    // How much of the goal the pointer currently owns, and how far into its
    // pick-and-place cycle the arm is. Both survive the pointer leaving and
    // coming back.
    let attract = 0
    // Accumulated per frame rather than read off the wall clock, so a figure
    // that was scrolled past or a tab left in the background picks up where it
    // stopped instead of somewhere else entirely.
    let cycleClock = 0
    // Latched arc side per joint, indexed like `points`. See STRAIGHT_DEADZONE.
    const jointSides = []

    const palette = {
      ink: '#15181a',
      ink3: '#7b827c',
      rule: '#cfd2ca',
      accent: '#e0a80b',
      surface: '#f4f5f1',
    }

    function readPalette() {
      const cs = getComputedStyle(document.documentElement)
      const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback
      palette.ink = get('--c-ink', palette.ink)
      palette.ink3 = get('--c-ink-3', palette.ink3)
      palette.rule = get('--c-rule', palette.rule)
      palette.accent = get('--c-accent', palette.accent)
      palette.surface = get('--c-surface', palette.surface)
    }

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    /** Link lengths scaled so the arm reaches the same distance at any size. */
    function geometry() {
      const total = LINK_RATIOS.reduce((s, r) => s + r, 0)
      const target = Math.min(width, height) * 0.6
      const chain = LINK_RATIOS.map(r => (r / total) * target)

      return {
        bx: width * 0.46,
        by: height * 0.82,
        chain,
        maxReach: target,
        minReach: minimumReach(chain),
      }
    }

    /** Canvas position of a point in math coords, relative to the base. */
    function toCanvas(g, p) {
      return vec(g.bx + p.x, g.by - p.y)
    }

    function hairline(color, dash) {
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.setLineDash(dash || [])
    }

    function drawEnvelope(g) {
      hairline(palette.rule, [2, 4])
      ctx.beginPath()
      ctx.arc(g.bx, g.by, g.maxReach, 0, Math.PI * 2)
      ctx.stroke()
      if (g.minReach > 2) {
        ctx.beginPath()
        ctx.arc(g.bx, g.by, g.minReach, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    function drawGround(g) {
      const y = g.by + SUPPORT_OFFSET
      hairline(palette.ink3)
      ctx.beginPath()
      ctx.moveTo(g.bx - 40, y)
      ctx.lineTo(g.bx + 40, y)
      ctx.moveTo(g.bx, g.by)
      ctx.lineTo(g.bx, y)
      ctx.stroke()

      ctx.beginPath()
      for (let x = g.bx - 36; x <= g.bx + 36; x += 9) {
        ctx.moveTo(x, y)
        ctx.lineTo(x - 7, y + 7)
      }
      ctx.stroke()
    }

    /**
     * The two stations and the part moving between them. Drawn under the arm
     * and faded out by `fade` as the pointer takes over — the cycle is what the
     * arm does when it is left alone, so the cell has no business sitting there
     * while someone is driving it by hand.
     */
    function drawCell(g, cycle, tip, fade) {
      if (fade <= 0.01) return
      ctx.globalAlpha = fade

      ctx.font = MONO
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const stations = [cycle.pick, cycle.place]
      for (let i = 0; i < stations.length; i++) {
        const s = toCanvas(g, stations[i])
        // A bench pad: the part sits on top of it, so its face is the station
        // point rather than being centred on it.
        hairline(palette.rule)
        ctx.strokeRect(s.x - 17, s.y + PART / 2, 34, 5)
        ctx.fillStyle = palette.ink3
        ctx.fillText(`ST 0${i + 1}`, s.x, s.y + PART / 2 + 17)
      }

      // The part. Square corners and a hairline, like everything else on the
      // sheet — it is a component on a drawing, not a game object.
      //
      // While it is gripped it rides the real end effector, not the position
      // the cycle asked for. The tip trails its programmed path by up to 27px
      // mid-traverse — the eased goal plus the solver working incrementally —
      // and a part pinned to the program floated that far off the gripper.
      if (cycle.part.alpha > 0.01) {
        const p = cycle.holding ? tip : toCanvas(g, cycle.part)
        ctx.globalAlpha = fade * cycle.part.alpha
        ctx.fillStyle = palette.surface
        ctx.fillRect(p.x - PART / 2, p.y - PART / 2, PART, PART)
        hairline(palette.ink)
        ctx.lineWidth = 1.5
        ctx.strokeRect(p.x - PART / 2, p.y - PART / 2, PART, PART)
      }

      ctx.globalAlpha = 1
    }

    function drawTrail() {
      if (trail.length < 2) return
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.strokeStyle = palette.accent
      for (let i = 1; i < trail.length; i++) {
        ctx.globalAlpha = (i / trail.length) * 0.5
        ctx.beginPath()
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
        ctx.lineTo(trail[i].x, trail[i].y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    /**
     * The included angle at each joint — the angle between the two limbs
     * meeting there, so a straight joint reads 180° and a folded one nears 0°.
     * At the base the second limb is the fixed support, marked by the dashed
     * reference line along it.
     *
     * Everything here is canvas space. Deriving one arm of the angle from the
     * math-space link vectors and the other from screen positions mirrors one
     * of them, which swept the arc between the wrong two directions.
     */
    function drawAngles(points) {
      ctx.font = MONO
      ctx.fillStyle = palette.ink3
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const placed = []

      for (let i = 0; i < points.length - 1; i++) {
        const p = points[i]
        const next = points[i + 1]

        const fwdLen = Math.hypot(next.x - p.x, next.y - p.y) || 1e-9
        const fwd = vec((next.x - p.x) / fwdLen, (next.y - p.y) / fwdLen)

        // The other arm: back along the previous limb, or the support at the base.
        let back = vec(1, 0)
        let backLen = Infinity
        if (i > 0) {
          const prev = points[i - 1]
          backLen = Math.hypot(prev.x - p.x, prev.y - p.y) || 1e-9
          back = vec((prev.x - p.x) / backLen, (prev.y - p.y) / backLen)
        }

        const from = Math.atan2(back.y, back.x)
        const raw = jointSweep(vec(p.x + back.x, p.y + back.y), p, next)
        const degrees = Math.round(Math.abs(raw) * (180 / Math.PI))
        const radius = Math.min(16, Math.min(fwdLen, backLen) * 0.42)

        // A joint within the dead zone of straight is one the solver can push
        // either side of between frames, and the sweep's sign — which is the
        // side the arc and its label are drawn on — goes with it. Held to the
        // side it is already on, a joint passing through 180° stays put instead
        // of strobing across its own limb.
        const straight = Math.PI - Math.abs(raw) < STRAIGHT_DEADZONE
        const side = stableSweepSign(raw, jointSides[i], STRAIGHT_DEADZONE)
        jointSides[i] = side
        const sweep = Math.abs(raw) * side

        if (i === 0) {
          hairline(palette.rule, [2, 3])
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + 30, p.y)
          ctx.stroke()
          ctx.setLineDash([])
        }

        hairline(palette.ink3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, radius, from, from + sweep, sweep < 0)
        ctx.stroke()

        // Label sits outside the wedge, along the bisector, so it never lands
        // on top of either limb.
        let ox
        let oy
        if (straight) {
          // The bisector of a straight joint is the sum of two nearly opposite
          // unit vectors: almost no length, and a direction that swings a full
          // 180° as the joint crosses over. Inside the dead zone it is the
          // limb's normal instead, on the side the arc has been latched to,
          // which is what the bisector converges to on either approach.
          ox = -back.y * side
          oy = back.x * side
        } else {
          const bx = back.x + fwd.x
          const by = back.y + fwd.y
          const m = Math.hypot(bx, by) || 1e-9
          ox = bx / m
          oy = by / m
        }
        const offset = radius + 15
        const lx = p.x - ox * offset
        // The base sits on the hatched support, so keep its label above it.
        let ly = p.y - oy * offset
        if (i === 0 && ly > p.y) ly = p.y - (ly - p.y)

        // A folded arm bunches its joints together; drop any label that would
        // land on one already drawn rather than overprinting.
        const clear = placed.every(q => Math.hypot(q.x - lx, q.y - ly) > 40)
        if (i === 0 || clear) {
          ctx.fillText(`θ${i + 1} ${degrees}°`, lx, ly)
          placed.push(vec(lx, ly))
        }
      }
    }

    function drawJoint(x, y, r) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = palette.surface
      ctx.fill()
      hairline(palette.ink)
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    function drawCallout(g, tip) {
      hairline(palette.accent, [2, 4])
      ctx.beginPath()
      ctx.moveTo(tip.x, tip.y)
      ctx.lineTo(tip.x, 10)
      ctx.moveTo(tip.x, tip.y)
      ctx.lineTo(width - 10, tip.y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.font = MONO
      ctx.fillStyle = palette.ink3
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(`X ${Math.round(tip.x - g.bx)}`, tip.x + 6, 12)
      ctx.textAlign = 'right'
      ctx.fillText(`Y ${Math.round(g.by - tip.y)}`, width - 12, tip.y - 10)

      ctx.beginPath()
      ctx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = palette.accent
      ctx.fill()
    }

    function render(dt, immediate = false) {
      const g = geometry()

      // How much of the goal the pointer owns, eased. Letting go takes longer
      // than taking hold, so the arm is quick to answer the cursor and drifts
      // out of the gesture rather than being dropped by it.
      const held = pointer.active ? 1 : 0
      if (immediate) {
        attract = held
      } else {
        const k = 1 - Math.exp(-dt / (held ? ATTRACT_TAU.grab : ATTRACT_TAU.release))
        attract += (held - attract) * k
      }

      // The program only runs while the arm is its own. See CYCLE_REWIND.
      if (attract > CYCLE_REWIND) cycleClock = 0
      else if (attract < CYCLE_RESUME) cycleClock += dt
      const cycle = pickPlaceCycle(cycleClock, g.maxReach)

      // Target in math coords, relative to the base. The pointer's goal is held
      // at or above the base's own height — the arm is mounted on a support,
      // and the shoulder's stop means it could not reach under itself anyway.
      //
      // The cycle and the pointer are blended by `attract` rather than one
      // replacing the other, so crossing the figure's edge in either direction
      // hands the arm over across half a second instead of on one frame. The
      // pointer's last position is deliberately kept after it leaves: the arm
      // eases out of where the cursor was, not out of nowhere.
      const aim = vec(pointer.x - g.bx, Math.max(g.by - pointer.y, 0))
      const raw = vec(
        cycle.target.x + (aim.x - cycle.target.x) * attract,
        cycle.target.y + (aim.y - cycle.target.y) * attract,
      )

      // Ease the goal itself, so pointer sampling noise never reaches the
      // solver and a jump from pointer to idle sweep is carried, not cut. The
      // time constant follows the handover too — a step in responsiveness
      // partway through the blend would undo it.
      if (!smoothTarget || immediate) {
        smoothTarget = vec(raw.x, raw.y)
      } else {
        const tau = TARGET_TAU.idle + (TARGET_TAU.active - TARGET_TAU.idle) * attract
        const a = 1 - Math.exp(-dt / tau)
        smoothTarget.x += (raw.x - smoothTarget.x) * a
        smoothTarget.y += (raw.y - smoothTarget.y) * a
      }

      // Only the inner limit. An out-of-range goal is left out of range on
      // purpose, so the solver straightens the arm at it exactly rather than
      // iterating against the envelope — see clampTarget.
      const goal = clampTarget(smoothTarget, g.minReach)

      // Cold start only — the IA's solver hands FABRIK a sensible elbow-up pose
      // to begin from. After that the arm always solves from where it already is.
      let solved = poseRef.current
      if (!solved || solved.length !== g.chain.length + 1) {
        solved = jointPositions(resolveIk(g.chain, goal, g.maxReach), vec(0, 0))
        shownRef.current = null
        trail.length = 0
      }

      solved = solveFabrik(g.chain, goal, solved, {
        limits: JOINT_LIMITS,
        // The shoulder's limit is measured from the support it is mounted on.
        baseHeading: Math.PI / 2,
        // A preference, expressed in the backward pass, for keeping the middle
        // joints up out of the mount. The stops are what make the pose legal;
        // this only decides which legal pose it settles into.
        groundLevel: -SUPPORT_OFFSET,
        iterations: immediate ? 30 : 10,
      })
      poseRef.current = solved

      // Command and actual, kept apart. The solver always works from its own
      // last answer, so it converges exactly as it would with no rate cap at
      // all; what is drawn is a second pose chasing it at the speed a joint can
      // actually turn. The static frame is a destination rather than a move, so
      // it lands on the solver's answer directly.
      let pose = solved
      if (!immediate && shownRef.current) {
        pose = limitJointRate(shownRef.current, solved, g.chain, JOINT_RATE * dt, {
          limits: JOINT_LIMITS,
          baseHeading: Math.PI / 2,
        })
      }
      shownRef.current = pose

      const mathPoints = pose
      const points = pose.map(p => toCanvas(g, p))
      const tip = points[points.length - 1]

      trail.push(vec(tip.x, tip.y))
      if (trail.length > TRAIL_MAX) trail.shift()

      ctx.clearRect(0, 0, width, height)
      drawEnvelope(g)
      drawGround(g)
      drawCell(g, cycle, tip, 1 - attract)
      drawTrail()
      drawAngles(points)

      // Each link is its own segment, trimmed back to the edge of the rings it
      // connects. Drawn as one polyline the 3px line crosses the 1.5px ring and
      // merges with it, which leaves the circles looking lopsided, and a sharp
      // fold blobs the join outside the ring entirely.
      ctx.setLineDash([])
      ctx.lineCap = 'butt'
      ctx.strokeStyle = palette.ink
      ctx.lineWidth = 3
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]
        const b = points[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy)
        const rA = jointRadius(i, points.length) + JOINT_CLEARANCE
        const rB = jointRadius(i + 1, points.length) + JOINT_CLEARANCE
        if (d <= rA + rB + 1) continue
        ctx.beginPath()
        ctx.moveTo(a.x + (dx / d) * rA, a.y + (dy / d) * rA)
        ctx.lineTo(b.x - (dx / d) * rB, b.y - (dy / d) * rB)
        ctx.stroke()
      }

      for (let i = 0; i < points.length - 1; i++) {
        drawJoint(points[i].x, points[i].y, jointRadius(i, points.length))
      }
      drawCallout(g, tip)

      // Push to the readout only when a value actually changes.
      const colliding = hasSelfCollision(mathPoints)
      if (colliding !== lastCollision) {
        lastCollision = colliding
        setCollision(colliding)
      }
      const driven = attract > MANUAL_AT
      if (driven !== lastManual) {
        lastManual = driven
        setManual(driven)
      }
      const r = Math.round(g.maxReach)
      if (r !== lastReach) {
        lastReach = r
        setReach(r)
      }
    }

    function frame(now) {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, MAX_FRAME) : 1 / 60
      lastFrame = now
      render(dt)
      raf = requestAnimationFrame(frame)
    }

    /**
     * The loop only runs while the figure is on screen and the tab is visible.
     * It solved IK and repainted at 60Hz behind three screenfuls of text
     * otherwise. `lastFrame` is cleared so resuming eases in rather than
     * catching up on the whole gap.
     */
    function setRunning(run) {
      if (run && !raf) {
        lastFrame = 0
        raf = requestAnimationFrame(frame)
      } else if (!run && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    function sync() {
      setRunning(onScreen && !document.hidden)
    }

    function track(e) {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }

    function onPointerMove(e) {
      // A finger resting mid-scroll shouldn't grab the arm — on touch the
      // pointer only drives once it has been put down deliberately.
      if (e.pointerType === 'touch' && !dragging) return
      track(e)
    }

    // touch-action on the canvas is pan-y, so the browser keeps vertical
    // scrolling and hands us the horizontal drag. Both gestures are live from
    // the first move; neither has to wait for the other to be ruled out.
    //
    // Capturing the pointer keeps the moves coming once it is outside the
    // figure. Dragging past the edge used to end the gesture mid-stroke, with
    // the button still down and the arm already on its way back to the idle
    // sweep; now it keeps reaching for the cursor, and the envelope — not the
    // canvas border — is what stops it.
    function onPointerDown(e) {
      dragging = true
      canvas.setPointerCapture?.(e.pointerId)
      track(e)
    }

    // Capture is released implicitly here, so there is nothing to undo. Any
    // pointerleave held back during the drag arrives right after this.
    function onPointerUp() {
      dragging = false
    }

    function onPointerLeave() {
      if (dragging) return
      // Only the flag is dropped. The last position stays, and `attract` fades
      // the arm out of it — see render(). The trail is no longer cleared
      // either: with nothing left that jumps, there is no discontinuity for it
      // to hide, and blanking it was itself the most visible part of leaving.
      pointer.active = false
    }

    function onThemeChange() {
      readPalette()
      if (reduceMotion.matches) render(0, true)
    }

    readPalette()
    resize()

    const ro = new ResizeObserver(() => {
      resize()
      if (reduceMotion.matches) render(0, true)
    })
    ro.observe(canvas)
    darkQuery.addEventListener('change', onThemeChange)

    let io = null

    if (reduceMotion.matches) {
      poseRef.current = null
      render(0, true)
    } else {
      canvas.addEventListener('pointermove', onPointerMove)
      canvas.addEventListener('pointerdown', onPointerDown)
      canvas.addEventListener('pointerup', onPointerUp)
      canvas.addEventListener('pointercancel', onPointerUp)
      canvas.addEventListener('pointerleave', onPointerLeave)
      document.addEventListener('visibilitychange', sync)

      io = new IntersectionObserver(
        ([entry]) => {
          onScreen = entry.isIntersecting
          sync()
        },
        { threshold: 0 },
      )
      io.observe(canvas)
      sync()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io?.disconnect()
      darkQuery.removeEventListener('change', onThemeChange)
      document.removeEventListener('visibilitychange', sync)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return (
    <figure className="border border-rule bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        {/* The title no longer truncates. It was the `truncate` element beside a
            `shrink-0` hint, so it was always the one that lost — the caption
            read `3R PLANAR IK · PICK & …` at every width including 1440px, and
            the figure's own name was the part being thrown away. The title is
            now short enough to fit whole, and the hint yields first if it
            isn't. */}
        <span className="label">{t('hero_fig_label')}</span>
        {/* The hint names the gesture the device actually has. It only ever
            said "move pointer", on a figure that until now ignored touch. */}
        <span className="label hidden min-w-0 truncate sm:block">{t('hero_fig_hint')}</span>
        <span className="label shrink-0 sm:hidden">{t('hero_fig_hint_touch')}</span>
      </figcaption>

      <div className="h-[300px] sm:h-[360px]">
        {/* pan-y leaves vertical scrolling to the browser and gives us the
            horizontal drag, so the arm is drivable on a phone without the
            figure becoming a scroll trap. */}
        <canvas
          ref={canvasRef}
          className="block h-full w-full touch-pan-y"
          aria-hidden="true"
        />
      </div>

      {/* The joint count used to be a stepper. The chain is fixed at three
          links now, so it reads as what it always was underneath: a figure of
          the drawing, stated in the title block next to the reach. */}
      <div className="flex items-center justify-between gap-3 border-t border-rule px-3 py-2">
        <span className="label">
          {t('hero_fig_joints')}{' '}
          <span className="text-ink">{String(JOINT_COUNT).padStart(2, '0')}</span>
        </span>

        {/* Which of the two things the arm is doing, in the vocabulary a
            machine would use for it. The handover is legible in the motion
            already — the cell fades, the program stops — but naming it is what
            tells a visitor the running arm was never just a loop. */}
        {/* Deliberately not a live region: it only ever changes in response to
            a pointer, so announcing it reaches exactly the people who cannot
            have caused it. */}
        <span className={`label ${manual ? 'text-ink' : ''}`}>
          {manual ? t('hero_fig_mode_manual') : t('hero_fig_mode_auto')}
        </span>

        <span className={`label ${collision ? 'text-accent' : ''}`}>
          {collision ? t('hero_fig_collision') : `R ${reach}`}
        </span>
      </div>
    </figure>
  )
}
