import type { JournalMission, StoredMission } from '@/entities/mission-store'

export const JOURNAL_MISSIONS: JournalMission[] = [
  {
    missionId: '1064725259',
    name: 'Mission_Courier_RankFed',
    localisedName: 'Курьерское задание от Федерального флота',
    faction: 'Jormungand Empire Group',
    destinationSystem: 'Ngalinn',
    destinationStation: 'Hickam Survey',
    acceptedAt: '2026-09-03T09:31:08Z',
    expiresAt: '2026-09-04T12:30:55Z',
    detailsKnown: true,
  },
  {
    missionId: '1064807315',
    name: 'Mission_Courier',
    localisedName: 'Есть курьерское задание',
    faction: 'Xiancheim Empire League',
    destinationSystem: 'Mainani',
    destinationStation: "Mies van der Rohe's Claim",
    acceptedAt: '2026-09-03T09:31:15Z',
    expiresAt: '2026-09-04T05:29:32Z',
    detailsKnown: true,
  },
  {
    missionId: '1064842368',
    name: 'Mission_Courier',
    localisedName: 'Есть курьерское задание',
    faction: 'HIP 11241 Patrons of Law',
    destinationSystem: 'HIP 9943',
    destinationStation: 'Chebyshev Legacy',
    acceptedAt: '2026-09-03T09:36:50Z',
    expiresAt: '2026-09-04T16:05:27Z',
    detailsKnown: true,
  },
  {
    missionId: '1064842402',
    name: 'Mission_Courier',
    localisedName: 'Есть курьерское задание',
    faction: 'Ngalinn Jet Natural Incorporated',
    destinationSystem: 'Mainani',
    destinationStation: 'Savko Agricultural Garden',
    acceptedAt: '2026-09-03T09:41:02Z',
    expiresAt: '2026-09-04T09:12:40Z',
    detailsKnown: true,
  },
  {
    missionId: '1065214331',
    name: 'Mission_AltruismCredits',
    localisedName: 'Пожертвуйте на дело следующую сумму: 1 000 000 КР.',
    faction: 'Nationals of HIP 6108',
    destinationSystem: 'Ngalinn',
    destinationStation: 'Hickam Survey',
    acceptedAt: '2026-09-03T10:05:20Z',
    expiresAt: '2026-09-04T14:08:18Z',
    detailsKnown: true,
  },
]

export const JOURNAL_MISSIONS_WITH_CARGO: JournalMission[] = [
  {
    missionId: '1064725301',
    name: 'Mission_Delivery',
    localisedName: 'Доставьте груз',
    faction: 'Jormungand Empire Group',
    destinationSystem: 'Mainani',
    destinationStation: "Mies van der Rohe's Claim",
    acceptedAt: '2026-09-03T09:31:08Z',
    detailsKnown: true,
    cargo: {
      commodity: 'foodcartridges',
      commodityLocalised: 'Пищевые брикеты',
      total: 6004,
      delivered: 5040,
      collected: 5040,
      sourceSystem: 'Ngalinn',
      sourceStation: 'Hickam Survey',
    },
  },
]

export const JOURNAL_MISSIONS_CARGO_UNTOUCHED: JournalMission[] = [
  {
    missionId: '1065675014',
    name: 'Mission_DeliveryWing_Boom',
    localisedName: 'Срочно доставьте 5868 шт. товара Снаряжение для выживания',
    faction: 'HIP 11241 Patrons of Law',
    destinationSystem: 'Col 285 Sector SX-B b13-2',
    destinationStation: 'Tull Reach',
    originSystem: 'HIP 11241',
    originStation: 'Esposito City',
    acceptedAt: '2026-09-10T21:20:19Z',
    detailsKnown: true,
    cargo: {
      commodity: '$SurvivalEquipment_Name;',
      commodityLocalised: 'Снаряжение для выживания',
      total: 5868,
    },
  },
]

