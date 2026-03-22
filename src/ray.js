import { bounds } from '@gridworkjs/core/bounds'
import { validateIndex, validateFiniteNumber } from './validate.js'
import { rayAABB } from './intersect.js'

/**
 * Cast a ray through a spatial index and find all items it intersects.
 * Returns { item, distance }[] sorted by distance along the ray.
 *
 * @param {object} index - A spatial index implementing the gridwork protocol
 * @param {{ x: number, y: number }} origin - Ray origin point
 * @param {{ x: number, y: number }} direction - Ray direction vector (will be normalized)
 * @param {{ maxDistance?: number, filter?: function }} [options]
 * @returns {{ item: any, distance: number }[]}
 */
export function ray(index, origin, direction, options) {
  validateIndex(index)
  validateFiniteNumber(origin.x, 'origin.x')
  validateFiniteNumber(origin.y, 'origin.y')
  validateFiniteNumber(direction.x, 'direction.x')
  validateFiniteNumber(direction.y, 'direction.y')

  const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
  if (len === 0) throw new Error('direction vector must be non-zero')

  const dx = direction.x / len
  const dy = direction.y / len

  if (options && options.maxDistance !== undefined) {
    validateFiniteNumber(options.maxDistance, 'maxDistance')
    if (options.maxDistance < 0) throw new Error('maxDistance must be non-negative')
  }
  const maxDist = (options && options.maxDistance !== undefined) ? options.maxDistance : Infinity
  const filter = options && options.filter

  const indexBounds = index.bounds
  if (!indexBounds) return []

  const accessor = index.accessor
  const searchBounds = raySearchBounds(origin, dx, dy, maxDist, indexBounds)
  const candidates = index.search(searchBounds)
  const results = []

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    const b = bounds(accessor(item))
    const t = rayAABB(origin, dx, dy, b)

    if (t !== null && t <= maxDist) {
      if (!filter || filter(item)) {
        results.push({ item, distance: t })
      }
    }
  }

  results.sort((a, b) => a.distance - b.distance)
  return results
}

function raySearchBounds(origin, dx, dy, maxDist, indexBounds) {
  let endDist = maxDist
  if (!Number.isFinite(endDist)) {
    const farX = dx >= 0 ? indexBounds.maxX : indexBounds.minX
    const farY = dy >= 0 ? indexBounds.maxY : indexBounds.minY
    const dfx = farX - origin.x
    const dfy = farY - origin.y
    endDist = Math.sqrt(dfx * dfx + dfy * dfy) * 1.5
  }

  const endX = origin.x + dx * endDist
  const endY = origin.y + dy * endDist

  return {
    minX: Math.min(origin.x, endX),
    minY: Math.min(origin.y, endY),
    maxX: Math.max(origin.x, endX),
    maxY: Math.max(origin.y, endY)
  }
}
