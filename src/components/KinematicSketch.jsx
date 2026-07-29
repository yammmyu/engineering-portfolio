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
} from '../lib/ik.js'

const MONO = '10px "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace'
const TRAIL_MAX = 64

// The goal is eased; the pose is not. FABRIK already moves incrementally from
// wherever the arm is, so easing the joints on top of it only fights the
// solver. A time constant — the time to close ~63% of the gap — rather than a
// fraction per frame, so the arm moves at the same rate at 60Hz and 120Hz.
const TARGET_TAU = { active: 0.07, idle: 0.14 }
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
const jointRadius = (i, count) =>
  i === 0 ? JOINT_R.base : i === count - 1 ? JOINT_R.tip : JOINT_R.middle
const MIN_JOINTS = 2
const MAX_JOINTS = 6
const DEFAULT_JOINTS = 4

// Link length ratios. The first four are the [70, 50, 60, 40] chain from the
// Math IA, normalised against the first link.
const LINK_RATIOS = [1, 0.72, 0.86, 0.57, 0.79, 0.64]

/**
 * An N-link planar arm solving inverse kinematics toward the pointer, drawn as
 * a CAD sketch: reach envelope, hatched ground support, per-joint angles, and a
 * dimension callout on the end effector. Joints can be added and removed.
 */
