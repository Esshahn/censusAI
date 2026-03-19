import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { generatePersonas } from '$lib/server/persona-generator';
import { queryBatch } from '$lib/server/openrouter';
import type { LLMResponse } from '$lib/types';

export const config = {
	maxDuration: 300 // 5 minutes for large simulations
};

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

export const POST: RequestHandler = async ({ request }) => {
	const { question, count } = await request.json();
	const model = env.LLM_MODEL || DEFAULT_MODEL;

	if (!question || !count) {
		return json({ error: 'question and count are required' }, { status: 400 });
	}

	const personas = generatePersonas(count);
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			const send = (data: unknown) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			try {
				// Send initial personas (without results)
				send({
					type: 'personas',
					personas: personas.map(({ bewertung, haltung, begruendung, ...p }) => p)
				});

				await queryBatch(
					personas,
					question,
					model,
					(personaId: number, result: LLMResponse) => {
						send({ type: 'result', persona_id: personaId, ...result });
					}
				);

				send({ type: 'complete' });
			} catch (e) {
				console.error('Simulation error:', e);
				send({ type: 'error', message: String(e) });
			} finally {
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
