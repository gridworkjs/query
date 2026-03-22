export function rayAABB(origin, dx, dy, box) {
  let tmin = -Infinity
  let tmax = Infinity

  if (dx !== 0) {
    let t1 = (box.minX - origin.x) / dx
    let t2 = (box.maxX - origin.x) / dx
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tmin = Math.max(tmin, t1)
    tmax = Math.min(tmax, t2)
  } else {
    if (origin.x < box.minX || origin.x > box.maxX) return null
  }

  if (dy !== 0) {
    let t1 = (box.minY - origin.y) / dy
    let t2 = (box.maxY - origin.y) / dy
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
    tmin = Math.max(tmin, t1)
    tmax = Math.min(tmax, t2)
  } else {
    if (origin.y < box.minY || origin.y > box.maxY) return null
  }

  if (tmin > tmax) return null
  if (tmax < 0) return null

  return tmin >= 0 ? tmin : 0
}
