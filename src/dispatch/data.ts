// Fake fleet data for the dispatcher demo.

export type DriverStatus = 'driving' | 'resting' | 'alarm'

export type Driver = {
  id: string
  name: string
  short: string // "Ержан"
  vehicle: string // "КамАЗ"
  plate: string
  detail: string // time at the wheel or place
  status: DriverStatus
  x: number // position on the map picture (800×440)
  y: number
}

export const drivers: Driver[] = [
  { id: 'erzhan', name: 'Ержан Б.', short: 'Ержан', vehicle: 'КамАЗ', plate: '123 ABC 08', detail: 'M-39, у Кордая', status: 'alarm', x: 462, y: 301 },
  { id: 'asel', name: 'Асель Н.', short: 'Асель', vehicle: 'Фургон', plate: '456 KZA 02', detail: '2 ч 05 мин', status: 'driving', x: 150, y: 206 },
  { id: 'timur', name: 'Тимур К.', short: 'Тимур', vehicle: 'Самосвал', plate: '789 BCD 05', detail: '0 ч 54 мин', status: 'driving', x: 330, y: 279 },
  { id: 'damir', name: 'Дамир С.', short: 'Дамир', vehicle: 'Фургон', plate: '312 AAE 08', detail: 'АЗС, Кордай', status: 'resting', x: 524, y: 286 },
  { id: 'aigerim', name: 'Айгерим Т.', short: 'Айгерим', vehicle: 'Автобус', plate: '905 KZB 02', detail: '1 ч 10 мин', status: 'driving', x: 688, y: 240 },
  { id: 'nurlan', name: 'Нурлан А.', short: 'Нурлан', vehicle: 'КамАЗ', plate: '640 CDE 08', detail: '0 ч 38 мин', status: 'driving', x: 752, y: 250 },
  { id: 'bauyrzhan', name: 'Бауыржан Ж.', short: 'Бауыржан', vehicle: 'Тягач', plate: '218 BBA 05', detail: 'стоянка, Мерке', status: 'resting', x: 278, y: 286 },
  { id: 'sanzhar', name: 'Санжар М.', short: 'Санжар', vehicle: 'Фургон', plate: '777 KZC 02', detail: '1 ч 22 мин', status: 'driving', x: 728, y: 214 },
]

export type EventKind = 'alarm' | 'warning' | 'rest' | 'info' | 'start' | 'done'

export type FleetEvent = {
  minutesAgo: number
  kind: EventKind
  driverId: string
  text: string
}

export const events: FleetEvent[] = [
  { minutesAgo: 3, kind: 'alarm', driverId: 'erzhan', text: 'микросон, трасса M-39' },
  { minutesAgo: 14, kind: 'warning', driverId: 'asel', text: 'зевота, предложена остановка' },
  { minutesAgo: 27, kind: 'warning', driverId: 'timur', text: 'взгляд в телефон' },
  { minutesAgo: 40, kind: 'rest', driverId: 'damir', text: 'остановка на отдых, АЗС у Кордая' },
  { minutesAgo: 53, kind: 'info', driverId: 'erzhan', text: '2 ч за рулём, напоминание об отдыхе' },
  { minutesAgo: 65, kind: 'rest', driverId: 'bauyrzhan', text: 'остановка на отдых, Мерке' },
  { minutesAgo: 93, kind: 'start', driverId: 'aigerim', text: 'начало смены' },
]

// The current alarm (Ержан)
export const alarm = {
  driverId: 'erzhan',
  minutesAgo: 3,
  title: 'микросон',
  place: 'трасса M-39, перед Кордаем',
  atWheel: '2 ч 48 мин за рулём',
}
