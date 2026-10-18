import { FSD_BOOSTER_LY, FSD_CONSTANTS } from '@/entities/commander-state/lib/fsdConstants'

export type LoadoutFacts = {
  unladenMassT: number
  fuelCapacityT: number
  cargoCapacityT?: number
  fuelLevelT?: number
  cargoT?: number
  fsdSymbol?: string
  fsdOptimalMassT?: number
  fsdBoosterSymbol?: string
}

export type JumpRangeEstimate = {
  currentLy: number
  bestLy: number
  ladenLy: number
  currentMassT: number
  cargoKnown: boolean
  fuelKnown: boolean
}

function driveFactor(symbol: string): { factor: number; optMass: number; maxFuel: number } | null {
  const constants = FSD_CONSTANTS[symbol.toLowerCase()]
  if (constants === undefined) {
    return null
  }

  return {
    factor: (constants.maxFuel / constants.fuelMul) ** (1 / constants.fuelPower),
    optMass: constants.optMass,
    maxFuel: constants.maxFuel,
  }
}

export function estimateJumpRange(loadout: LoadoutFacts | null): JumpRangeEstimate | null {
  if (loadout === null || loadout.fsdSymbol === undefined) {
    return null
  }

  const drive = driveFactor(loadout.fsdSymbol)
  if (drive === null) {
    return null
  }

  const optMass = loadout.fsdOptimalMassT ?? drive.optMass
  const boost =
    loadout.fsdBoosterSymbol === undefined
      ? 0
      : (FSD_BOOSTER_LY[loadout.fsdBoosterSymbol.toLowerCase()] ?? 0)

  const range = (massT: number): number => (drive.factor * optMass) / massT + boost

  const fuelKnown = loadout.fuelLevelT !== undefined
  const cargoKnown = loadout.cargoT !== undefined
  const fuelNow = loadout.fuelLevelT ?? loadout.fuelCapacityT
  const cargoNow = loadout.cargoT ?? 0

  return {
    currentLy: range(loadout.unladenMassT + fuelNow + cargoNow),
    bestLy: range(loadout.unladenMassT + drive.maxFuel),
    ladenLy: range(loadout.unladenMassT + loadout.fuelCapacityT + (loadout.cargoCapacityT ?? 0)),
    currentMassT: loadout.unladenMassT + fuelNow + cargoNow,
    cargoKnown,
    fuelKnown,
  }
}
