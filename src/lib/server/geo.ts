import geojsonData from '$lib/data/berlin_bezirke.json';

type Polygon = [number, number][][];

interface BezirkGeo {
	name: string;
	polygons: Polygon;
	bbox: { latMin: number; latMax: number; lngMin: number; lngMax: number };
}

let bezirkGeoCache: Map<string, BezirkGeo> | null = null;

function loadGeoData(): Map<string, BezirkGeo> {
	if (bezirkGeoCache) return bezirkGeoCache;

	const geojson = geojsonData as any;
	bezirkGeoCache = new Map();

	for (const feature of geojson.features) {
		const name: string = feature.properties.name;
		// MultiPolygon: array of polygons, each polygon is array of rings
		// We flatten to a list of rings (outer rings only = index 0 of each polygon)
		const polygons: Polygon = feature.geometry.coordinates.map(
			(poly: number[][][]) => poly[0] // outer ring
		);

		let latMin = Infinity, latMax = -Infinity, lngMin = Infinity, lngMax = -Infinity;
		for (const ring of polygons) {
			for (const [lng, lat] of ring) {
				if (lat < latMin) latMin = lat;
				if (lat > latMax) latMax = lat;
				if (lng < lngMin) lngMin = lng;
				if (lng > lngMax) lngMax = lng;
			}
		}

		bezirkGeoCache.set(name, { name, polygons, bbox: { latMin, latMax, lngMin, lngMax } });
	}

	return bezirkGeoCache;
}

// Ray-casting point-in-polygon
function pointInRing(lat: number, lng: number, ring: [number, number][]): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [lngI, latI] = ring[i];
		const [lngJ, latJ] = ring[j];
		if ((latI > lat) !== (latJ > lat) && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI) {
			inside = !inside;
		}
	}
	return inside;
}

function pointInBezirk(lat: number, lng: number, geo: BezirkGeo): boolean {
	for (const ring of geo.polygons) {
		if (pointInRing(lat, lng, ring)) return true;
	}
	return false;
}

export function randomPointInBezirk(bezirkName: string): { lat: number; lng: number } {
	const geoData = loadGeoData();
	const geo = geoData.get(bezirkName);

	if (!geo) {
		throw new Error(`No geo data for bezirk: ${bezirkName}`);
	}

	const { latMin, latMax, lngMin, lngMax } = geo.bbox;

	for (let attempt = 0; attempt < 1000; attempt++) {
		const lat = latMin + Math.random() * (latMax - latMin);
		const lng = lngMin + Math.random() * (lngMax - lngMin);
		if (pointInBezirk(lat, lng, geo)) {
			return { lat, lng };
		}
	}

	// Fallback: center of bbox (should never happen)
	return { lat: (latMin + latMax) / 2, lng: (lngMin + lngMax) / 2 };
}
