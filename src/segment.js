import { bounds } from '@gridworkjs/core/bounds'
import { validateIndex, validateFiniteNumber } from './validate.js'
import { rayAABB } from './intersect.js'

/**
 * Find all items intersecting a line segment between two points.
 * Returns { item, distance }[] sorted by distance from the start point.
 *
 * @param {object} index - A spatial index implementing the gridwork protocol
 * @param {{ x: number, y: number }} from - Segment start point
 * @param {{ x: number, y: number }} to - Segment end point
 * @param {{ filter?: function }} [options]
 * @returns {{ item: any, distance: number }[]}
 */
export function segment(index, from, to, options) {
  validateIndex(index)
  validateFiniteNumber(from.x, 'from.x')
  validateFiniteNumber(from.y, 'from.y')
  validateFiniteNumber(to.x, 'to.x')
  validateFiniteNumber(to.y, 'to.y')

  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy)

  if (len === 0) return []

  const ndx = dx / len
  const ndy = dy / len
  const filter = options && options.filter

  const indexBounds = index.bounds
  if (!indexBounds) return []

  const accessor = index.accessor
  const searchBox = {
    minX: Math.min(from.x, to.x),
    minY: Math.min(from.y, to.y),
    maxX: Math.max(from.x, to.x),
    maxY: Math.max(from.y, to.y)
  }

  const candidates = index.search(searchBox)
  const results = []

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    const b = bounds(accessor(item))
    const t = rayAABB(from, ndx, ndy, b)

    if (t !== null && t <= len) {
      if (!filter || filter(item)) {
        results.push({ item, distance: t })
      }
    }
  }

  results.sort((a, b) => a.distance - b.distance)
  return results
}
