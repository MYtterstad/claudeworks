'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// Dynamically load Leaflet with proper error handling
const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.L) {
      resolve(window.L)
      return
    }

    // Load CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    link.onerror = () => reject(new Error('Failed to load Leaflet CSS'))
    document.head.appendChild(link)

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => {
      if (window.L) {
        resolve(window.L)
      } else {
        reject(new Error('Leaflet JS loaded but window.L is undefined'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load Leaflet JS'))
    document.head.appendChild(script)
  })
}

// Haversine distance between two coordinates (in km)
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Simple A* pathfinding
const findPath = (graph, start, end, maxSteps = 1000) => {
  const openSet = [start]
  const cameFrom = new Map()
  const gScore = new Map()
  const fScore = new Map()

  const heuristic = (a, b) => haversine(a.lat, a.lon, b.lat, b.lon)
  const key = (n) => `${n.id}`

  gScore.set(key(start), 0)
  fScore.set(key(start), heuristic(start, end))

  let steps = 0
  while (openSet.length > 0 && steps < maxSteps) {
    steps++
    let current = openSet[0]
    let currentIdx = 0
    for (let i = 1; i < openSet.length; i++) {
      if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
        current = openSet[i]
        currentIdx = i
      }
    }

    if (Math.abs(current.lat - end.lat) < 0.0001 && Math.abs(current.lon - end.lon) < 0.0001) {
      const path = [current]
      let c = current
      while (cameFrom.has(key(c))) {
        c = cameFrom.get(key(c))
        path.unshift(c)
      }
      return path
    }

    openSet.splice(currentIdx, 1)

    if (!graph.has(key(current))) continue
    const neighbors = graph.get(key(current)) || []

    for (const neighbor of neighbors) {
      const tentativeGScore =
        gScore.get(key(current)) + haversine(current.lat, current.lon, neighbor.lat, neighbor.lon)

      if (!gScore.has(key(neighbor)) || tentativeGScore < gScore.get(key(neighbor))) {
        cameFrom.set(key(neighbor), current)
        gScore.set(key(neighbor), tentativeGScore)
        fScore.set(key(neighbor), tentativeGScore + heuristic(neighbor, end))

        if (!openSet.some((n) => key(n) === key(neighbor))) {
          openSet.push(neighbor)
        }
      }
    }
  }

  return null
}

// Generate a loop route
const generateLoopRoute = (userLat, userLon, targetDist, osmGraph) => {
  if (osmGraph.size === 0) return null

  const nodes = Array.from(osmGraph.keys()).map((k) => {
    const parts = k.split(',')
    return { id: k, lat: parseFloat(parts[0]), lon: parseFloat(parts[1]) }
  })

  if (nodes.length === 0) return null

  // Pick a random outbound direction
  const startIdx = Math.floor(Math.random() * nodes.length)
  let current = nodes[startIdx]

  // Walk out roughly half the target distance
  const halfDist = targetDist / 2
  let routeOut = [{ lat: userLat, lon: userLon }]
  let distOut = 0
  const visited = new Set()
  visited.add(`${current.id}`)

  for (let i = 0; i < 50 && distOut < halfDist; i++) {
    const neighbors = osmGraph.get(current.id) || []
    if (neighbors.length === 0) break

    const unvisited = neighbors.filter((n) => !visited.has(n.id))
    let next = unvisited.length > 0 ? unvisited[0] : neighbors[0]

    const edgeDist = haversine(current.lat, current.lon, next.lat, next.lon)
    routeOut.push(next)
    visited.add(next.id)
    distOut += edgeDist
    current = next
  }

  // Find path back to start
  const startPoint = { id: 'start', lat: userLat, lon: userLon }
  const pathBack = findPath(osmGraph, current, startPoint, 2000)

  if (!pathBack) {
    // Fallback: just return outbound route repeated
    return [...routeOut, ...routeOut.reverse()]
  }

  const route = [...routeOut, ...pathBack]
  const totalDist = route.reduce((sum, p, i) => {
    if (i === 0) return 0
    return sum + haversine(route[i - 1].lat, route[i - 1].lon, p.lat, p.lon)
  }, 0)

  return route.length > 2 ? route : null
}

