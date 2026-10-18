export type PadSize = 'S' | 'M' | 'L'

export interface ShipInfo {
  name: string
  padSize: PadSize
}

export const SHIPS: Readonly<Record<string, ShipInfo>> = {
  SideWinder: { name: 'Sidewinder', padSize: 'S' },
  Eagle: { name: 'Eagle', padSize: 'S' },
  Hauler: { name: 'Hauler', padSize: 'S' },
  Adder: { name: 'Adder', padSize: 'S' },
  Viper: { name: 'Viper MkIII', padSize: 'S' },
  CobraMkIII: { name: 'Cobra MkIII', padSize: 'S' },
  Type6: { name: 'Type-6 Transporter', padSize: 'M' },
  Dolphin: { name: 'Dolphin', padSize: 'S' },
  Type7: { name: 'Type-7 Transporter', padSize: 'L' },
  Asp: { name: 'Asp Explorer', padSize: 'M' },
  Vulture: { name: 'Vulture', padSize: 'S' },
  Empire_Trader: { name: 'Imperial Clipper', padSize: 'L' },
  Federation_Dropship: { name: 'Federal Dropship', padSize: 'M' },
  Orca: { name: 'Orca', padSize: 'L' },
  Type9: { name: 'Type-9 Heavy', padSize: 'L' },
  Python: { name: 'Python', padSize: 'M' },
  BelugaLiner: { name: 'Beluga Liner', padSize: 'L' },
  FerDeLance: { name: 'Fer-de-Lance', padSize: 'M' },
  Anaconda: { name: 'Anaconda', padSize: 'L' },
  Federation_Corvette: { name: 'Federal Corvette', padSize: 'L' },
  Cutter: { name: 'Imperial Cutter', padSize: 'L' },
  DiamondBack: { name: 'Diamondback Scout', padSize: 'S' },
  Empire_Courier: { name: 'Imperial Courier', padSize: 'S' },
  DiamondBackXL: { name: 'Diamondback Explorer', padSize: 'S' },
  Empire_Eagle: { name: 'Imperial Eagle', padSize: 'S' },
  Federation_Dropship_MkII: { name: 'Federal Assault Ship', padSize: 'M' },
  Federation_Gunship: { name: 'Federal Gunship', padSize: 'M' },
  Viper_MkIV: { name: 'Viper MkIV', padSize: 'S' },
  CobraMkIV: { name: 'Cobra MkIV', padSize: 'S' },
  Independant_Trader: { name: 'Keelback', padSize: 'M' },
  Asp_Scout: { name: 'Asp Scout', padSize: 'M' },
  Type9_Military: { name: 'Type-10 Defender', padSize: 'L' },
  Krait_MkII: { name: 'Krait MkII', padSize: 'M' },
  TypeX: { name: 'Alliance Chieftain', padSize: 'M' },
  TypeX_2: { name: 'Alliance Crusader', padSize: 'M' },
  TypeX_3: { name: 'Alliance Challenger', padSize: 'M' },
  Krait_Light: { name: 'Krait Phantom', padSize: 'M' },
  Mamba: { name: 'Mamba', padSize: 'M' },
  Python_NX: { name: 'Python MkII', padSize: 'M' },
  Type8: { name: 'Type-8 Transporter', padSize: 'M' },
  Mandalay: { name: 'Mandalay', padSize: 'M' },
  CobraMkV: { name: 'Cobra MkV', padSize: 'S' },
  Corsair: { name: 'Corsair', padSize: 'M' },
  PantherMkII: { name: 'Panther Clipper MkII', padSize: 'L' },
  LakonMiner: { name: 'Type-11 Prospector', padSize: 'M' },
  Explorer_NX: { name: 'Caspian Explorer', padSize: 'L' },
  SmallCombat01_NX: { name: 'Kestrel Mk II', padSize: 'S' },
  MediumTransport01: { name: 'Lynx Highliner', padSize: 'M' },
}

const SHIPS_BY_NORMALIZED_ID: Readonly<Record<string, ShipInfo>> = Object.fromEntries(
  Object.entries(SHIPS).map(([id, info]) => [id.toLowerCase(), info]),
)

export function getShipInfo(journalShipId: string): ShipInfo | undefined {
  return SHIPS[journalShipId] ?? SHIPS_BY_NORMALIZED_ID[journalShipId.toLowerCase()]
}

export function getRequiredPadSize(journalShipId: string): PadSize | null {
  return getShipInfo(journalShipId)?.padSize ?? null
}
