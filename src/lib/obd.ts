// OBD (engine computer) data behind one interface.
// Now: demo module with fake data. Later: a real adapter
// (Web Bluetooth for BLE ELM327 adapters, or the Android app).

export type ObdReading = {
  coolantC: number // engine temperature, °C
  batteryV: number // voltage, V
  codes: string[] // error codes, for example ["P0301"]
}

export interface ObdAdapter {
  readonly name: string
  readonly isDemo: boolean
  connect(): Promise<boolean>
  read(): Promise<ObdReading>
}

export class DemoObd implements ObdAdapter {
  readonly name = 'Демо OBD'
  readonly isDemo = true
  constructor(private scenario: 'ok' | 'problem') {}

  async connect() {
    return true
  }

  async read(): Promise<ObdReading> {
    return { coolantC: 90, batteryV: 14.1, codes: this.scenario === 'problem' ? ['P0301'] : [] }
  }
}

// The app asks for an adapter here. Replace this when a real adapter is ready.
export function getObdAdapter(scenario: 'ok' | 'problem' = 'ok'): ObdAdapter {
  return new DemoObd(scenario)
}
