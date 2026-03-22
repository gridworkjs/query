import { bounds, distanceToPoint } from '@gridworkjs/core/bounds'
import { validateIndex, validateAccessor, validateFiniteNumber } from './validate.js'

/**
 * Enhanced k-nearest-neighbor query with maxDistance and filter support.
 * Returns { item, distance }[] sorted by distance ascending.
 *
 * @param {object} index - A spatial index implementing the gridwork protocol
 * @param {function} accessor - Maps items to their bounds
 * @param {{ x: number, y: number }} point - Query point
 * @param {number} k - Number of nearest neighbors to find
 * @param {{ maxDistance?: number, filter?: function }} [options]
 * @returns {{ item: any, distance: number }[]}
 */
export function knn(index, accessor, point, k, options) {
  validateIndex(index)
  validateAccessor(accessor)
  validateFiniteNumber(point.x, 'point.x')
  validateFiniteNumber(point.y, 'point.y')

  if (typeof k !== 'number' || !Number.isInteger(k)) {
    throw new Error('k must be an integer')
  }
  if (k <= 0) return []

  const maxDistance = options && options.maxDistance
  const filter = options && options.filter

  if (maxDistance !== undefined && maxDistance !== null) {
    validateFiniteNumber(maxDistance, 'maxDistance')
    if (maxDistance < 0) throw new Error('maxDistance must be non-negative')
  }

  const candidates = index.nearest(point, filter ? k * 4 : k)
  const results = []

  for (let i = 0; i < candidates.length && results.length < k; i++) {
    const item = candidates[i]
    const b = bounds(accessor(item))
    const dist = distanceToPoint(b, point.x, point.y)

    if (maxDistance != null && dist > maxDistance) break

    if (!filter || filter(item)) {
      results.push({ item, distance: dist })
    }
  }

  // if filtering caused us to not find enough, request more from the index
  if (filter && results.length < k && candidates.length > 0) {
    const allItems = index.nearest(point, index.size)
    results.length = 0

    for (let i = 0; i < allItems.length && results.length < k; i++) {
      const item = allItems[i]
      const b = bounds(accessor(item))
      const dist = distanceToPoint(b, point.x, point.y)

      if (maxDistance != null && dist > maxDistance) break

      if (filter(item)) {
        results.push({ item, distance: dist })
      }
    }
  }

  return results
}
