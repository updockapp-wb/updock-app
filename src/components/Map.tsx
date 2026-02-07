import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import Map, { NavigationControl, GeolocateControl, Source, Layer, Marker, type LayerProps, type MapRef, type GeoJSONSource } from 'react-map-gl';
import { type Spot, type StartType } from '../data/spots';
import AddSpotInfoModal from './AddSpotInfoModal';
import AddSpotForm from './AddSpotForm';
import FiltersModal from './FiltersModal';
import { SlidersHorizontal, X, Search, MapPin } from 'lucide-react';
import { useSpots } from '../context/SpotsContext';
import { useLanguage } from '../context/LanguageContext';
import { mapboxConfig } from '../config/mapbox';
import type { FeatureCollection } from 'geojson';
import SearchModal from './SearchModal';

// Layer Styles
const clusterLayer: LayerProps = {
    id: 'clusters',
    type: 'circle',
    source: 'spots',
    filter: ['has', 'point_count'],
    paint: {
        'circle-color': [
            'step',
            ['get', 'point_count'],
            '#22d3ee', // Cyan-400 (< 5)
            5,
            '#38bdf8', // Sky-400 (5-20)
            20,
            '#ffffff'  // White (> 20)
        ],
        'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
    }
};

const clusterCountLayer: LayerProps = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'spots',
    filter: ['has', 'point_count'],
    layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
    },
    paint: {
        'text-color': [
            'step',
            ['get', 'point_count'],
            '#ffffff', // White text on Cyan
            5,
            '#ffffff', // White text on Sky Blue
            20,
            '#0f172a'  // Dark text on White circle
        ]
    }
};

const unclusteredPointLayer: LayerProps = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'spots',
    filter: ['!', ['has', 'point_count']],
    paint: {
        'circle-color': [
            'case',
            ['==', ['get', 'is_approved'], false], '#f97316', // Orange for pending spots
            [
                'match',
                ['get', 'type'],
                'Dockstart', '#38bdf8',
                'Rockstart', '#f472b6',
                'Dropstart', '#2dd4bf',
                'Deadstart', '#818cf8',
                'Rampstart', '#fbbf24',
                '#38bdf8' // default
            ]
        ],
        'circle-radius': 10,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#fff',
        'circle-opacity': 1,
    }
};

interface MapProps {
    onSpotClick: (spot: Spot) => void;
    selectedSpot: Spot | null;
    onSpotSelect?: (spot: Spot) => void;
    isAddingSpotMode: boolean;
    onSetAddingSpotMode: (isAdding: boolean) => void;
}

