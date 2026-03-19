import { env } from '$env/dynamic/private';
import type { Persona, LLMResponse } from '$lib/types';
import { personaToSteckbrief } from './persona-generator';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { log } from './logger';

function getApiKey(): string {
	const key = env.API_KEY ?? env.OPENROUTER_API_KEY;
	if (!key) {
		throw new Error('API_KEY is not set in .env file');
	}
	return key;
}

let systemPromptCache: string | null = null;

function getSystemPrompt(): string {
	if (!systemPromptCache) {
		systemPromptCache = readFileSync(resolve('system-prompt.md'), 'utf-8');
	}
	return systemPromptCache;
}

export async function queryPersona(
	persona: Persona,
	question: string,
	model: string
): Promise<LLMResponse> {
	const steckbrief = personaToSteckbrief(persona);
	const systemPrompt = getSystemPrompt();

	log('INFO', 'queryPersona', `Querying persona ${persona.id} (${persona.name}), model=${model}`);

	const body = {
		model,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: `PERSONA:\n${steckbrief}\n\nFRAGE:\n${question}` }
		],
		max_tokens: 300,
		temperature: 0.8
	};

	let response: Response;
	try {
		response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${getApiKey()}`
			},
			body: JSON.stringify(body)
		});
	} catch (e) {
		log('ERROR', 'queryPersona', `Fetch failed for persona ${persona.id}`, (e as Error).message);
		throw e;
	}

	if (!response.ok) {
		const error = await response.text();
		log('ERROR', 'queryPersona', `API error for persona ${persona.id}: ${response.status}`, error);
		throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;
	log('INFO', 'queryPersona', `Persona ${persona.id} response received`, content?.substring(0, 120));

	if (!content) {
		throw new Error('Empty response from LLM');
	}

	const jsonMatch = content.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		log('ERROR', 'queryPersona', `Could not parse JSON for persona ${persona.id}`, content);
		throw new Error(`Could not parse JSON from LLM response: ${content}`);
	}

	return JSON.parse(jsonMatch[0]) as LLMResponse;
}

export async function queryBatch(
	personas: Persona[],
	question: string,
	model: string,
	onResult: (personaId: number, result: LLMResponse) => void,
	batchSize = 5,
	delayMs = 500
): Promise<void> {
	log('INFO', 'queryBatch', `Starting: ${personas.length} personas, batchSize=${batchSize}`);

	for (let i = 0; i < personas.length; i += batchSize) {
		const batch = personas.slice(i, i + batchSize);
		log('INFO', 'queryBatch', `Batch ${Math.floor(i / batchSize) + 1} (personas ${i}-${i + batch.length - 1})`);

		const results = await Promise.allSettled(
			batch.map(async (persona) => {
				let lastError: Error | null = null;
				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						const result = await queryPersona(persona, question, model);
						return { personaId: persona.id, result };
					} catch (e) {
						lastError = e as Error;
						log('WARN', 'queryBatch', `Attempt ${attempt + 1} failed for persona ${persona.id}`, lastError.message);
						if (attempt < 2) {
							await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
						}
					}
				}
				throw lastError;
			})
		);

		for (const result of results) {
			if (result.status === 'fulfilled') {
				log('INFO', 'queryBatch', `Persona ${result.value.personaId} done: bewertung=${result.value.result.bewertung}`);
				onResult(result.value.personaId, result.value.result);
			} else {
				log('ERROR', 'queryBatch', 'Persona failed after 3 retries', (result.reason as Error)?.message);
			}
		}

		if (i + batchSize < personas.length) {
			await new Promise((r) => setTimeout(r, delayMs));
		}
	}
	log('INFO', 'queryBatch', 'All batches complete');
}