export const JOURNAL_MISSIONS_COLLECT: JournalMission[] = [
  {
    missionId: '1065842158',
    name: 'Mission_Collect_Industrial',
    localisedName: 'Для производства требуется 490 шт. товара Тритий',
    faction: 'Ngalinn Jet Natural Incorporated',
    destinationSystem: 'Col 285 Sector VD-A b14-1',
    destinationStation: 'Bede Sanctuary',
    acceptedAt: '2026-09-12T20:16:10Z',
    expiresAt: '2026-09-13T20:02:17Z',
    detailsKnown: true,
    cargo: {
      commodity: '$Tritium_Name;',
      commodityLocalised: 'Тритий',
      total: 490,
      inHold: 120,
    },
  },
  JOURNAL_MISSIONS[0]!,
]

export const JOURNAL_MISSIONS_WING_RING: JournalMission[] = [
  {
    ...JOURNAL_MISSIONS_CARGO_UNTOUCHED[0]!,
    cargo: {
      ...JOURNAL_MISSIONS_CARGO_UNTOUCHED[0]!.cargo!,
      collected: 3120,
      delivered: 2080,
      sourceSystem: 'HIP 11241',
      sourceStation: 'Esposito City',
    },
  },
  {
    missionId: '1065668823',
    name: 'Mission_DeliveryWing_Boom',
    localisedName: 'Срочно доставьте 5962 шт. товара Эвакуационное убежище',
    destinationSystem: 'Col 285 Sector MH-M c7-5',
    destinationStation: 'Waxwizard Hub',
    originSystem: 'Col 285 Sector SX-B b13-2',
    originStation: 'Tull Reach',
    acceptedAt: '2026-09-10T20:01:15Z',
    detailsKnown: true,
    cargo: {
      commodityLocalised: 'Эвакуационное убежище',
      total: 5962,
      collected: 3120,
      delivered: 3120,
      sourceSystem: 'Col 285 Sector SX-B b13-2',
      sourceStation: 'Tull Reach',
    },
  },
]

export const JOURNAL_MISSIONS_WITHOUT_DETAILS: JournalMission[] = [
  {
    missionId: '1064807319',
    name: 'Mission_Courier',
    localisedName: 'Есть курьерское задание',
    faction: 'Xiancheim Empire League',
    destinationSystem: 'Ngalinn',
    destinationStation: 'Hickam Survey',
    acceptedAt: '2026-09-03T09:31:20Z',
    detailsKnown: true,
  },
  {
    missionId: '1065195920',
    name: 'Mission_Courier_War_name',
    acceptedAt: '2026-09-03T09:00:00Z',
    detailsKnown: false,
  },
  {
    missionId: '1065195980',
    name: 'Mission_Courier_War_name',
    acceptedAt: '2026-09-03T09:00:00Z',
    detailsKnown: false,
  },
]

export const MANUAL_MISSIONS: StoredMission[] = [
  {
    id: 'demo-manual-1',
    targetSystem: 'HIP 6108',
    targetSystemId: '594592876899',
    targetStation: 'Wheeler Hub',
    targetStationId: '3222047232',
    addedAt: '2026-09-03T09:40:00Z',
  },
  {
    id: 'demo-manual-2',
    targetSystem: 'HIP 6108',
    targetSystemId: '594592876899',
    targetStation: 'Wheeler Hub',
    targetStationId: '3222047232',
    addedAt: '2026-09-03T09:41:00Z',
    completed: true,
  },
  {
    id: 'demo-manual-3',
    targetSystem: 'Mainani',
    targetSystemId: '3107509342922',
    targetStation: 'Hume Mining Exchange',
    targetStationId: '3809652224',
    addedAt: '2026-09-03T09:42:00Z',
  },
]

export const DUPLICATE_MANUAL_MISSIONS: StoredMission[] = [
  {
    id: 'demo-manual-duplicate',
    targetSystem: 'Mainani',
    targetSystemId: '3107509342922',
    targetStation: "Mies van der Rohe's Claim",
    targetStationId: '3222052096',
    addedAt: '2026-09-03T09:45:00Z',
  },
]
