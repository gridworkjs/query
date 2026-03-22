import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ray } from '../src/ray.js'
import { createQuadtree } from '@gridworkjs/quadtree'
import { point, rect, bounds } from '@gridworkjs/core'

const accessor = item => bounds(item.geo)

function makeTree(items) {
  const tree = createQuadtree(accessor)
  for (const item of items) tree.insert(item)
  return tree
}

describe('ray', () => {
  it('finds items along a horizontal ray', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, -1, 7, 1) },
      { id: 'b', geo: rect(10, -1, 12, 1) },
      { id: 'c', geo: rect(5, 5, 7, 7) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.equal(results.length, 2)
    assert.equal(results[0].item.id, 'a')
    assert.equal(results[1].item.id, 'b')
  })

  it('returns results sorted by distance along ray', () => {
    const tree = makeTree([
      { id: 'far', geo: rect(20, -1, 22, 1) },
      { id: 'near', geo: rect(3, -1, 5, 1) },
      { id: 'mid', geo: rect(10, -1, 12, 1) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.deepEqual(results.map(r => r.item.id), ['near', 'mid', 'far'])
  })

  it('returns distance along the ray', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, -1, 7, 1) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.equal(results[0].distance, 5)
  })

  it('respects maxDistance', () => {
    const tree = makeTree([
      { id: 'near', geo: rect(3, -1, 5, 1) },
      { id: 'far', geo: rect(20, -1, 22, 1) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 }, { maxDistance: 10 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'near')
  })

  it('returns empty when maxDistance is 0', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, -1, 7, 1) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 }, { maxDistance: 0 })
    assert.equal(results.length, 0)
  })

  it('works with diagonal rays', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(4, 4, 6, 6) },
      { id: 'b', geo: rect(-4, 4, -2, 6) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 1 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('works with vertical rays', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-1, 5, 1, 7) },
      { id: 'b', geo: rect(5, 5, 7, 7) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 0, y: 1 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('does not hit items behind the ray origin', () => {
    const tree = makeTree([
      { id: 'behind', geo: rect(-7, -1, -5, 1) },
      { id: 'ahead', geo: rect(5, -1, 7, 1) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'ahead')
  })

  it('distance is 0 when origin is inside an item', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-5, -5, 5, 5) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].distance, 0)
  })

  it('normalizes direction vector', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, -1, 7, 1) }
    ])

    const r1 = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    const r2 = ray(tree, { x: 0, y: 0 }, { x: 100, y: 0 })
    assert.equal(r1[0].distance, r2[0].distance)
  })

  it('returns empty for empty index', () => {
    const tree = createQuadtree(accessor)
    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.equal(results.length, 0)
  })

  it('throws on zero direction vector', () => {
    const tree = makeTree([])
    assert.throws(() => ray(tree, { x: 0, y: 0 }, { x: 0, y: 0 }), /non-zero/)
  })

  it('throws on non-spatial-index', () => {
    assert.throws(() => ray({}, { x: 0, y: 0 }, { x: 1, y: 0 }), /spatial index/)
  })

  it('throws on NaN origin', () => {
    const tree = makeTree([])
    assert.throws(() => ray(tree, { x: NaN, y: 0 }, { x: 1, y: 0 }), /finite/)
  })

  it('throws on negative maxDistance', () => {
    const tree = makeTree([])
    assert.throws(() => ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 }, { maxDistance: -1 }), /non-negative/)
  })

  it('works with point items', () => {
    const tree = makeTree([
      { id: 'a', geo: point(5, 0) },
      { id: 'b', geo: point(5, 5) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('handles negative direction', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-7, -1, -5, 1) },
      { id: 'b', geo: rect(5, -1, 7, 1) }
    ])

    const results = ray(tree, { x: 0, y: 0 }, { x: -1, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('throws on NaN maxDistance', () => {
    const tree = makeTree([])
    assert.throws(() => ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 }, { maxDistance: NaN }), /finite/)
  })

  it('throws on Infinity maxDistance', () => {
    const tree = makeTree([])
    assert.throws(() => ray(tree, { x: 0, y: 0 }, { x: 1, y: 0 }, { maxDistance: Infinity }), /finite/)
  })

  it('finds items when origin is far from index', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-1, -1, 1, 1) }
    ])
    const results = ray(tree, { x: -10000, y: 0 }, { x: 1, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })
})