export default function RunnerApp() {
  const mapContainer = useRef(null)
  const mapInstance = useRef(null)
  const leafletRef = useRef(null)

  const [userLat, setUserLat] = useState(57.7089)
  const [userLon, setUserLon] = useState(11.9746)
  const [distance, setDistance] = useState(5)
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pois, setPois] = useState([])
  const [routeStats, setRouteStats] = useState(null)
  const [error, setError] = useState('')
  const [leafletReady, setLeafletReady] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Load Leaflet library
  useEffect(() => {
    if (leafletRef.current) return

    loadLeaflet()
      .then((L) => {
        leafletRef.current = L
        setLeafletReady(true)
      })
      .catch((err) => {
        setError('Failed to load map library: ' + err.message)
      })
  }, [])

  // Initialize map once Leaflet is ready AND container exists
  useEffect(() => {
    if (!leafletReady || !mapContainer.current || mapInstance.current) return

    try {
      const L = leafletRef.current
      const map = L.map(mapContainer.current).setView([userLat, userLon], 14)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstance.current = map
      setMapReady(true)

      // User location marker
      L.circleMarker([userLat, userLon], {
        radius: 8,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup('You are here')
    } catch (err) {
      setError('Failed to initialize map: ' + err.message)
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [leafletReady])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude)
          setUserLon(position.coords.longitude)
        },
        () => {
          // Use default (Gothenburg)
        }
      )
    }
  }, [])

  // Fetch OSM data and generate route
  const generateRoute = useCallback(async () => {
    setLoading(true)
    setError('')
    setPois([])

    try {
      const L = leafletRef.current
      const map = mapInstance.current

      if (!L || !map) {
        setError('Map is not ready yet. Please wait a moment and try again.')
        setLoading(false)
        return
      }

      // Bounding box (roughly 5km around user)
      const latDelta = 0.045
      const lonDelta = 0.06
      const bbox = `${userLat - latDelta},${userLon - lonDelta},${userLat + latDelta},${userLon + lonDelta}`

      // Fetch streets
      const streetQuery = `[out:json];way["highway"~"residential|tertiary|secondary|primary|footway|path|cycleway|pedestrian|living_street|unclassified"](${bbox});(._;>;);out body;`

      const streetRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(streetQuery),
      })
      const streetData = await streetRes.json()

      // Parse nodes and ways
      const nodeMap = new Map()
      for (const elem of streetData.elements) {
        if (elem.type === 'node') {
          nodeMap.set(elem.id, elem)
        }
      }

      // Build graph
      const graph = new Map()
      for (const elem of streetData.elements) {
        if (elem.type === 'way' && elem.nodes && elem.nodes.length > 1) {
          for (let i = 0; i < elem.nodes.length - 1; i++) {
            const n1 = nodeMap.get(elem.nodes[i])
            const n2 = nodeMap.get(elem.nodes[i + 1])

            if (n1 && n2) {
              const key1 = `${n1.lat},${n1.lon}`
              const key2 = `${n2.lat},${n2.lon}`

              if (!graph.has(key1)) graph.set(key1, [])
              if (!graph.has(key2)) graph.set(key2, [])

              const node1 = { id: key1, lat: n1.lat, lon: n1.lon }
              const node2 = { id: key2, lat: n2.lat, lon: n2.lon }

              graph.get(key1).push(node2)
              graph.get(key2).push(node1)
            }
          }
        }
      }

      // Generate route
      const generatedRoute = generateLoopRoute(userLat, userLon, distance, graph)

      if (!generatedRoute) {
        setError('Could not generate route. Try again or adjust distance.')
        setLoading(false)
        return
      }

      // Calculate stats
      const totalDist = generatedRoute.reduce((sum, p, i) => {
        if (i === 0) return 0
        return sum + haversine(generatedRoute[i - 1].lat, generatedRoute[i - 1].lon, p.lat, p.lon)
      }, 0)

      const pace = 5.5 // km/min
      const timeMin = Math.round((totalDist / pace) * 60)

      setRoute(generatedRoute)
      setRouteStats({
        distance: totalDist.toFixed(2),
        time: timeMin,
      })

      // Fetch POIs
      const poiQuery = `[out:json];(node["tourism"~"museum|viewpoint|attraction|landmark"](${bbox});node["historic"~"memorial|monument|castle|ruins"](${bbox});node["amenity"~"cafe|restaurant|pub|viewpoint"](${bbox}););out center;`

      const poiRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(poiQuery),
      })
      const poiData = await poiRes.json()

      const poiList = poiData.elements
        .filter((e) => e.lat && e.lon)
        .map((e) => ({
          lat: e.lat,
          lon: e.lon,
          name: e.tags?.name || 'POI',
          type: e.tags?.tourism || e.tags?.historic || e.tags?.amenity || 'point',
        }))
        .slice(0, 15)

      setPois(poiList)

      // Clear old route lines and POI markers
      if (map) {
        map.eachLayer((layer) => {
          if (layer instanceof L.Polyline && layer !== map) {
            map.removeLayer(layer)
          }
          if (layer instanceof L.Marker && layer._popup?.getContent?.() !== 'You are here') {
            map.removeLayer(layer)
          }
        })

        // Draw route
        const routeCoords = generatedRoute.map((p) => [p.lat, p.lon])
        L.polyline(routeCoords, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
        }).addTo(map)

        // Draw POI markers
        for (const poi of poiList) {
          L.circleMarker([poi.lat, poi.lon], {
            radius: 5,
            fillColor: '#fbbf24',
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .addTo(map)
            .bindPopup(poi.name)
        }

        // Fit bounds
        if (routeCoords.length > 0) {
          const bounds = L.latLngBounds(routeCoords)
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    } catch (err) {
      setError('Error generating route: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [userLat, userLon, distance])

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    mapArea: {
      flex: '0 0 70%',
      position: 'relative',
    },
    mapContainer: {
      width: '100%',
      height: '100%',
    },
    sidebar: {
      flex: '0 0 30%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e293b',
      borderLeft: '1px solid #334155',
      padding: '24px',
      overflowY: 'auto',
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#f1f5f9',
    },
    section: {
      marginBottom: '20px',
    },
    label: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#cbd5e1',
      marginBottom: '6px',
      display: 'block',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    slider: {
      width: '100%',
      accentColor: '#3b82f6',
      marginBottom: '8px',
    },
    valueDisplay: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#60a5fa',
      marginBottom: '12px',
    },
    button: {
      width: '100%',
      padding: '10px 16px',
      backgroundColor: '#3b82f6',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'background-color 0.2s',
      marginBottom: '16px',
    },
    buttonHover: {
      backgroundColor: '#2563eb',
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '16px',
    },
    statCard: {
      backgroundColor: '#0f172a',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #334155',
      textAlign: 'center',
    },
    statValue: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#fbbf24',
    },
    statLabel: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    poiList: {
      backgroundColor: '#0f172a',
      borderRadius: '6px',
      border: '1px solid #334155',
      maxHeight: '250px',
      overflowY: 'auto',
      padding: '8px',
    },
    poiItem: {
      padding: '8px',
      borderBottom: '1px solid #334155',
      fontSize: '12px',
      color: '#cbd5e1',
    },
    poiName: {
      color: '#60a5fa',
      fontWeight: '600',
    },
    poiType: {
      color: '#94a3b8',
      fontSize: '10px',
      marginTop: '2px',
    },
    error: {
      backgroundColor: '#7f1d1d',
      color: '#fca5a5',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '12px',
      marginBottom: '12px',
      border: '1px solid #ef4444',
    },
    loading: {
      textAlign: 'center',
      color: '#94a3b8',
      fontStyle: 'italic',
      padding: '12px',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.mapArea}>
        <div
          ref={mapContainer}
          style={styles.mapContainer}
          className='leaflet-container'
        />
      </div>

      <div style={styles.sidebar}>
        <div style={styles.title}>City Explorer</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px', fontStyle: 'italic' }}>Plan runs, walks & sightseeing routes</div>

        <div style={styles.section}>
          <label style={styles.label}>Target Distance</label>
          <input
            type='range'
            min='1'
            max='20'
            step='0.5'
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <div style={styles.valueDisplay}>{distance.toFixed(1)} km</div>
        </div>

        <button
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? 'none' : 'auto',
          }}
          onClick={generateRoute}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563eb')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#3b82f6')}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Route'}
        </button>

        {error && <div style={styles.error}>{error}</div>}

        {routeStats && (
          <div style={styles.section}>
            <label style={styles.label}>Route Stats</label>
            <div style={styles.stats}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{routeStats.distance}</div>
                <div style={styles.statLabel}>km</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{routeStats.time}</div>
                <div style={styles.statLabel}>min @ 5:30/km</div>
              </div>
            </div>
          </div>
        )}

        {pois.length > 0 && (
          <div style={styles.section}>
            <label style={styles.label}>Points of Interest</label>
            <div style={styles.poiList}>
              {pois.map((poi, idx) => (
                <div key={idx} style={styles.poiItem}>
                  <div style={styles.poiName}>{poi.name}</div>
                  <div style={styles.poiType}>{poi.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div style={styles.loading}>Fetching map data...</div>}
      </div>
    </div>
  )
}
