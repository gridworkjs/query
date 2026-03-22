import { isSpatialIndex } from '@gridworkjs/core/protocol'

export function validateIndex(index) {
  if (!isSpatialIndex(index)) {
    throw new Error('first argument must be a spatial index')
  }
}

export function validateFiniteNumber(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}
