import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { knn } from '../src/knn.js'
import { createQuadtree } from '@gridworkjs/quadtree'
import { point, rect, bounds } from '@gridworkjs/core'

const accessor = item => bounds(item.geo)

function makeTree(items) {
  const tree = createQuadtree(accessor)
  for (const item of items) tree.insert(item)
  return tree
}

describe('knn', () => {
  it('finds k nearest neighbors', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0) },
      { id: 'b', geo: point(5, 0) },
      { id: 'c', geo: point(10, 0) }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 2)
    assert.equal(results.length, 2)
    assert.equal(results[0].item.id, 'a')
    assert.equal(results[0].distance, 1)
    assert.equal(results[1].item.id, 'b')
    assert.equal(results[1].distance, 5)
  })

  it('returns distance alongside items', () => {
    const tree = makeTree([
      { id: 'a', geo: point(3, 4) }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 1)
    assert.equal(results[0].distance, 5)
  })

  it('respects maxDistance', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0) },
      { id: 'b', geo: point(5, 0) },
      { id: 'c', geo: point(10, 0) }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 10, { maxDistance: 6 })
    assert.equal(results.length, 2)
  })

  it('maxDistance of 0 returns nothing', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0) }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 5, { maxDistance: 0 })
    assert.equal(results.length, 0)
  })

  it('supports filter predicate', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0), type: 'shop' },
      { id: 'b', geo: point(2, 0), type: 'food' },
      { id: 'c', geo: point(3, 0), type: 'food' },
      { id: 'd', geo: point(4, 0), type: 'shop' }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 2, {
      filter: item => item.type === 'food'
    })
    assert.equal(results.length, 2)
    assert.equal(results[0].item.id, 'b')
    assert.equal(results[1].item.id, 'c')
  })

  it('filter with maxDistance combined', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0), type: 'shop' },
      { id: 'b', geo: point(2, 0), type: 'food' },
      { id: 'c', geo: point(10, 0), type: 'food' }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 5, {
      maxDistance: 5,
      filter: item => item.type === 'food'
    })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'b')
  })

  it('returns empty for k=0', () => {
    const tree = makeTree([{ id: 'a', geo: point(0, 0) }])
    const results = knn(tree, { x: 0, y: 0 }, 0)
    assert.equal(results.length, 0)
  })

  it('returns empty for k<0', () => {
    const tree = makeTree([{ id: 'a', geo: point(0, 0) }])
    const results = knn(tree, { x: 0, y: 0 }, -1)
    assert.equal(results.length, 0)
  })

  it('returns empty for empty index', () => {
    const tree = createQuadtree(accessor)
    const results = knn(tree, { x: 0, y: 0 }, 5)
    assert.equal(results.length, 0)
  })

  it('returns fewer than k when index has fewer items', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0) },
      { id: 'b', geo: point(2, 0) }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 10)
    assert.equal(results.length, 2)
  })

  it('works with rect items', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, 5, 8, 8) },
      { id: 'b', geo: rect(1, 1, 3, 3) }
    ])

    const results = knn(tree, { x: 0, y: 0 }, 1)
    assert.equal(results[0].item.id, 'b')
  })

  it('throws on non-spatial-index', () => {
    assert.throws(() => knn({}, { x: 0, y: 0 }, 1), /spatial index/)
  })

  it('throws on non-integer k', () => {
    const tree = makeTree([])
    assert.throws(() => knn(tree, { x: 0, y: 0 }, 1.5), /integer/)
  })

  it('throws on negative maxDistance', () => {
    const tree = makeTree([])
    assert.throws(() => knn(tree, { x: 0, y: 0 }, 1, { maxDistance: -1 }), /non-negative/)
  })

  it('throws on NaN point coordinates', () => {
    const tree = makeTree([])
    assert.throws(() => knn(tree, { x: NaN, y: 0 }, 1), /finite/)
  })

  it('returns results sorted by distance', () => {
    const tree = makeTree([
      { id: 'far', geo: point(10, 0) },
      { id: 'near', geo: point(1, 0) },
      { id: 'mid', geo: point(5, 0) }
    ])
    const results = knn(tree, { x: 0, y: 0 }, 3)
    assert.deepEqual(results.map(r => r.item.id), ['near', 'mid', 'far'])
  })
})
