'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';

interface StationMarker {
    uid: number;
    lat: number;
    lon: number;
    aqi: string;
    station: {
        name: string;
        time: string;
    };
}

interface CacheEntry {
    bounds: string;
    data: StationMarker[];
    timestamp: number;
}

// Debounce utility
function useDebounce<T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

// Component to handle map movement with debouncing
function MapController({ onBoundsChange }: { onBoundsChange: (bounds: any) => void }) {
    const map = useMap();
    const debouncedFetch = useDebounce(onBoundsChange, 500);

    useEffect(() => {
        // Initial fetch (immediate)
        onBoundsChange(map.getBounds());

        // Debounced updates on move
        map.on('moveend', () => debouncedFetch(map.getBounds()));

        return () => {
            map.off('moveend');
        };
    }, [map, onBoundsChange, debouncedFetch]);

    return null;
}

interface StatsMapProps {
    onLocationSelect?: (location: string) => void;
}

export default function StatsMap({ onLocationSelect }: StatsMapProps) {
    const { theme } = useTheme();
    const [markers, setMarkers] = useState<StationMarker[]>([]);
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const isLight = theme === 'light';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        }
    }, []);

    const fetchStations = useCallback(async (bounds: any) => {
        const lat1 = bounds.getSouth().toFixed(2);
        const lng1 = bounds.getWest().toFixed(2);
        const lat2 = bounds.getNorth().toFixed(2);
        const lng2 = bounds.getEast().toFixed(2);

        // Create cache key (rounded to reduce cache misses)
        const cacheKey = `${lat1},${lng1},${lat2},${lng2}`;

        // Check cache
        const cached = cacheRef.current.get(cacheKey);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            console.log(`📦 Cache hit for bounds ${cacheKey}`);
            setMarkers(cached.data);
            return;
        }

        setLoading(true);
        try {
            console.log(`🌍 Fetching stations for bounds: [${lat1}, ${lng1}] to [${lat2}, ${lng2}]`);

            const response = await fetch(`http://localhost:5000/api/aqi/bounds?lat1=${lat1}&lng1=${lng1}&lat2=${lat2}&lng2=${lng2}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                const validStations = data.filter((s: any) => s.aqi && s.aqi !== '-');
                console.log(`✅ Loaded ${validStations.length} stations (cached for 5min)`);

                // Update cache
                cacheRef.current.set(cacheKey, {
                    bounds: cacheKey,
                    data: validStations,
                    timestamp: now
                });

                // Clean old cache entries (keep max 10)
                if (cacheRef.current.size > 10) {
                    const firstKey = cacheRef.current.keys().next().value;
                    cacheRef.current.delete(firstKey);
                }

                setMarkers(validStations);
            }
        } catch (err) {
            console.error('Failed to fetch stations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const getColor = (aqiStr: string) => {
        const aqi = parseInt(aqiStr);
        if (isNaN(aqi)) return '#999';
        if (aqi > 300) return '#7e0023';
        if (aqi > 200) return '#8b0000';
        if (aqi > 150) return '#ff0000';
        if (aqi > 100) return '#ff7e00';
        if (aqi > 50) return '#ffd700';
        return '#009966';
    };

    return (
        <div className="h-full w-full overflow-hidden relative z-0 bg-background transition-colors duration-500">
            {loading && (
                <div className="absolute top-4 right-4 z-[500] bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border text-xs font-mono text-primary flex items-center gap-2 shadow-lg">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    UPDATING GRID...
                </div>
            )}

            <div className="absolute top-4 left-4 z-[500] bg-background/80 backdrop-blur px-3 py-1 rounded-lg border border-border text-xs font-mono text-foreground/70 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span>{markers.length} STATIONS ACTIVE</span>
                </div>
            </div>

            <MapContainer
                center={[28.61, 77.20]}
                zoom={11}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%', background: 'transparent' }}
                zoomControl={false}
            >
                {/* Dynamically switch tile layer based on theme */}
                {isLight ? (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />
                ) : (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                )}

                <MapController onBoundsChange={fetchStations} />

                {markers.map((marker) => (
                    <CircleMarker
                        key={marker.uid}
                        center={[marker.lat, marker.lon]}
                        radius={16}
                        pathOptions={{
                            fillColor: getColor(marker.aqi),
                            fillOpacity: 0.9,
                            color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                            weight: 1,
                            opacity: 1
                        }}
                        eventHandlers={{
                            mouseover: (e) => {
                                e.target.setStyle({
                                    weight: 3,
                                    color: isLight ? '#000' : '#fff',
                                    radius: 18
                                });
                                e.target.bringToFront();
                            },
                            mouseout: (e) => {
                                e.target.setStyle({
                                    weight: 1,
                                    color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                                    radius: 16
                                });
                            },
                            click: () => {
                                if (onLocationSelect) {
                                    onLocationSelect(marker.station.name || 'Unknown Location');
                                }
                            }
                        }}
                    >
                        <Tooltip
                            permanent
                            direction="center"
                            className="bg-transparent border-0 shadow-none font-bold font-mono text-[10px]"
                        >
                            {marker.aqi}
                        </Tooltip>

                        <Popup className="glass-popup" closeButton={false}>
                            <div className="min-w-[200px] p-1">
                                <div className="flex justify-between items-start mb-2 pb-2 border-b border-border/10">
                                    <h3 className="font-bold text-sm text-foreground m-0 truncate pr-2" style={{ maxWidth: '180px' }}>
                                        {marker.station.name}
                                    </h3>
                                    <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono">LIVE</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="text-2xl font-bold font-mono"
                                        style={{ color: getColor(marker.aqi) }}
                                    >
                                        {marker.aqi}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-foreground/90">
                                            Station ID: {marker.uid}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Last Updated: {marker.station.time.split('T')[1]?.split('+')[0] || 'Recently'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>

            <style jsx global>{`
                .leaflet-tooltip {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    color: ${isLight ? '#000' : 'white'} !important;
                    font-family: var(--font-mono) !important;
                    font-weight: 700 !important;
                    text-shadow: ${isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.8)'};
                }
                .leaflet-popup-content-wrapper {
                    background: ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 20, 25, 0.85)'} !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid var(--border) !important;
                    border-radius: 12px !important;
                    color: var(--foreground) !important;
                    padding: 0 !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
                }
                .leaflet-popup-tip {
                    background: ${isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 20, 25, 0.85)'} !important;
                }
            `}</style>
        </div>
    );
}
