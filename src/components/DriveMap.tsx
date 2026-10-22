import { useEffect, useRef } from 'react'
import maplibregl, { type Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import { config } from '../config'
import { angleDiff, positionAt, routeLength, routePoints } from '../lib/route'

// Map colors from the design
const C = {
  bg: '#0A1724',
  block: '#0E1E2F',
  park: '#0D1C2C',
  water: '#12304A',
  building: '#132639',
  street: '#172B40',
  main: '#203B55',
  driven: '#2A4A66',
  label: '#7F98AE',
  route: '#5FC7D4',
  glow: '#1B9AAA',
}

// Repaints the OpenFreeMap dark style in the design colors
function paintLikeDesign(style: StyleSpecification) {
  for (const l of style.layers) {
    const id = l.id
    const paint = ((l as { paint?: Record<string, unknown> }).paint ??= {})
    if (l.type === 'background') paint['background-color'] = C.bg
    else if (l.type === 'fill') {
      if (id === 'water') paint['fill-color'] = C.water
      else if (id === 'building') paint['fill-color'] = C.building
      else if (id.includes('park') || id.includes('wood')) paint['fill-color'] = C.park
      else if (id === 'landuse_residential') paint['fill-color'] = C.block
      else paint['fill-color'] = C.bg
    } else if (l.type === 'line') {
      if (id === 'waterway') paint['line-color'] = C.water
      else if (id.includes('motorway') || id.includes('major')) paint['line-color'] = id.includes('casing') ? C.street : C.main
      else if (id.startsWith('boundary')) paint['line-color'] = '#1E3A55'
      else paint['line-color'] = C.street
    } else if (l.type === 'symbol' && paint['text-color'] !== undefined) {
      paint['text-color'] = C.label
      paint['text-halo-color'] = C.bg
    }
  }
  return style
}

// Teal route; the part behind the car is grey
function routeGradient(progress: number, color: string, drivenColor: string) {
  const p = Math.min(0.9999, Math.max(0.0001, progress))
  return ['interpolate', ['linear'], ['line-progress'], 0, drivenColor, p, drivenColor, p + 0.00001, color, 1, color]
}

const carSvg = `
  <svg viewBox="0 0 72 72" width="72" height="72">
    <circle cx="36" cy="36" r="36" fill="#5FC7D4" fill-opacity="0.16"/>
    <polygon points="36,12 54,54 36,44 18,54" fill="#FFFFFF" stroke="#1B9AAA" stroke-width="3" stroke-linejoin="round"/>
  </svg>`

const fuelHtml = (label: string) => `
  <div style="display:flex;flex-direction:row-reverse;align-items:center;gap:8px;font-family:Rubik,system-ui,sans-serif">
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18.5" fill="#0F2236" stroke="#5FC7D4" stroke-width="3"/>
      <path d="M14 28v-14h8v14M13 28h10M22 18h3v7" stroke="#5FC7D4" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div style="padding:6px 12px;border-radius:10px;background:#0F2236;border:1px solid #1E3A55;font-size:15px;font-weight:500;color:#D6EEF2;white-space:nowrap">${label}</div>
  </div>`

type Props = {
  getMeters: () => number // how far the car is from the start
  fuelAt: number | null // show a fuel station marker at this distance; the map zooms out to show it
}

// Full-screen map. The car moves along the route; the map follows it.
export function DriveMap({ getMeters, fuelAt }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const overview = useRef(false)
  overview.current = fuelAt !== null

  useEffect(() => {
    let cleanup = () => {}
    let cancelled = false
    fetch(config.mapStyleUrl)
      .then((r) => r.json())
      .then((style: StyleSpecification) => {
        if (!cancelled) cleanup = setup(paintLikeDesign(style))
      })
      .catch((err) => console.warn('Map style failed to load', err))
    return () => {
      cancelled = true
      cleanup()
    }
  }, [getMeters])

  // Creates the map; returns a function that removes it
  function setup(style: StyleSpecification) {
    const start = positionAt(0)
    const map = new maplibregl.Map({
      container: ref.current!,
      style,
      center: start.pos,
      zoom: config.mapZoom,
      pitch: config.mapPitch,
      bearing: start.heading,
      attributionControl: false,
      interactive: false,
    })
    mapRef.current = map
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')
    // Start with the small "i" button; the credits open on tap
    map.once('load', () => ref.current?.querySelector('.maplibregl-compact-show')?.classList.remove('maplibregl-compact-show'))
    // The car is low on the screen (like the design), more road ahead is visible
    let padTop = window.innerHeight * 0.52
    let padBottom = 0
    let zoom = config.mapZoom

    let routeReady = false
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        lineMetrics: true,
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routePoints } },
      })
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': 24, 'line-opacity': 0.35, 'line-gradient': routeGradient(0, C.glow, 'rgba(0,0,0,0)') as never },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': 10, 'line-gradient': routeGradient(0, C.route, C.driven) as never },
      })
      routeReady = true
    })

    const el = document.createElement('div')
    el.innerHTML = carSvg
    const marker = new maplibregl.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' })
      .setLngLat(start.pos)
      .addTo(map)

    let bearing = start.heading
    let frame = 0
    let lastGradient = 0
    const tick = (now: number) => {
      const m = getMeters()
      const here = positionAt(m)
      // Look a bit ahead so the turn of the map is smooth
      const ahead = positionAt(m + 120)
      const target = (here.heading + angleDiff(here.heading, ahead.heading) / 2 + 360) % 360
      bearing = (bearing + angleDiff(bearing, target) * 0.04 + 360) % 360

      // Overview (Talk about the fuel station): zoom out, car higher above the bottom sheet
      const h = window.innerHeight
      const ov = overview.current
      zoom += ((ov ? 10.5 : config.mapZoom) - zoom) * 0.05
      padTop += ((ov ? 0 : h * 0.52) - padTop) * 0.05
      padBottom += ((ov ? h * 0.29 : 0) - padBottom) * 0.05

      marker.setLngLat(here.pos)
      marker.setRotation(here.heading)
      map.jumpTo({ center: here.pos, bearing, zoom, padding: { top: padTop, bottom: padBottom, left: 0, right: 0 } })

      if (routeReady && now - lastGradient > 500) {
        lastGradient = now
        const p = m / routeLength
        map.setPaintProperty('route-line', 'line-gradient', routeGradient(p, C.route, C.driven))
        map.setPaintProperty('route-glow', 'line-gradient', routeGradient(p, C.glow, 'rgba(0,0,0,0)'))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
    }
  }

  // Fuel station marker (Talk screen)
  useEffect(() => {
    const map = mapRef.current
    if (!map || fuelAt === null) return
    const el = document.createElement('div')
    el.innerHTML = fuelHtml('Заправка · 12 км')
    // Label on the left: the route goes east, so the right side is often off screen
    const marker = new maplibregl.Marker({ element: el, anchor: 'right', offset: [20, 0] })
      .setLngLat(positionAt(fuelAt).pos)
      .addTo(map)
    return () => {
      marker.remove()
    }
  }, [fuelAt])

  return <div ref={ref} className="absolute inset-0 bg-[#0A1724]" />
}
