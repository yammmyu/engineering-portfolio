/**
 * The arm's idle program: a pick-and-place cycle.
 *
 * Pure geometry over a clock — no canvas, no React — so it can be stepped
 * through with node. Everything is a fraction of the arm's reach, so the cycle
 * keeps its shape at any figure size.
 *
 * It replaced a lissajous sweep of the target. That covered the workspace
 * evenly, which is exactly the problem: an arm tracing a smooth curve through
 * the middle of nowhere reads as a screensaver. A machine looks like a machine
 * when it goes somewhere, stops, does something, and goes somewhere else.
 */

import { vec, turnBetween } from './ik.js'

// Fractions of full reach. The stations sit at about the base's own height,
// where a bench would be, and far enough apart that the arm has to change
// posture to work both — the linkage is the subject of the figure.
//
// 0.62 rather than the 0.56 first tried: a station closer in is a station the
// arm has to fold up to touch, and at 0.56 both outer joints ran into their
// stops and the tip stopped 14px short of the bench. Further out is a more
// extended, more comfortable posture. Measured across a full cycle, the tip
// now tracks its path to within 0.2px.
const STATION_X = 0.62
const STATION_Y = 0.05
// Clearance the tip lifts to before traversing, so the part rides over the far
// station rather than through it.
const HOVER = 0.36

// How long the arm takes over the whole program, as a multiple of the segment
// times below. Those times are the *proportions* of the cycle — how a move
// weighs against a dwell — and this is the single dial for the speed of the
// lot, so the shape of the program survives being retimed.
const PACE = 1.7

/**
 * One cycle, as the waypoint each segment ends on. `hold` is whether the
 * gripper is closed during the segment; `part` is where the part is while it
 * is not being carried.
 *
 * The last waypoint is the first one, so the cycle closes and the tip never has
 * to jump between laps.
 */
function keyframes(reach) {
  const pick = vec(-STATION_X * reach, STATION_Y * reach)
  const place = vec(STATION_X * reach, STATION_Y * reach)
  const over = p => vec(p.x, p.y + HOVER * reach)

  return [
    { to: pick, seconds: 0.5, hold: false, part: 'pick' }, //     down to the part
    { to: pick, seconds: 0.28, hold: false, part: 'pick' }, //    close the gripper
    { to: over(pick), seconds: 0.5, hold: true, part: 'held' }, //  lift clear
    { to: over(place), seconds: 1.05, hold: true, part: 'held', sweep: true },
    { to: place, seconds: 0.5, hold: true, part: 'held' }, //     down to the bench
    { to: place, seconds: 0.28, hold: true, part: 'held' }, //    open the gripper
    { to: over(place), seconds: 0.5, hold: false, part: 'place' }, // lift clear
    { to: over(pick), seconds: 1.05, hold: false, part: 'swap', sweep: true },
  ]
}

/**
 * A traverse, swung about the base instead of ruled straight across.
 *
 * The straight version asked the tip to hold a constant height right across the
 * middle of the workspace, which is the one place the arm has to fold up tight
 * to reach — it jammed both outer joints against their stops and fell up to
 * 54px short of its own path. A gantry moves in straight lines; a revolute arm
 * swings, and sweeping at constant radius is both what the linkage wants to do
 * and what keeps it away from its limits.
 *
 * Radius is interpolated too, so this still works if the two ends are ever at
 * different distances.
 */
function sweepBetween(a, b, u) {
  const from = Math.atan2(a.y, a.x)
  const ra = Math.hypot(a.x, a.y)
  const radius = ra + (Math.hypot(b.x, b.y) - ra) * u
  const angle = from + turnBetween(from, Math.atan2(b.y, b.x)) * u
  return vec(Math.cos(angle) * radius, Math.sin(angle) * radius)
}

/**
 * Ease within a segment. Every move starts and ends at rest, which is what
 * separates a machine running a program from something drifting: the tip
 * accelerates out of each waypoint and decelerates into the next one.
 *
 * Smoothstep rather than the `--ease-in-out` token, which is a CSS curve and
 * cannot be handed to a canvas. The character is the same and the difference
 * is a fraction of a pixel at this scale.
 */
const ease = u => u * u * (3 - 2 * u)

/**
 * Where the tip should be, and where the part is, `clock` seconds into the
 * cycle. Returns positions in math coords relative to the base.
 *
 * `part.alpha` fades the part out at the place station and back in at the pick
 * station while the arm is on its way back. The two stations keep their roles
 * that way — parts flow one direction through the cell, and the arm never picks
 * up the thing it has just set down, which is what a shuttle between two
 * stations looks like and reads as a mistake.
 */
export function pickPlaceCycle(clock, reach) {
  const frames = keyframes(reach)
  const pick = frames[0].to
  const place = frames[4].to

  let period = 0
  for (const f of frames) period += f.seconds

  let t = (clock / PACE) % period
  if (t < 0) t += period

  let from = frames[frames.length - 1].to
  let frame = frames[frames.length - 1]
  let u = 1

  for (const f of frames) {
    if (t >= f.seconds) {
      t -= f.seconds
      from = f.to
      continue
    }
    frame = f
    u = f.seconds > 0 ? t / f.seconds : 1
    break
  }

  const e = ease(u)
  const target = frame.sweep
    ? sweepBetween(from, frame.to, e)
    : vec(from.x + (frame.to.x - from.x) * e, from.y + (frame.to.y - from.y) * e)

  let part = { x: pick.x, y: pick.y, alpha: 1 }
  if (frame.part === 'held') part = { x: target.x, y: target.y, alpha: 1 }
  else if (frame.part === 'place') part = { x: place.x, y: place.y, alpha: 1 }
  else if (frame.part === 'swap') {
    // Out at one end of the return, in at the other, with a beat of empty
    // bench between — both fades happen while the tip is a long way from the
    // station, so nothing pops under the gripper.
    if (u < 0.35) part = { x: place.x, y: place.y, alpha: 1 - u / 0.35 }
    else if (u > 0.65) part = { x: pick.x, y: pick.y, alpha: (u - 0.65) / 0.35 }
    else part = { x: pick.x, y: pick.y, alpha: 0 }
  }

  return { target, holding: frame.hold, part, pick, place }
}
