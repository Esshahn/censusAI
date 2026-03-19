import bezirkeData from '$lib/data/bezirke.json';
import { getVorname, getNachnameInitial, type HerkunftsRegion } from '$lib/data/namen';
import { randomPointInBezirk } from './geo';
import type { Bezirk, Persona } from '$lib/types';

const bezirke = bezirkeData as Bezirk[];

function weightedRandom(distribution: Record<string, number>): string {
	const rand = Math.random();
	let cumulative = 0;
	for (const [key, weight] of Object.entries(distribution)) {
		cumulative += weight;
		if (rand <= cumulative) return key;
	}
	return Object.keys(distribution)[0];
}

function sampleAlter(altersgruppe: string): number {
	const [min, max] = altersgruppe === '75+'
		? [75, 90]
		: altersgruppe.split('-').map(Number);
	return min + Math.floor(Math.random() * (max - min + 1));
}

function herkunftToRegion(herkunft: string): HerkunftsRegion {
	const lower = herkunft.toLowerCase();
	if (lower.includes('türkei')) return 'türkisch';
	if (lower.includes('arab') || lower.includes('syrien') || lower.includes('libanon')) return 'arabisch';
	if (lower.includes('polen')) return 'polnisch';
	if (lower.includes('russland') || lower.includes('kasachstan') || lower.includes('ukraine')) return 'russisch';
	if (lower.includes('vietnam')) return 'vietnamesisch';
	return 'deutsch';
}

function politischeTendenz(wahlverhalten: Record<string, number>): { partei: string; tendenz: string } {
	const partei = weightedRandom(wahlverhalten);
	const tendenzen: Record<string, string> = {
		CDU: 'konservativ, bürgerliche Mitte',
		SPD: 'sozialdemokratisch, Mitte-links',
		Gruene: 'grün-progressiv, links-liberal',
		Linke: 'links, sozialistisch',
		AfD: 'rechtspopulistisch, EU-kritisch, migrationskritisch',
		FDP: 'wirtschaftsliberal, Mitte',
		BSW: 'links-konservativ, migrationskritisch',
		Sonstige: 'keiner großen Partei zugehörig'
	};
	return { partei, tendenz: tendenzen[partei] ?? 'unbestimmt' };
}

const bildungLabels: Record<string, string> = {
	ohne_abschluss: 'ohne Schulabschluss',
	hauptschule: 'Hauptschulabschluss',
	realschule: 'Realschulabschluss',
	abitur: 'Abitur',
	studium: 'Studium',
	promotion: 'Promotion'
};

const erwerbsLabels: Record<string, string> = {
	angestellt: 'angestellt',
	selbstaendig: 'selbständig',
	arbeitslos: 'arbeitslos',
	rente: 'in Rente',
	ausbildung_studium: 'in Ausbildung/Studium',
	sonstiges: 'sonstiges'
};

export function generatePersonas(count: number): Persona[] {
	const totalEinwohner = bezirke.reduce((sum, b) => sum + b.einwohner, 0);
	const personas: Persona[] = [];
	let id = 0;

	// Use floor + distribute remainder to avoid exceeding count
	const bezirkCounts = bezirke.map((b) => Math.floor(count * b.einwohner / totalEinwohner));
	let remaining = count - bezirkCounts.reduce((s, c) => s + c, 0);
	const remainders = bezirke.map((b, i) => ({ i, r: (count * b.einwohner / totalEinwohner) - bezirkCounts[i] }));
	remainders.sort((a, b) => b.r - a.r);
	for (const { i } of remainders) {
		if (remaining <= 0) break;
		bezirkCounts[i]++;
		remaining--;
	}

	for (let bIdx = 0; bIdx < bezirke.length; bIdx++) {
		const bezirk = bezirke[bIdx];
		const bezirkCount = bezirkCounts[bIdx];

		for (let i = 0; i < bezirkCount; i++) {
			const geschlechtKey = weightedRandom(bezirk.geschlecht) as 'm' | 'w' | 'd';
			const geschlecht = geschlechtKey === 'm' ? 'männlich' : geschlechtKey === 'w' ? 'weiblich' : 'divers';
			const nameGeschlecht = geschlechtKey === 'd' ? (Math.random() > 0.5 ? 'm' : 'w') : geschlechtKey;

			const hatMigration = Math.random() < bezirk.migrationshintergrund;
			let herkunft: string | undefined;
			let herkunftsRegion: HerkunftsRegion = 'deutsch';

			if (hatMigration && bezirk.hauptherkunft.length > 0) {
				herkunft = bezirk.hauptherkunft[Math.floor(Math.random() * bezirk.hauptherkunft.length)];
				herkunftsRegion = herkunftToRegion(herkunft);
			}

			const vorname = getVorname(herkunftsRegion, nameGeschlecht);
			const altersgruppe = weightedRandom(bezirk.altersverteilung);
			const bildungKey = weightedRandom(bezirk.bildung);
			const erwerbsKey = weightedRandom(bezirk.erwerbsstatus);

			const { lat, lng } = randomPointInBezirk(bezirk.name);

			const politik = politischeTendenz(bezirk.wahlverhalten_agh2023);

			personas.push({
				id: id++,
				name: `${vorname} ${getNachnameInitial()}`,
				alter: sampleAlter(altersgruppe),
				geschlecht,
				bezirk: bezirk.name,
				bezirk_id: bezirk.id,
				migrationshintergrund: hatMigration,
				herkunft,
				bildung: bildungLabels[bildungKey] ?? bildungKey,
				erwerbsstatus: erwerbsLabels[erwerbsKey] ?? erwerbsKey,
				partei: politik.partei,
				politische_tendenz: politik.tendenz,
				lat,
				lng
			});
		}
	}

	return personas;
}

export function personaToSteckbrief(persona: Persona): string {
	const lines = [
		`Name: ${persona.name}`,
		`Alter: ${persona.alter}`,
		`Geschlecht: ${persona.geschlecht}`,
		`Bezirk: ${persona.bezirk}`,
		`Bildung: ${persona.bildung}`,
		`Erwerbsstatus: ${persona.erwerbsstatus}`,
		`Migrationshintergrund: ${persona.migrationshintergrund ? `ja, ${persona.herkunft}` : 'nein'}`,
		`Wählt: ${persona.partei}`,
		`Politische Einstellung: ${persona.politische_tendenz}`
	];
	return lines.join('\n');
}
