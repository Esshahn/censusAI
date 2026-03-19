import { appendFileSync } from 'fs';
import { resolve } from 'path';

const LOG_FILE = resolve('debug.log');

export function log(level: 'INFO' | 'ERROR' | 'WARN', context: string, message: string, data?: unknown) {
	const timestamp = new Date().toISOString();
	let line = `[${timestamp}] [${level}] [${context}] ${message}`;
	if (data !== undefined) {
		line += ' ' + (typeof data === 'string' ? data : JSON.stringify(data));
	}
	console.log(line);
	try {
		appendFileSync(LOG_FILE, line + '\n');
	} catch {
		// ignore write errors
	}
}
