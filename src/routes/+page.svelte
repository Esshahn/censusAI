<script lang="ts">
	import BerlinMap from '$lib/components/BerlinMap.svelte';
	import type { Persona } from '$lib/types';

	let question = $state('');
	let personaCount = $state(50);
	let personas: Persona[] = $state([]);
	let isRunning = $state(false);
	let progress = $state(0);
	let totalToQuery = $state(0);
	let selectedPersona: Persona | null = $state(null);
	let errorMessage = $state('');
	let showInfo = $state(false);

	const countOptions = [25, 50, 100, 200, 500];

	const averageRating = $derived(() => {
		const rated = personas.filter((p) => p.bewertung !== undefined);
		if (rated.length === 0) return 0;
		return rated.reduce((sum, p) => sum + p.bewertung!, 0) / rated.length;
	});

	const ratingDistribution = $derived(() => {
		const dist = [0, 0, 0, 0, 0];
		for (const p of personas) {
			if (p.bewertung !== undefined) {
				dist[p.bewertung - 1]++;
			}
		}
		return dist;
	});

	const haltungCounts = $derived(() => {
		const counts = { positiv: 0, neutral: 0, negativ: 0 };
		for (const p of personas) {
			if (p.haltung) counts[p.haltung]++;
		}
		return counts;
	});

	async function startSimulation() {
		if (!question.trim() || isRunning) return;

		isRunning = true;
		progress = 0;
		personas = [];
		selectedPersona = null;
		errorMessage = '';

		const response = await fetch('/api/simulate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ question, count: personaCount })
		});

		if (!response.ok || !response.body) {
			isRunning = false;
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const dataLine = line.replace(/^data: /, '');
				if (!dataLine) continue;

				try {
					const event = JSON.parse(dataLine);

					if (event.type === 'personas') {
						personas = event.personas;
						totalToQuery = event.personas.length;
					} else if (event.type === 'result') {
						progress++;
						personas = personas.map((p) =>
							p.id === event.persona_id
								? { ...p, bewertung: event.bewertung, haltung: event.haltung, begruendung: event.begruendung }
								: p
						);
					} else if (event.type === 'error') {
						errorMessage = event.message;
						isRunning = false;
					} else if (event.type === 'complete') {
						isRunning = false;
					}
				} catch {
					// skip malformed events
				}
			}
		}
		isRunning = false;
	}

	function handlePersonaClick(p: Persona) {
		selectedPersona = p;
	}
</script>

