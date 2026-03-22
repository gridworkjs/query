import { bounds, contains } from '@gridworkjs/core/bounds'
import { validateIndex } from './validate.js'

/**
 * Find all items fully contained within a region.
 * Unlike search() which returns items that intersect, within() requires full containment.
 *
 * @param {object} index - A spatial index implementing the gridwork protocol
 * @param {object} region - Bounding region (bounds object or geometry)
 * @returns {any[]}
 */
export function within(index, region) {
  validateIndex(index)

  const accessor = index.accessor
  const regionBounds = bounds(region)
  const candidates = index.search(regionBounds)
  const results = []

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    const b = bounds(accessor(item))
    if (contains(regionBounds, b)) {
      results.push(item)
    }
  }

  return results
}
