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

/**
 * Pulls a target in to the smallest radius the chain can fold to. The outer
 * limit is optional and is normally best left off.
 *
 * The inner clamp is load-bearing: inside that radius there is no pose at all,
 * and FABRIK spends every iteration failing to find one.
 *
 * Clamping the *outer* radius looks like the same idea and is not. It lands the
 * goal exactly on the boundary, where the only solution is the fully straight
 * arm — and where the tip barely moves however much the outer joint bends, so
 * `solveFabrik` hits its tolerance and stops several degrees short, somewhere
 * different each frame. The far joint sawtoothed over a ~6° range the whole
 * time the pointer was outside the envelope. Left unclamped, an out-of-range
 * goal takes solveFabrik's exact straight-line branch instead: the same drawn
 * pose, held perfectly still. Measured: 6.07° of frame-to-frame jitter → 0.00°.
 */
export function clampTarget(target, minReach, maxReach = Infinity) {
  const d = len(target)
  if (d > maxReach) return scale(target, maxReach / d)
  if (d < minReach) return d > 1e-9 ? scale(target, minReach / d) : vec(0, minReach)
  return target
}

/** Signed shortest turn from heading `from` to heading `to`, in (-π, π]. */
export function turnBetween(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

/**
 * Builds the chain outward from the base along the requested headings, holding
 * every joint inside its limit and every link at its exact length.
 *
 * `limits[i]` is the turn link i may put into the chain, signed, measured from
 * link i-1 — and at the base, from `baseHeading`. That is the joint's angular
 * travel: the thing a real arm has stops on.
 *
 * Constraining here rather than in the backward pass is the whole trick. This
 * is the half of FABRIK that produces the pose you see, so a limit applied here
 * is one the drawn arm always satisfies — there is no iteration budget to run
 * out of and no tolerance to stop short of. What stays approximate is whether
 * the tip arrives, which is honest: a joint sitting on its stop is a target the
 * arm genuinely cannot reach.
 */
export function walkOut(base, chain, points, limits, baseHeading) {
  const p = [vec(base.x, base.y)]
  let previous = baseHeading

  for (let i = 0; i < chain.length; i++) {
    // Aim at where the joint currently is, from where its parent has just been
    // put — not at the heading the link used to have. Reading the headings up
    // front instead costs the pass its whole corrective effect, because every
    // one of them is measured from a joint that is about to move.
    let heading = Math.atan2(points[i + 1].y - p[i].y, points[i + 1].x - p[i].x)
    const limit = limits && limits[i]
    if (limit) heading = previous + clamp(turnBetween(previous, heading), limit[0], limit[1])
    p.push(vec(p[i].x + Math.cos(heading) * chain[i], p[i].y + Math.sin(heading) * chain[i]))
    previous = heading
  }

  return p
}

/**
 * The mirror of `walkOut`: builds the chain inward from the tip, holding each
 * joint inside its limit relative to the link outboard of it.
 *
 * The backward pass has to respect the limits too. Left free it proposes
 * headings the forward pass then clips, and the clipping is not a small
 * correction — the outer joints saturate against their stops, the tip stalls
 * tens of pixels short of the target, and the pose eventually snaps to a
 * mirrored one in a single frame. Measured on a pointer sweep across the
 * workspace: 176px of joint movement in one frame with the backward pass free,
 * 1.7px with it constrained.
 *
 * Nothing this returns is drawn — it only proposes the headings `walkOut`
 * realises — so link lengths here are exact but the base is wherever the chain
 * happens to end up.
 */
function walkIn(target, chain, points, limits) {
  const n = chain.length
  const p = new Array(n + 1)
  p[n] = vec(target.x, target.y)
  let outer = null

  for (let i = n - 1; i >= 0; i--) {
    let heading = Math.atan2(p[i + 1].y - points[i].y, p[i + 1].x - points[i].x)
    // Walking inward, a joint's limit is the one belonging to the link outboard
    // of it — the turn from this link to the one already placed.
    const limit = limits && outer !== null && limits[i + 1]
    if (limit) heading = outer - clamp(turnBetween(heading, outer), limit[0], limit[1])
    p[i] = vec(p[i + 1].x - Math.cos(heading) * chain[i], p[i + 1].y - Math.sin(heading) * chain[i])
    outer = heading
  }

  return p
}

/**
 * FABRIK — Forward And Backward Reaching Inverse Kinematics — with joint
 * limits.
 *
 * Solves from the pose the arm is already in, alternating a pass from the tip
 * inward and one from the base outward, each restoring exact link lengths.
 * Because it starts from the current pose rather than deriving one from
 * scratch, a small target change produces a small, local change — the outer
 * joints do most of the work and the base barely moves.
 *
 * `resolveIk` cannot do this: its free parameter is scaled by how far the
 * target is overall, so every joint reconfigures on every solve no matter how
 * little the target moved. That reads as rubbery rather than mechanical.
 *
 * The two passes are deliberately not symmetric. The backward pass is free: it
 * proposes headings, and `groundLevel` biases them, but nothing it produces is
 * drawn. The forward pass — `walkOut` — is where the limits bind, so the
 * returned pose is always legal. Unconstrained, FABRIK is perfectly happy to
 * fold a link back through the one before it or lay the arm down through its
 * own support; those are valid configurations of a chain of line segments and
 * of nothing that has a motor at each joint.
 *
 * Takes and returns joint positions base-first.
 */
export function solveFabrik(chain, target, points, options = {}) {
  const {
    iterations = 10,
    tolerance = 0.25,
    groundLevel = null,
    base = ORIGIN,
    limits = null,
    baseHeading = Math.PI / 2,
  } = options
  const n = chain.length
  let p = points.map(q => vec(q.x, q.y))

  let total = 0
  for (const l of chain) total += l

  const reach = len(sub(target, base))
  if (reach > total) {
    // Out of range: there is nothing to solve, the arm just points at it — as
    // far as its stops allow, which is why this goes through walkOut too.
    const dir = scale(sub(target, base), 1 / (reach || 1e-9))
    const along = [vec(base.x, base.y)]
    let d = 0
    for (let i = 0; i < n; i++) {
      d += chain[i]
      along.push(vec(base.x + dir.x * d, base.y + dir.y * d))
    }
    return walkOut(base, chain, along, limits, baseHeading)
  }

  for (let it = 0; it < iterations; it++) {
    if (len(sub(p[n], target)) < tolerance) break

    // Backward: pin the tip to the target and walk in, inside the stops.
    p = walkIn(target, chain, p, limits)

    // The ground is a preference rather than a stop, so it is expressed here,
    // on a pose that is only ever used to propose headings. Lengths break; the
    // forward pass restores them.
    if (groundLevel !== null) {
      for (let i = 1; i <= n; i++) {
        if (p[i].y < groundLevel) p[i] = vec(p[i].x, groundLevel)
      }
    }

    // Forward: rebuild from the base outward, inside the stops.
    p = walkOut(base, chain, p, limits, baseHeading)
  }

  return p
}

/**
 * Caps how far each joint may turn between one frame and the next, rebuilding
 * the chain from the capped angles so lengths and stops still hold exactly.
 *
 * Joint limits alone are not enough to keep the arm smooth. They carve the
 * configuration space up, and a redundant arm tracking a target across one of
 * those cuts has to change posture discontinuously — there is a pose either
 * side and no continuous path between them, so a local solver like FABRIK
 * arrives at the far one in a single frame. No amount of iteration fixes that;
 * it is the shape of the problem, not the solver.
 *
 * A real arm cannot do that, for the plainest reason available: its joints have
 * a top speed. Capping the rate turns every one of those flips into a fast
 * swing, which is both what the machine would do and what it should look like.
 *
 * `previous` must be the last pose this returned and `pose` the solver's
 * current answer — command and actual, kept apart. Feeding the capped pose back
 * to the solver instead deadlocks it: it re-solves from a halfway pose that
 * belongs to neither posture, changes its mind about which one it wants, and
 * the arm sits oscillating between them, 141px short of a target it can reach.
 * Solve from the solver's own last answer; slew the drawn arm toward it.
 *
 * `maxTurn` is radians per joint for this frame — a rate times the frame's own
 * delta, so the cap is the same speed at any refresh rate.
 */
export function limitJointRate(previous, pose, chain, maxTurn, options = {}) {
  const { base = ORIGIN, limits = null, baseHeading = Math.PI / 2 } = options
  const n = chain.length
  if (!previous || previous.length !== n + 1 || !(maxTurn > 0)) return pose

  const headingOf = (points, i) =>
    Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x)

  const p = [vec(base.x, base.y)]
  // The same joint in three poses — the one being built, the one it came from,
  // the one it is heading for — each measured against its own parent link.
  // Comparing a turn in one to a heading in another silently mixes them up and
  // the arm stalls part-way, never arriving.
  let heading = baseHeading
  let wasParent = baseHeading
  let wantParent = baseHeading

  for (let i = 0; i < n; i++) {
    // Both turns are joint-relative, which is the angle a motor actually
    // drives. The outer links can still sweep faster than this in world terms,
    // because their turn rides on the ones before it.
    const wasHeading = headingOf(previous, i)
    const wantHeading = headingOf(pose, i)
    const was = turnBetween(wasParent, wasHeading)
    const want = turnBetween(wantParent, wantHeading)

    // A joint with stops travels within its range, so the step is the plain
    // difference. Taking the shortest way round instead sends it through the
    // fold-back point it is not allowed to cross, where the limit clamps it
    // straight back — every frame, forever, 166px short of a target it can
    // reach. A free joint has no such point and takes the short way.
    const limit = limits && limits[i]
    const delta = limit ? want - was : turnBetween(was, want)
    let turn = was + clamp(delta, -maxTurn, maxTurn)
    if (limit) turn = clamp(turn, limit[0], limit[1])

    heading += turn
    p.push(vec(p[i].x + Math.cos(heading) * chain[i], p[i].y + Math.sin(heading) * chain[i]))
    wasParent = wasHeading
    wantParent = wantHeading
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

/**
 * Which side of the limb a joint's angle arc belongs on, with hysteresis.
 *
 * `jointSweep` returns a value in (-π, π], so a joint sitting a hair either
 * side of straight reports +180° or -180° on the strength of solver noise
 * alone. Taking the raw sign there mirrors the arc — and the label hung off its
 * bisector — across the limb several times a second. Within `deadZone` radians
 * of straight the previous side is kept; outside it the sweep decides.
 *
 * `previous` is 0 or undefined on the first frame, when there is nothing to
 * hold on to and the sweep decides regardless.
 */
export function stableSweepSign(sweep, previous, deadZone) {
  if (previous && Math.PI - Math.abs(sweep) < deadZone) return previous
  return sweep < 0 ? -1 : 1
}

/** Signed angle in degrees, normalised to (-180, 180]. */
export function normalizeDegrees(radians) {
  let deg = (radians * 180) / Math.PI
  deg = ((deg % 360) + 360) % 360
  return deg > 180 ? deg - 360 : deg
}
