<script lang="ts">
	import { onMount } from 'svelte';
	import type { Persona } from '$lib/types';

	let { personas = $bindable([]), onPersonaClick }: { personas: Persona[]; onPersonaClick?: (p: Persona) => void } = $props();

	let mapContainer: HTMLDivElement;
	let map: any = $state(null);
	let markers: Map<number, any> = new Map();
	let bezirkLayers: Map<string, any> = new Map();
	let L: any = $state(null);

	// Berlin bounds to lock the view
	const berlinBounds: [[number, number], [number, number]] = [[52.34, 13.08], [52.68, 13.77]];

	function animateRadius(marker: any, from: number, to: number, duration: number) {
		const start = performance.now();
		function step(now: number) {
			const t = Math.min((now - start) / duration, 1);
			const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
			marker.setRadius(from + (to - from) * eased);
			if (t < 1) requestAnimationFrame(step);
		}
		marker.setRadius(from);
		requestAnimationFrame(step);
	}

	function getColor(persona: Persona): string {
		if (persona.haltung === undefined) return '#9CA3AF';
		switch (persona.haltung) {
			case 'positiv': return '#22C55E';
			case 'negativ': return '#EF4444';
			case 'neutral': return '#EAB308';
			default: return '#9CA3AF';
		}
	}

	function buildTooltip(p: Persona): string {
		const migration = p.migrationshintergrund ? `Migrationshintergrund: ${p.herkunft}` : 'kein Migrationshintergrund';
		let tooltip = `<strong>${p.name}</strong>, ${p.alter}, ${p.geschlecht}<br/>`;
		tooltip += `${p.bezirk} | ${migration}<br/>`;
		tooltip += `Bildung: ${p.bildung} | ${p.erwerbsstatus}<br/>`;
		tooltip += `Wählt: ${p.partei} (${p.politische_tendenz})`;

		if (p.bewertung !== undefined) {
			tooltip += `<br/><hr style="margin:4px 0;border-color:#555"/>`;
			tooltip += `Bewertung: ${p.bewertung}/5 (${p.haltung})<br/>`;
			tooltip += `<em>"${p.begruendung}"</em>`;
		}
		return tooltip;
	}

	function getBezirkFillColor(bezirkName: string): { fillColor: string; fillOpacity: number } {
		const bezirkPersonas = personas.filter(
			(p) => p.bezirk === bezirkName && p.bewertung !== undefined
		);
		if (bezirkPersonas.length === 0) return { fillColor: '#1e3a5f', fillOpacity: 0.15 };

		const avg = bezirkPersonas.reduce((sum, p) => sum + p.bewertung!, 0) / bezirkPersonas.length;
		// 1-2.3 = red, 2.3-3.7 = yellow, 3.7-5 = green
		if (avg < 2.3) return { fillColor: '#EF4444', fillOpacity: 0.25 };
		if (avg < 3.7) return { fillColor: '#EAB308', fillOpacity: 0.20 };
		return { fillColor: '#22C55E', fillOpacity: 0.25 };
	}

	function updateBezirkColors() {
		for (const [name, layer] of bezirkLayers) {
			const { fillColor, fillOpacity } = getBezirkFillColor(name);
			layer.setStyle({ fillColor, fillOpacity });
		}
	}

	async function loadBezirksgrenzen() {
		const res = await fetch('/berlin_bezirke.geojson');
		const geojson = await res.json();

		L.geoJSON(geojson, {
			style: {
				color: '#60a5fa',
				weight: 2,
				fillColor: '#1e3a5f',
				fillOpacity: 0.15,
				dashArray: '4 4'
			},
			onEachFeature: (feature: any, layer: any) => {
				const name = feature.properties?.name;
				if (name) {
					bezirkLayers.set(name, layer);
					layer.bindTooltip(name, {
						permanent: true,
						direction: 'center',
						className: 'bezirk-label'
					});
				}
			}
		}).addTo(map);
	}

	onMount(async () => {
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapContainer, {
			maxBounds: berlinBounds,
			maxBoundsViscosity: 1.0,
			minZoom: 10,
			maxZoom: 15
		}).fitBounds(berlinBounds);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
		}).addTo(map);

		await loadBezirksgrenzen();
	});

	$effect(() => {
		if (!map || !L) return;

		// Remove markers that no longer exist in personas
		const currentIds = new Set(personas.map((p) => p.id));
		for (const [id, marker] of markers) {
			if (!currentIds.has(id)) {
				marker.remove();
				markers.delete(id);
			}
		}

		for (const persona of personas) {
			const existing = markers.get(persona.id);
			if (existing) {
				const prevColor = existing.options.fillColor;
				const newColor = getColor(persona);
				existing.setStyle({ fillColor: newColor, color: newColor });
				existing.setTooltipContent(buildTooltip(persona));
				if (prevColor !== newColor) {
					animateRadius(existing, 14, 7, 400);
				}
			} else {
				const marker = L.circleMarker([persona.lat, persona.lng], {
					radius: 7,
					fillColor: getColor(persona),
					color: getColor(persona),
					fillOpacity: 0.8,
					weight: 1,
					opacity: 0.9
				}).addTo(map);

				marker.bindTooltip(buildTooltip(persona), {
					className: 'persona-tooltip',
					maxWidth: 320
				});

				if (onPersonaClick) {
					marker.on('click', () => onPersonaClick!(persona));
				}

				markers.set(persona.id, marker);
			}
		}

		updateBezirkColors();
	});
</script>

<div bind:this={mapContainer} class="w-full h-full rounded-lg"></div>

<style>
	:global(.persona-tooltip) {
		background: #1f2937 !important;
		color: #e5e7eb !important;
		border: 1px solid #4b5563 !important;
		border-radius: 8px !important;
		padding: 8px 12px !important;
		font-size: 13px !important;
		line-height: 1.5 !important;
		min-width: 500px !important;
		max-width: 800px !important;
		white-space: normal !important;
		word-wrap: break-word !important;
	}
	:global(.persona-tooltip .leaflet-tooltip-tip) {
		border-top-color: #1f2937 !important;
	}
	:global(.bezirk-label) {
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
		color: #94a3b8 !important;
		font-size: 11px !important;
		font-weight: 600 !important;
		text-transform: uppercase !important;
		letter-spacing: 0.05em !important;
		text-shadow: 0 0 4px rgba(0, 0, 0, 0.8) !important;
	}
	:global(.bezirk-label::before) {
		display: none !important;
	}
</style>
