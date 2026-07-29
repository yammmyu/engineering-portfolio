/**
 * Planar N-link inverse kinematics.
 *
 * Ported from the pygame solver in my Math IA (`resolve_ik` /
 * `get_intersections`): the chain is solved backwards from the end effector,
 * and each joint is placed where a circle of the current link's length around
 * the tip meets a circle of the sub-chain's reach around the base.
 *
 * All vectors are math coords — y up, origin at the base joint.
 */

export const vec = (x, y) => ({ x, y })
export const len = v => Math.hypot(v.x, v.y)
export const sub = (a, b) => vec(a.x - b.x, a.y - b.y)
export const scale = (v, s) => vec(v.x * s, v.y * s)

const ORIGIN = vec(0, 0)
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi)

/**
 * Intersections of two circles. `a` is the signed distance from p1 along the
 * centre line to the radical line, `h` the half-chord.
 *
 * `a` is genuinely negative whenever r1 < r2 far enough that the radical line
 * falls behind p1 — which is the common case here, since r1 is one link and r2
 * is a whole sub-chain. The IA clamped it to zero, which silently placed the
 * joint off its own circle; only `h` needs clamping, to collapse a
 * non-intersecting pair onto the centre line instead of returning NaN.
 */
export function intersections(p1, r1, p2, r2) {
  const d = sub(p2, p1)
  let dist = len(d)

  // Concentric centres give no direction; any axis is as good as another.
  let ux = 0
  let uy = 1
  if (dist > 1e-9) {
    ux = d.x / dist
    uy = d.y / dist
  } else {
    dist = 1e-9
  }

  const a = (r1 * r1 - r2 * r2 + dist * dist) / (2 * dist)
  const h = Math.sqrt(Math.max(r1 * r1 - a * a, 0))
  const mid = vec(p1.x + ux * a, p1.y + uy * a)
  const perp = vec(-h * uy, h * ux)
  return [vec(mid.x + perp.x, mid.y + perp.y), vec(mid.x - perp.x, mid.y - perp.y)]
}

/**
 * How far out the sub-chain behind a joint is allowed to stretch.
 *
 * The IA searched downward from the sub-chain's full length for a value
 * satisfying the triangle inequality, but its predicate ORs the three
 * conditions, so it always accepted the first candidate — every sub-chain came
 * back fully taut. A taut sub-chain has to lie radially, so the arm collapsed
 * to a straight line with one bend at the last link, and extra joints made no
 * visible difference.
 *
 * Scaling the target extension by how far the goal actually is keeps the
 * original behaviour at full stretch (extension = 1 is exactly the IA's
 * result) while distributing the fold across every joint closer in.
 */
export function subChainReach(maxRemaining, minRemaining, linkLength, tipDistance, extension) {
  // The joint has to close a triangle with this link and the current tip, and
  // it also has to sit somewhere the remaining sub-chain can actually fold to
  // — without the minRemaining floor, a target near the base drives the next
  // step below its own minimum radius and the links stop being rigid.
  const lo = Math.max(Math.abs(linkLength - tipDistance), minRemaining)
  const hi = Math.min(maxRemaining, linkLength + tipDistance)
  if (hi < lo) return clamp(lo, minRemaining, maxRemaining)
  return clamp(maxRemaining * extension, lo, hi)
}

/** Smallest radius a chain can fold to: one link outrunning all the others. */
export function minimumReach(chain) {
  let total = 0
  let longest = 0
  for (const l of chain) {
    total += l
    if (l > longest) longest = l
  }
  return Math.max(2 * longest - total, 0)
}

/**
 * Solves the chain for `target`, returning link vectors base-first.
 * `chain` is a list of link lengths.
 *
 * Each step has two valid solutions — mirror images across the line between the
 * two circle centres — and this takes the higher, giving an elbow-up pose.
 *
 * Stateless, so it only seeds the arm's opening pose; `solveFabrik` drives it
 * from then on. Two reasons it cannot run per frame. Choosing the branch afresh
 * on every solve means that when a pair sits near level, a sub-pixel change of
 * target flips a whole sub-chain to its mirror pose — joint jumps of 100px and
 * up, several joints at once. And `subChainReach` scales by how far the target
 * is overall, so every joint reconfigures however little the target moved,
 * which reads as rubbery rather than mechanical.
 */
export function resolveIk(chain, target, maxReach) {
  const distance = len(target)
  const minReach = minimumReach(chain)

  // Clamp onto the reachable annulus at both ends. Inside the dead zone the
  // arm cannot fold any tighter, so the target is pushed back out to the inner
  // radius — straight up when it sits exactly on the base and has no direction.
  let tip = target
  if (distance > maxReach) {
    tip = scale(target, maxReach / distance)
  } else if (distance < minReach) {
    tip = distance > 1e-9 ? scale(target, minReach / distance) : vec(0, minReach)
  }

  const extension = maxReach > 0 ? clamp(len(tip) / maxReach, 0, 1) : 0
  const links = []
  let current = tip

  for (let i = chain.length - 1; i > 0; i--) {
    const remaining = chain.slice(0, i)
    let maxRemaining = 0
    for (const l of remaining) maxRemaining += l

    // The innermost step is exact: link 0 has a fixed length, so the joint
    // must sit on that circle rather than a chosen one.
    const reach =
      i === 1
        ? chain[0]
        : subChainReach(
            maxRemaining,
            minimumReach(remaining),
            chain[i],
            len(current),
            extension,
          )

    const [p, q] = intersections(current, chain[i], ORIGIN, reach)

    const joint = p.y > q.y ? p : q

    links.unshift(sub(current, joint))
    current = joint
  }

  links.unshift(current)
  return links
}

