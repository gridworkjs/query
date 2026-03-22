import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { radius } from '../src/radius.js'
import { createQuadtree } from '@gridworkjs/quadtree'
import { point, rect, bounds } from '@gridworkjs/core'

const accessor = item => bounds(item.geo)

function makeTree(items) {
  const tree = createQuadtree(accessor)
  for (const item of items) tree.insert(item)
  return tree
}

describe('radius', () => {
  it('finds items within radius of a point', () => {
    const tree = makeTree([
      { id: 'a', geo: point(0, 0) },
      { id: 'b', geo: point(3, 4) },
      { id: 'c', geo: point(10, 10) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 6)
    assert.equal(results.length, 2)
    assert.equal(results[0].item.id, 'a')
    assert.equal(results[0].distance, 0)
    assert.equal(results[1].item.id, 'b')
    assert.equal(results[1].distance, 5)
  })

  it('excludes items outside the radius', () => {
    const tree = makeTree([
      { id: 'a', geo: point(0, 0) },
      { id: 'b', geo: point(100, 100) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 10)
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('returns empty array for radius of 0', () => {
    const tree = makeTree([{ id: 'a', geo: point(0, 0) }])
    const results = radius(tree, { x: 0, y: 0 }, 0)
    assert.equal(results.length, 0)
  })

  it('returns results sorted by distance', () => {
    const tree = makeTree([
      { id: 'far', geo: point(8, 0) },
      { id: 'near', geo: point(1, 0) },
      { id: 'mid', geo: point(5, 0) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 10)
    assert.deepEqual(results.map(r => r.item.id), ['near', 'mid', 'far'])
  })

  it('works with rect items', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(2, 2, 4, 4) },
      { id: 'b', geo: rect(20, 20, 22, 22) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 5)
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('distance to rect is to nearest edge', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(3, 0, 6, 2) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 10)
    assert.equal(results.length, 1)
    assert.equal(results[0].distance, 3)
  })

  it('distance is 0 when point is inside rect', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-5, -5, 5, 5) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 10)
    assert.equal(results[0].distance, 0)
  })

  it('supports filter option', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 0), type: 'food' },
      { id: 'b', geo: point(2, 0), type: 'shop' },
      { id: 'c', geo: point(3, 0), type: 'food' }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 5, {
      filter: item => item.type === 'food'
    })
    assert.equal(results.length, 2)
    assert.deepEqual(results.map(r => r.item.id), ['a', 'c'])
  })

  it('returns empty for empty index', () => {
    const tree = createQuadtree(accessor)
    const results = radius(tree, { x: 0, y: 0 }, 100)
    assert.equal(results.length, 0)
  })

  it('throws on non-spatial-index', () => {
    assert.throws(() => radius({}, { x: 0, y: 0 }, 5), /spatial index/)
  })

  it('throws on NaN point coordinates', () => {
    const tree = makeTree([])
    assert.throws(() => radius(tree, { x: NaN, y: 0 }, 5), /finite/)
  })

  it('throws on negative radius', () => {
    const tree = makeTree([])
    assert.throws(() => radius(tree, { x: 0, y: 0 }, -1), /non-negative/)
  })

  it('handles items exactly on the radius boundary', () => {
    const tree = makeTree([
      { id: 'a', geo: point(3, 4) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 5)
    assert.equal(results.length, 1)
    assert.equal(results[0].distance, 5)
  })

  it('handles items just outside the radius', () => {
    const tree = makeTree([
      { id: 'a', geo: point(3, 4.001) }
    ])

    const results = radius(tree, { x: 0, y: 0 }, 5)
    assert.equal(results.length, 0)
  })
})
