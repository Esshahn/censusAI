export function log(level: 'INFO' | 'ERROR' | 'WARN', context: string, message: string, data?: unknown) {
	const timestamp = new Date().toISOString();
	let line = `[${timestamp}] [${level}] [${context}] ${message}`;
	if (data !== undefined) {
		line += ' ' + (typeof data === 'string' ? data : JSON.stringify(data));
	}
	console.log(line);
}