export default function KinematicSketch() {
  const t = useTranslation()
  const canvasRef = useRef(null)
  const poseRef = useRef(null)
  const [jointCount, setJointCount] = useState(DEFAULT_JOINTS)
  const [collision, setCollision] = useState(false)
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
    const startedAt = performance.now()

    const pointer = { x: 0, y: 0, active: false }
    const trail = []
    let lastCollision = null
    let lastReach = null
    let lastFrame = 0
    // The eased goal the arm actually chases.
    let smoothTarget = null

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

    /** Link lengths scaled so total reach is the same at any joint count. */
    function geometry() {
      const ratios = LINK_RATIOS.slice(0, jointCount)
      const total = ratios.reduce((s, r) => s + r, 0)
      const target = Math.min(width, height) * 0.6
      const chain = ratios.map(r => (r / total) * target)

      return {
        bx: width * 0.46,
        by: height * 0.82,
        chain,
        maxReach: target,
        minReach: minimumReach(chain),
      }
    }

    function idleTarget(elapsed, g) {
      const a = elapsed * 0.00055
      return vec(
        g.maxReach * 0.62 * Math.cos(a),
        g.maxReach * 0.42 + g.maxReach * 0.24 * Math.sin(a * 1.7),
      )
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
        const sweep = jointSweep(vec(p.x + back.x, p.y + back.y), p, next)
        const degrees = Math.round(Math.abs(sweep) * (180 / Math.PI))
        const radius = Math.min(16, Math.min(fwdLen, backLen) * 0.42)

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
        let ox = back.x + fwd.x
        let oy = back.y + fwd.y
        const m = Math.hypot(ox, oy)
        if (m < 1e-3) {
          ox = -fwd.y
          oy = fwd.x
        } else {
          ox /= m
          oy /= m
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

    function render(elapsed, dt, immediate = false) {
      const g = geometry()

      // Target in math coords, relative to the base. The arm is mounted on a
      // fixed support, so the goal is held at or above the ground plane rather
      // than letting the chain reach down through it.
      const raw = pointer.active
        ? vec(pointer.x - g.bx, Math.max(g.by - pointer.y, 0))
        : idleTarget(elapsed, g)

      // Ease the goal itself, so pointer sampling noise never reaches the
      // solver and a jump from pointer to idle sweep is carried, not cut.
      if (!smoothTarget || immediate) {
        smoothTarget = vec(raw.x, raw.y)
      } else {
        const a = 1 - Math.exp(-dt / (pointer.active ? TARGET_TAU.active : TARGET_TAU.idle))
        smoothTarget.x += (raw.x - smoothTarget.x) * a
        smoothTarget.y += (raw.y - smoothTarget.y) * a
      }

      const goal = clampTarget(smoothTarget, g.minReach, g.maxReach)

      // Cold start only — the IA's solver hands FABRIK a sensible elbow-up pose
      // to begin from. After that the arm always solves from where it already is.
      let pose = poseRef.current
      if (!pose || pose.length !== g.chain.length + 1) {
        pose = jointPositions(resolveIk(g.chain, goal, g.maxReach), vec(0, 0))
        trail.length = 0
      }

      pose = solveFabrik(g.chain, goal, pose, {
        // Holding joints above the support spends redundancy. A 2-link arm has
        // none — its elbow is fully determined by the goal — so the constraint
        // there could only stop it reaching.
        groundLevel: g.chain.length >= 3 ? -SUPPORT_OFFSET : null,
        iterations: immediate ? 30 : 10,
      })
      poseRef.current = pose

      const mathPoints = pose
      const points = pose.map(p => vec(g.bx + p.x, g.by - p.y))
      const tip = points[points.length - 1]

      trail.push(vec(tip.x, tip.y))
      if (trail.length > TRAIL_MAX) trail.shift()

      ctx.clearRect(0, 0, width, height)
      drawEnvelope(g)
      drawGround(g)
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
      const r = Math.round(g.maxReach)
      if (r !== lastReach) {
        lastReach = r
        setReach(r)
      }
    }

    function frame(now) {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, MAX_FRAME) : 1 / 60
      lastFrame = now
      render(now - startedAt, dt)
      raf = requestAnimationFrame(frame)
    }

    function onPointerMove(e) {
      if (e.pointerType === 'touch') return
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }

    function onPointerLeave() {
      pointer.active = false
      trail.length = 0
    }

    function onThemeChange() {
      readPalette()
      if (reduceMotion.matches) render(0, 0, true)
    }

    readPalette()
    resize()

    const ro = new ResizeObserver(() => {
      resize()
      if (reduceMotion.matches) render(0, 0, true)
    })
    ro.observe(canvas)
    darkQuery.addEventListener('change', onThemeChange)

    if (reduceMotion.matches) {
      poseRef.current = null
      render(0, 0, true)
    } else {
      canvas.addEventListener('pointermove', onPointerMove)
      canvas.addEventListener('pointerleave', onPointerLeave)
      raf = requestAnimationFrame(frame)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      darkQuery.removeEventListener('change', onThemeChange)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [jointCount])

  const step = delta =>
    setJointCount(n => Math.min(MAX_JOINTS, Math.max(MIN_JOINTS, n + delta)))

  const stepperButton =
    'btn-press px-2.5 py-1 font-mono text-xs leading-none text-ink-2 ' +
    'hover:bg-accent-wash hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent'

  return (
    <figure className="border border-rule bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <span className="label">{t('hero_fig_label')}</span>
        <span className="label hidden truncate sm:block">{t('hero_fig_hint')}</span>
      </figcaption>

      <div className="h-[300px] sm:h-[360px]">
        <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule px-3 py-2">
        <div className="flex items-center gap-2.5">
          <span className="label">{t('hero_fig_joints')}</span>
          <div className="flex items-stretch border border-rule-strong">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={jointCount <= MIN_JOINTS}
              aria-label={t('hero_fig_remove_joint')}
              className={stepperButton}
            >
              −
            </button>
            <span
              aria-live="polite"
              className="tnum border-x border-rule-strong px-2.5 py-1 font-mono text-xs leading-none text-ink"
            >
              {String(jointCount).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={jointCount >= MAX_JOINTS}
              aria-label={t('hero_fig_add_joint')}
              className={stepperButton}
            >
              +
            </button>
          </div>
        </div>

        <span className={`label ${collision ? 'text-accent' : ''}`}>
          {collision ? t('hero_fig_collision') : `R ${reach}`}
        </span>
      </div>
    </figure>
  )
}
