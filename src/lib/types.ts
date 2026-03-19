export interface Bezirk {
	id: string;
	name: string;
	einwohner: number;
	durchschnittsalter: number;
	altersverteilung: Record<string, number>;
	geschlecht: Record<string, number>;
	migrationshintergrund: number;
	auslaenderanteil: number;
	hauptherkunft: string[];
	bildung: Record<string, number>;
	erwerbsstatus: Record<string, number>;
	wahlverhalten_agh2023: Record<string, number>;
	sozialindex: string;
	miete_durchschnitt: number;
	bbox: { lat_min: number; lat_max: number; lng_min: number; lng_max: number };
}

export interface Persona {
	id: number;
	name: string;
	alter: number;
	geschlecht: string;
	bezirk: string;
	bezirk_id: string;
	migrationshintergrund: boolean;
	herkunft?: string;
	bildung: string;
	erwerbsstatus: string;
	partei: string;
	politische_tendenz: string;
	lat: number;
	lng: number;
	bewertung?: number;
	haltung?: 'positiv' | 'negativ' | 'neutral';
	begruendung?: string;
}

export interface LLMResponse {
	bewertung: number;
	haltung: 'positiv' | 'negativ' | 'neutral';
	begruendung: string;
}

export interface SimulationConfig {
	question: string;
	count: number;
	model: string;
}
