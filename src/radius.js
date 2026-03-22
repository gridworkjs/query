import { bounds, distanceToPoint, expandBy } from '@gridworkjs/core/bounds'
import { validateIndex, validateAccessor, validateFiniteNumber } from './validate.js'

/**
 * Find all items within a given radius of a point.
 * Returns { item, distance }[] sorted by distance ascending.
 *
 * @param {object} index - A spatial index implementing the gridwork protocol
 * @param {function} accessor - Maps items to their bounds
 * @param {{ x: number, y: number }} point - Center point
 * @param {number} r - Search radius
 * @param {{ filter?: function }} [options]
 * @returns {{ item: any, distance: number }[]}
 */
export function radius(index, accessor, point, r, options) {
  validateIndex(index)
  validateAccessor(accessor)
  validateFiniteNumber(point.x, 'point.x')
  validateFiniteNumber(point.y, 'point.y')
  validateFiniteNumber(r, 'radius')

  if (r < 0) throw new Error('radius must be non-negative')
  if (r === 0) return []

  const searchBounds = {
    minX: point.x - r,
    minY: point.y - r,
    maxX: point.x + r,
    maxY: point.y + r
  }

  const candidates = index.search(searchBounds)
  const filter = options && options.filter
  const results = []

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    const b = bounds(accessor(item))
    const dist = distanceToPoint(b, point.x, point.y)
    if (dist <= r) {
      if (!filter || filter(item)) {
        results.push({ item, distance: dist })
      }
    }
  }

  results.sort((a, b) => a.distance - b.distance)
  return results
}