/** Pulls a target onto the reachable annulus. */
export function clampTarget(target, minReach, maxReach) {
  const d = len(target)
  if (d > maxReach) return scale(target, maxReach / d)
  if (d < minReach) return d > 1e-9 ? scale(target, minReach / d) : vec(0, minReach)
  return target
}

/**
 * FABRIK — Forward And Backward Reaching Inverse Kinematics.
 *
 * Solves in place from the pose the arm is already in, alternating a pass from
 * the tip inward and one from the base outward, each restoring exact link
 * lengths. Because it starts from the current pose rather than deriving one
 * from scratch, a small target change produces a small, local change — the
 * outer joints do most of the work and the base barely moves.
 *
 * `resolveIk` cannot do this: its free parameter is scaled by how far the
 * target is overall, so every joint reconfigures on every solve no matter how
 * little the target moved. That reads as rubbery rather than mechanical.
 *
 * `groundLevel` is applied inside the forward pass, before the link length is
 * restored — a continuous nudge, so unlike a branch preference it can never
 * flip the arm. Link lengths stay exact; the ground is approximate.
 *
 * Takes and returns joint positions base-first.
 */
export function solveFabrik(chain, target, points, options = {}) {
  const { iterations = 10, tolerance = 0.25, groundLevel = null, base = ORIGIN } = options
  const n = chain.length
  const p = points.map(q => vec(q.x, q.y))

  let total = 0
  for (const l of chain) total += l

  const reach = len(sub(target, base))
  if (reach > total) {
    // Out of range: there is nothing to solve, the arm just points at it.
    const dir = scale(sub(target, base), 1 / (reach || 1e-9))
    p[0] = vec(base.x, base.y)
    for (let i = 0; i < n; i++) {
      p[i + 1] = vec(p[i].x + dir.x * chain[i], p[i].y + dir.y * chain[i])
    }
    return p
  }

  for (let it = 0; it < iterations; it++) {
    if (len(sub(p[n], target)) < tolerance) break

    // Backward: pin the tip to the target and walk in.
    p[n] = vec(target.x, target.y)
    for (let i = n - 1; i >= 0; i--) {
      const dx = p[i].x - p[i + 1].x
      const dy = p[i].y - p[i + 1].y
      const lambda = chain[i] / (Math.hypot(dx, dy) || 1e-9)
      p[i] = vec(p[i + 1].x + dx * lambda, p[i + 1].y + dy * lambda)
    }

    // Forward: pin the base back down and walk out, applying constraints to
    // each joint before its length is restored.
    p[0] = vec(base.x, base.y)
    for (let i = 0; i < n; i++) {
      let x = p[i + 1].x
      let y = p[i + 1].y
      if (groundLevel !== null && y < groundLevel) y = groundLevel
      const dx = x - p[i].x
      const dy = y - p[i].y
      const lambda = chain[i] / (Math.hypot(dx, dy) || 1e-9)
      p[i + 1] = vec(p[i].x + dx * lambda, p[i].y + dy * lambda)
    }
  }

  return p
}

/** Joint positions, base-first, given link vectors and a base point. */
export function jointPositions(links, base) {
  const points = [base]
  for (let i = 0; i < links.length; i++) {
    const previous = points[i]
    points.push(vec(previous.x + links[i].x, previous.y + links[i].y))
  }
  return points
}

function orientation(a, b, c) {
  const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (Math.abs(val) < 1e-9) return 0
  return val > 0 ? 1 : 2
}

function onSegment(a, b, c) {
  return (
    Math.min(a.x, c.x) <= b.x &&
    b.x <= Math.max(a.x, c.x) &&
    Math.min(a.y, c.y) <= b.y &&
    b.y <= Math.max(a.y, c.y)
  )
}

export function segmentsIntersect(p1, p2, q1, q2) {
  const o1 = orientation(p1, p2, q1)
  const o2 = orientation(p1, p2, q2)
  const o3 = orientation(q1, q2, p1)
  const o4 = orientation(q1, q2, p2)

  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(p1, q1, p2)) return true
  if (o2 === 0 && onSegment(p1, q2, p2)) return true
  if (o3 === 0 && onSegment(q1, p1, q2)) return true
  if (o4 === 0 && onSegment(q1, p2, q2)) return true
  return false
}

/**
 * Self-collision over non-adjacent link pairs. Consecutive links always share
 * a joint, so only pairs at least two apart are tested.
 */
export function hasSelfCollision(points) {
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1])) return true
    }
  }
  return false
}

/**
 * Signed shortest sweep, in radians, from the ray vertex→a to the ray vertex→b.
 * Its magnitude is the included angle at the vertex: 180° when the two rays are
 * opposite (a straight joint), 0° when they coincide (fully folded).
 *
 * Handedness is coordinate-system dependent but the magnitude is not, so this
 * is safe in either canvas or math space — provided all three points come from
 * the same one. Mixing them mirrors one ray and silently reports a different
 * angle entirely.
 */
export function jointSweep(a, vertex, b) {
  const from = Math.atan2(a.y - vertex.y, a.x - vertex.x)
  const to = Math.atan2(b.y - vertex.y, b.x - vertex.x)
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

/** Signed angle in degrees, normalised to (-180, 180]. */
export function normalizeDegrees(radians) {
  let deg = (radians * 180) / Math.PI
  deg = ((deg % 360) + 360) % 360
  return deg > 180 ? deg - 360 : deg
}