export default function MapComponent({ onSpotClick, selectedSpot, isAddingSpotMode, onSetAddingSpotMode }: MapProps) {
    const mapRef = useRef<MapRef>(null);
    const { spots } = useSpots();
    const { t } = useLanguage();
    const [filter, setFilter] = useState<StartType | 'All'>('All');

    // UI States
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    // Removed internal isAddingSpotMode state
    const [newSpotPosition, setNewSpotPosition] = useState<[number, number] | null>(null);

    // Effect: Fly to selected spot
    useEffect(() => {
        if (selectedSpot && mapRef.current) {
            const map = mapRef.current.getMap();
            const performFlyTo = () => {
                map.flyTo({
                    center: [selectedSpot.position[1], selectedSpot.position[0]],
                    zoom: 16,
                    duration: 1500,
                    essential: true
                });
            };

            if (map && map.loaded()) {
                performFlyTo();
            } else if (map) {
                map.once('style.load', performFlyTo);
            }
        }
    }, [selectedSpot]);

    const spotsGeoJson: FeatureCollection = useMemo(() => {
        const filtered = filter === 'All' ? spots : spots.filter(s => s.type.includes(filter as StartType));
        return {
            type: 'FeatureCollection',
            features: filtered.map(spot => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [spot.position[1], spot.position[0]]
                },
                properties: {
                    id: spot.id,
                    name: spot.name,
                    type: spot.type[0],
                    is_approved: spot.is_approved
                }
            }))
        };
    }, [spots, filter]);

    // Local state to track if user has seen the info modal for this session/action
    const [hasAcknowledgedInfo, setHasAcknowledgedInfo] = useState(false);

    // Effect: When entering add mode from App (prop), reset acknowledgment if needed
    // Actually, simpler: Show InfoModal if isAddingSpotMode && !hasAcknowledgedInfo
    // Show Crosshair/Banner if isAddingSpotMode && hasAcknowledgedInfo

    // Derived state for Map interaction
    const isInteractingWithMap = isAddingSpotMode && hasAcknowledgedInfo;

    // Handle map click
    const onMapClick = useCallback((event: any) => {
        if (isInteractingWithMap) {
            const { lng, lat } = event.lngLat;
            setNewSpotPosition([lat, lng]);
            setIsAddFormOpen(true);
            onSetAddingSpotMode(false);
            setHasAcknowledgedInfo(false);
            return;
        }

        const feature = event.features?.[0];

        // Handle Cluster Click
        if (feature?.layer?.id === 'clusters') {
            const clusterId = feature.properties.cluster_id;
            const mapboxSource = mapRef.current?.getSource('spots') as GeoJSONSource;

            mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err || !mapRef.current) return;

                mapRef.current.easeTo({
                    center: feature.geometry.coordinates,
                    zoom: zoom ?? 14,
                    duration: 500
                });
            });
            return;
        }

        // Handle Unclustered Point Click
        if (feature?.layer?.id === 'unclustered-point') {
            const spotData = feature.properties;
            const fullSpot = spots.find(s => s.id === spotData.id);

            if (fullSpot) {
                onSpotClick(fullSpot);
            }
            return;
        }
    }, [isInteractingWithMap, spots, onSpotClick, onSetAddingSpotMode]);

    // Cursor handling
    const [cursor, setCursor] = useState<string>('grab');
    const onMouseEnter = useCallback(() => setCursor('pointer'), []);
    const onMouseLeave = useCallback(() => setCursor('grab'), []);

    const handleSpotSubmit = () => {
        setIsAddFormOpen(false);
        setNewSpotPosition(null);
    };

    return (
        <div className="w-full h-full relative bg-slate-900">
            {/* SOLID TOP BAR */}
            <div className="absolute top-0 left-0 right-0 min-h-[70px] pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] bg-white/95 backdrop-blur-md z-[1000] shadow-sm flex items-center justify-between px-4 border-b border-white/10 pointer-events-auto">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <Search size={22} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-900 text-lg tracking-tight">UPDOCK</span>
                    {filter !== 'All' && <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">{filter}</span>}
                </div>

                <button
                    onClick={() => setIsFiltersOpen(true)}
                    className={`w-10 h-10 flex items-center justify-center transition-colors rounded-full ${filter !== 'All' ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <SlidersHorizontal size={22} />
                </button>
            </div>

            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 0,
                    latitude: 20,
                    zoom: 1.5
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapboxConfig.styleUrl}
                mapboxAccessToken={mapboxConfig.accessToken}
                projection={{ name: 'globe' }}
                onLoad={() => {
                    // 1. If we have a selected spot, prioritize it
                    if (selectedSpot) {
                        mapRef.current?.flyTo({
                            center: [selectedSpot.position[1], selectedSpot.position[0]],
                            zoom: 16,
                            duration: 2000,
                            essential: true
                        });
                        return; // Skip geolocation if we have a spot
                    }

                    // 2. Otherwise animation to user position
                    if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                mapRef.current?.flyTo({
                                    center: [position.coords.longitude, position.coords.latitude],
                                    zoom: 12,
                                    duration: 3500,
                                    essential: true
                                });
                            },
                            (_error) => {
                                // Staying on globe view if denied
                            }
                        );
                    }
                }}
                onClick={onMapClick}
                cursor={isInteractingWithMap ? 'crosshair' : cursor}
                interactiveLayerIds={!isInteractingWithMap ? ['clusters', 'unclustered-point'] : undefined}
                onMouseEnter={!isInteractingWithMap ? onMouseEnter : undefined}
                onMouseLeave={!isInteractingWithMap ? onMouseLeave : undefined}
                fog={{
                    range: [1.0, 8.0],
                    color: '#242B4B',
                    'horizon-blend': 0.1
                }}
                terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            >
                <GeolocateControl position="bottom-right" style={{ marginBottom: '10px' }} />
                <NavigationControl position="bottom-right" style={{ marginBottom: '130px' }} />

                <Source
                    id="spots"
                    type="geojson"
                    data={spotsGeoJson}
                    cluster={true}
                    clusterMaxZoom={14}
                    clusterRadius={50}
                >
                    <Layer {...clusterLayer} />
                    <Layer {...clusterCountLayer} />
                    <Layer {...unclusteredPointLayer} />
                </Source>

                {/* New Spot Marker Preview */}
                {newSpotPosition && (
                    <Marker longitude={newSpotPosition[1]} latitude={newSpotPosition[0]} anchor="bottom">
                        <div className="w-6 h-6 bg-white rounded-full border-4 border-slate-900 animate-bounce" />
                    </Marker>
                )}
            </Map>

            {/* Instruction Banner - Only show if acknowledged and in placing mode */}
            {isInteractingWithMap && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 w-full px-4 flex justify-center pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 pointer-events-auto max-w-sm">
                        <div className="bg-sky-500/20 p-2 rounded-full">
                            <MapPin className="text-sky-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">{t('add.instruction.title') || "Tap on the map"}</p>
                            <p className="text-xs text-slate-300">{t('add.instruction.desc') || "Select exact location"}</p>
                        </div>
                        <button
                            onClick={() => {
                                onSetAddingSpotMode(false);
                                setHasAcknowledgedInfo(false);
                            }}
                            className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Add Spot Info Modal */}
            <AddSpotInfoModal
                isOpen={isAddingSpotMode && !hasAcknowledgedInfo}
                onClose={() => {
                    onSetAddingSpotMode(false);
                    setHasAcknowledgedInfo(false);
                }}
                onContinue={() => {
                    setHasAcknowledgedInfo(true);
                }}
            />

            {/* Add Spot Form */}
            <AddSpotForm
                isOpen={isAddFormOpen}
                onClose={() => {
                    setIsAddFormOpen(false);
                    setNewSpotPosition(null);
                }}
                onSubmit={handleSpotSubmit}
                position={newSpotPosition}
            />

            <FiltersModal
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                selectedFilter={filter}
                onFilterChange={setFilter}
            />

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSpotSelect={(spot) => {
                    setIsSearchOpen(false);
                    // Fly to spot
                    mapRef.current?.flyTo({
                        center: [spot.position[1], spot.position[0]],
                        zoom: 15,
                        duration: 2000,
                        essential: true
                    });
                    // Open detail
                    onSpotClick(spot);
                }}
            />
        </div>
    );
}
