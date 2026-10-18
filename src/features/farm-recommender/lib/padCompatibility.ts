import type { PadSize } from '@/features/farm-recommender/model/types'

const PAD_SIZE: Record<PadSize, number> = { S: 1, M: 2, L: 3 }

export function canLand(ship: PadSize, pad: PadSize): boolean {
  return PAD_SIZE[ship] <= PAD_SIZE[pad]
}

export function isPadCompatible(
  maxPadSize: PadSize | undefined,
  requested: PadSize | undefined,
): boolean {
  if (!requested) {
    return true
  }
  if (!maxPadSize) {
    return true
  }

  return canLand(requested, maxPadSize)
}

export type PadSizeOption = PadSize | ''

export const PAD_SIZE_OPTIONS: readonly PadSizeOption[] = ['', 'S', 'M', 'L']

export function isPadOptionAvailable(
  option: PadSizeOption,
  requiredPadSize: PadSize | null,
): boolean {
  if (requiredPadSize === null) {
    return true
  }
  if (option === '') {
    return requiredPadSize === 'S'
  }

  return canLand(requiredPadSize, option)
}
