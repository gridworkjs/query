import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { within } from '../src/within.js'
import { createQuadtree } from '@gridworkjs/quadtree'
import { point, rect, circle, bounds } from '@gridworkjs/core'

const accessor = item => bounds(item.geo)

function makeTree(items) {
  const tree = createQuadtree(accessor)
  for (const item of items) tree.insert(item)
  return tree
}

describe('within', () => {
  it('finds items fully contained within a region', () => {
    const tree = makeTree([
      { id: 'inside', geo: point(5, 5) },
      { id: 'outside', geo: point(15, 15) }
    ])

    const results = within(tree, accessor, rect(0, 0, 10, 10))
    assert.equal(results.length, 1)
    assert.equal(results[0].id, 'inside')
  })

  it('excludes items that only partially overlap', () => {
    const tree = makeTree([
      { id: 'partial', geo: rect(8, 8, 12, 12) },
      { id: 'full', geo: rect(2, 2, 4, 4) }
    ])

    const results = within(tree, accessor, rect(0, 0, 10, 10))
    assert.equal(results.length, 1)
    assert.equal(results[0].id, 'full')
  })

  it('includes items on the boundary', () => {
    const tree = makeTree([
      { id: 'edge', geo: point(10, 10) }
    ])

    const results = within(tree, accessor, rect(0, 0, 10, 10))
    assert.equal(results.length, 1)
  })

  it('returns all items when region covers everything', () => {
    const tree = makeTree([
      { id: 'a', geo: point(1, 1) },
      { id: 'b', geo: point(5, 5) },
      { id: 'c', geo: point(9, 9) }
    ])

    const results = within(tree, accessor, rect(-100, -100, 100, 100))
    assert.equal(results.length, 3)
  })

  it('returns empty when nothing is contained', () => {
    const tree = makeTree([
      { id: 'a', geo: rect(0, 0, 20, 20) }
    ])

    const results = within(tree, accessor, rect(5, 5, 10, 10))
    assert.equal(results.length, 0)
  })

  it('works with circle region', () => {
    const tree = makeTree([
      { id: 'a', geo: point(5, 5) },
      { id: 'b', geo: point(50, 50) }
    ])

    const results = within(tree, accessor, circle(5, 5, 10))
    assert.equal(results.length, 1)
    assert.equal(results[0].id, 'a')
  })

  it('works with bounds objects as region', () => {
    const tree = makeTree([
      { id: 'a', geo: point(5, 5) }
    ])

    const results = within(tree, accessor, { minX: 0, minY: 0, maxX: 10, maxY: 10 })
    assert.equal(results.length, 1)
  })

  it('returns empty for empty index', () => {
    const tree = createQuadtree(accessor)
    const results = within(tree, accessor, rect(0, 0, 100, 100))
    assert.equal(results.length, 0)
  })

  it('throws on non-spatial-index', () => {
    assert.throws(() => within({}, accessor, rect(0, 0, 10, 10)), /spatial index/)
  })

  it('throws on invalid accessor', () => {
    const tree = makeTree([])
    assert.throws(() => within(tree, null, rect(0, 0, 10, 10)), /accessor/)
  })
})
