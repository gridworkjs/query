import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { segment } from '../src/segment.js'
import { createQuadtree } from '@gridworkjs/quadtree'
import { point, rect, bounds } from '@gridworkjs/core'

const accessor = item => bounds(item.geo)

function makeTree(items) {
  const tree = createQuadtree(accessor)
  for (const item of items) tree.insert(item)
  return tree
}

describe('segment', () => {
  it('finds items between two points', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, -1, 7, 1) },
      { id: 'b', geo: rect(10, -1, 12, 1) },
      { id: 'c', geo: rect(5, 5, 7, 7) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 20, y: 0 })
    assert.equal(results.length, 2)
    assert.equal(results[0].item.id, 'a')
    assert.equal(results[1].item.id, 'b')
  })

  it('excludes items beyond the endpoint', () => {
    const tree = makeTree([
      { id: 'near', geo: rect(3, -1, 5, 1) },
      { id: 'far', geo: rect(20, -1, 22, 1) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'near')
  })

  it('excludes items behind the start point', () => {
    const tree = makeTree([
      { id: 'behind', geo: rect(-7, -1, -5, 1) },
      { id: 'ahead', geo: rect(5, -1, 7, 1) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'ahead')
  })

  it('returns results sorted by distance from start', () => {
    const tree = makeTree([
      { id: 'far', geo: rect(15, -1, 17, 1) },
      { id: 'near', geo: rect(3, -1, 5, 1) },
      { id: 'mid', geo: rect(8, -1, 10, 1) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 20, y: 0 })
    assert.deepEqual(results.map(r => r.item.id), ['near', 'mid', 'far'])
  })

  it('returns distance from start point', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(5, -1, 7, 1) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 20, y: 0 })
    assert.equal(results[0].distance, 5)
  })

  it('works with diagonal segments', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(4, 4, 6, 6) },
      { id: 'b', geo: rect(-4, 4, -2, 6) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 10 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('works with vertical segments', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-1, 5, 1, 7) },
      { id: 'b', geo: rect(5, 5, 7, 7) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 0, y: 10 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('works in reverse direction', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-7, -1, -5, 1) },
      { id: 'b', geo: rect(5, -1, 7, 1) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: -10, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('distance is 0 when start is inside an item', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(-5, -5, 5, 5) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].distance, 0)
  })

  it('returns empty for zero-length segment', () => {
    const tree = makeTree([{ id: 'a', geo: point(0, 0) }])
    const results = segment(tree, { x: 0, y: 0 }, { x: 0, y: 0 })
    assert.equal(results.length, 0)
  })

  it('returns empty for empty index', () => {
    const tree = createQuadtree(accessor)
    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 0 })
    assert.equal(results.length, 0)
  })

  it('supports filter option', () => {
    const tree = makeTree([
      { id: 'player', geo: rect(-1, -1, 1, 1), type: 'player' },
      { id: 'wall', geo: rect(5, -1, 7, 1), type: 'wall' },
      { id: 'enemy', geo: rect(10, -1, 12, 1), type: 'enemy' }
    ])

    const results = segment(
      tree,
      { x: 0, y: 0 },
      { x: 15, y: 0 },
      { filter: item => item.type !== 'player' }
    )
    assert.equal(results.length, 2)
    assert.equal(results[0].item.id, 'wall')
    assert.equal(results[1].item.id, 'enemy')
  })

  it('works with point items', () => {
    const tree = makeTree([
      { id: 'a', geo: point(5, 0) },
      { id: 'b', geo: point(5, 5) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 0 })
    assert.equal(results.length, 1)
    assert.equal(results[0].item.id, 'a')
  })

  it('includes items at the endpoint', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(9, -1, 11, 1) }
    ])

    const results = segment(tree, { x: 0, y: 0 }, { x: 10, y: 0 })
    assert.equal(results.length, 1)
  })

  it('throws on non-spatial-index', () => {
    assert.throws(() => segment({}, { x: 0, y: 0 }, { x: 1, y: 0 }), /spatial index/)
  })

  it('throws on NaN from coordinates', () => {
    const tree = makeTree([])
    assert.throws(() => segment(tree, { x: NaN, y: 0 }, { x: 1, y: 0 }), /finite/)
  })

  it('throws on NaN to coordinates', () => {
    const tree = makeTree([])
    assert.throws(() => segment(tree, { x: 0, y: 0 }, { x: 1, y: NaN }), /finite/)
  })

  it('throws on Infinity coordinates', () => {
    const tree = makeTree([])
    assert.throws(() => segment(tree, { x: 0, y: 0 }, { x: Infinity, y: 0 }), /finite/)
  })
})