<div class="flex flex-col lg:flex-row h-screen">
	<!-- Left Panel: Controls -->
	<div class="w-full lg:w-[420px] flex-shrink-0 p-6 overflow-y-auto bg-gray-800 border-r border-gray-700">
		<div class="flex items-center justify-between mb-1">
			<h1 class="text-2xl font-bold">BerlinPuls</h1>
			<button
				onclick={() => showInfo = !showInfo}
				class="w-8 h-8 rounded-full border border-gray-500 text-gray-400 hover:text-white hover:border-white transition-colors text-sm font-semibold cursor-pointer"
				title="Informationen zur Methodik"
			>?</button>
		</div>
		<p class="text-gray-400 text-sm mb-6">KI-gestützte Agentensimulation der Berliner Bevölkerung</p>

		<!-- Question Input -->
		<label class="block text-sm font-medium mb-2" for="question">Fragestellung</label>
		<textarea
			id="question"
			bind:value={question}
			placeholder="Gib eine Frage oder ein Statement ein, zu dem die Berliner Bevölkerung Stellung beziehen soll..."
			rows="4"
			class="w-full rounded-lg bg-gray-700 border border-gray-600 p-3 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
		></textarea>

		<!-- Persona Count -->
		<label class="block text-sm font-medium mt-4 mb-2" for="count">Anzahl Personas</label>
		<select
			id="count"
			bind:value={personaCount}
			class="w-full rounded-lg bg-gray-700 border border-gray-600 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			{#each countOptions as c}
				<option value={c}>{c}</option>
			{/each}
		</select>

		<!-- Start Button -->
		<button
			onclick={startSimulation}
			disabled={isRunning || !question.trim()}
			class="w-full mt-6 py-3 rounded-lg font-semibold text-sm transition-colors
				{isRunning || !question.trim()
					? 'bg-gray-600 text-gray-400 cursor-not-allowed'
					: 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'}"
		>
			{isRunning ? 'Simulation läuft...' : 'Simulation starten'}
		</button>

		<!-- Error -->
		{#if errorMessage}
			<div class="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-300">
				{errorMessage}
			</div>
		{/if}

		<!-- Progress -->
		{#if isRunning || progress > 0}
			<div class="mt-4">
				<div class="flex justify-between text-xs text-gray-400 mb-1">
					<span>Fortschritt</span>
					<span>{progress} / {totalToQuery}</span>
				</div>
				<div class="w-full bg-gray-700 rounded-full h-2.5">
					<div
						class="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
						style="width: {totalToQuery > 0 ? (progress / totalToQuery) * 100 : 0}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Results Summary -->
		{#if progress > 0}
			<div class="mt-6 space-y-4">
				<h2 class="text-lg font-semibold">Ergebnisse</h2>

				<!-- Average -->
				<div class="bg-gray-700 rounded-lg p-4">
					<div class="text-sm text-gray-400">Durchschnittliche Bewertung</div>
					<div class="text-3xl font-bold">{averageRating().toFixed(1)} <span class="text-lg text-gray-400">/ 5</span></div>
				</div>

				<!-- Haltung -->
				<div class="bg-gray-700 rounded-lg p-4 flex gap-4">
					<div class="text-center flex-1">
						<div class="text-green-400 font-bold text-xl">{haltungCounts().positiv}</div>
						<div class="text-xs text-gray-400">Positiv</div>
					</div>
					<div class="text-center flex-1">
						<div class="text-yellow-400 font-bold text-xl">{haltungCounts().neutral}</div>
						<div class="text-xs text-gray-400">Neutral</div>
					</div>
					<div class="text-center flex-1">
						<div class="text-red-400 font-bold text-xl">{haltungCounts().negativ}</div>
						<div class="text-xs text-gray-400">Negativ</div>
					</div>
				</div>

				<!-- Distribution -->
				<div class="bg-gray-700 rounded-lg p-4">
					<div class="text-sm text-gray-400 mb-3">Verteilung</div>
					{#each ratingDistribution() as count, i}
						{@const maxCount = Math.max(...ratingDistribution(), 1)}
						<div class="flex items-center gap-2 mb-1.5">
							<span class="text-xs w-4 text-right">{i + 1}</span>
							<div class="flex-1 bg-gray-600 rounded-full h-4 overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {i < 2 ? 'bg-red-500' : i === 2 ? 'bg-yellow-500' : 'bg-green-500'}"
									style="width: {(count / maxCount) * 100}%"
								></div>
							</div>
							<span class="text-xs w-8">{count}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Selected Persona Detail -->
		{#if selectedPersona}
			<div class="mt-6 bg-gray-700 rounded-lg p-4">
				<div class="flex justify-between items-start">
					<h3 class="font-semibold">{selectedPersona.name}</h3>
					<button onclick={() => selectedPersona = null} class="text-gray-400 hover:text-white text-sm">&times;</button>
				</div>
				<div class="text-sm text-gray-400 mt-1 space-y-0.5">
					<p>{selectedPersona.alter} Jahre, {selectedPersona.geschlecht}</p>
					<p>{selectedPersona.bezirk}</p>
					<p>Bildung: {selectedPersona.bildung}</p>
					<p>{selectedPersona.erwerbsstatus}</p>
					<p>{selectedPersona.migrationshintergrund ? `Migrationshintergrund: ${selectedPersona.herkunft}` : 'Kein Migrationshintergrund'}</p>
					<p>Wählt: {selectedPersona.partei} ({selectedPersona.politische_tendenz})</p>
				</div>
				{#if selectedPersona.bewertung !== undefined}
					<div class="mt-3 pt-3 border-t border-gray-600">
						<p class="font-medium">Bewertung: {selectedPersona.bewertung}/5
							<span class="{selectedPersona.haltung === 'positiv' ? 'text-green-400' : selectedPersona.haltung === 'negativ' ? 'text-red-400' : 'text-yellow-400'}">
								({selectedPersona.haltung})
							</span>
						</p>
						<p class="text-sm text-gray-300 mt-1 italic">"{selectedPersona.begruendung}"</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Right Panel: Map -->
	<div class="flex-1 min-h-[400px]">
		<BerlinMap bind:personas onPersonaClick={handlePersonaClick} />
	</div>

	<!-- Info Sidebar -->
	{#if showInfo}
		<div class="w-full lg:w-[420px] flex-shrink-0 overflow-y-auto bg-gray-800 border-l border-gray-700 p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold">Wie funktioniert BerlinPuls?</h2>
				<button
					onclick={() => showInfo = false}
					class="text-gray-400 hover:text-white text-xl cursor-pointer"
				>&times;</button>
			</div>

			<div class="space-y-4 text-sm text-gray-300 leading-relaxed">
				<section>
					<h3 class="text-white font-medium mb-1">Was passiert hier?</h3>
					<p>BerlinPuls erstellt eine <strong>simulierte Umfrage</strong> unter fiktiven Berliner Personen. Diese Personen werden von einer KI verkörpert und geben ihre Meinung zu deiner Frage ab.</p>
				</section>

				<section>
					<h3 class="text-white font-medium mb-1">Wie werden die Personen erstellt?</h3>
					<p>Jede Person bekommt ein Profil: Alter, Geschlecht, Bezirk, Bildung, Beruf, Migrationshintergrund und politische Tendenz. Diese Merkmale werden <strong>zufällig gezogen</strong>, aber gewichtet nach echten Berliner Statistiken. Wenn in Marzahn-Hellersdorf z.B. 22% AfD wählen, dann wählen auch ca. 22% der simulierten Personen dort AfD.</p>
				</section>

				<section>
					<h3 class="text-white font-medium mb-1">Woher kommen die Daten?</h3>
					<p>Die demografischen Verteilungen basieren auf öffentlichen Quellen:</p>
					<ul class="list-disc list-inside mt-1 space-y-0.5 text-gray-400">
						<li>Einwohnerregisterstatistik Berlin-Brandenburg</li>
						<li>Abgeordnetenhauswahl 2023 (Endergebnisse)</li>
						<li>Monitoring Soziale Stadtentwicklung 2023</li>
					</ul>
				</section>

				<section>
					<h3 class="text-white font-medium mb-1">Wie antwortet die KI?</h3>
					<p>Jede Person wird einzeln von einem KI-Sprachmodell (Claude Sonnet) befragt. Die KI bekommt den Steckbrief der Person und deine Frage, und soll aus deren Perspektive antworten: eine Bewertung von 1 (stimme gar nicht zu) bis 5 (stimme voll zu), plus eine kurze Begründung.</p>
				</section>

				<section>
					<h3 class="text-white font-medium mb-1">Was zeigt die Karte?</h3>
					<p>Jeder Punkt ist eine simulierte Person an einer zufälligen Position innerhalb ihres Bezirks. Die Farbe zeigt die Haltung: <span class="text-green-400">grün</span> = positiv, <span class="text-yellow-400">gelb</span> = neutral, <span class="text-red-400">rot</span> = negativ. Die Bezirke selbst färben sich nach der durchschnittlichen Bewertung ihrer Personen.</p>
				</section>

				<section class="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
					<h3 class="text-yellow-400 font-medium mb-1">Wichtiger Hinweis</h3>
					<p>Die Ergebnisse sind <strong>nicht repräsentativ</strong>. Dies ist ein Experiment, keine echte Umfrage. Die Antworten kommen von einer KI, nicht von echten Menschen. KI-Modelle haben bekannte Verzerrungen, z.B. einen tendenziell progressiveren Blickwinkel. Die Simulation zeigt, wie eine KI sich vorstellt, dass verschiedene Bevölkerungsgruppen antworten würden &ndash; nicht, wie sie tatsächlich antworten.</p>
				</section>
			</div>
		</div>
	{/if}
</div>
