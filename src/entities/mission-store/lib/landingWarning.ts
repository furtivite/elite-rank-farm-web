type PadSize = 'S' | 'M' | 'L'

const PAD_ORDER: Record<PadSize, number> = { S: 1, M: 2, L: 3 }

export type LandingCheck = 'fits' | 'too-small' | 'unknown'

export function landingCheck(
  maxPadSize: PadSize | undefined,
  requiredPadSize: PadSize | null | undefined,
): LandingCheck {
  if (requiredPadSize === null || requiredPadSize === undefined) {
    return 'unknown'
  }

  if (maxPadSize === undefined) {
    return 'unknown'
  }

  return PAD_ORDER[requiredPadSize] <= PAD_ORDER[maxPadSize] ? 'fits' : 'too-small'
}

export function warnsAboutLanding(check: LandingCheck): boolean {
  return check === 'too-small'
}
