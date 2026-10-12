import { preflight } from '../src/server/preflight';
const report = preflight(process.env, process.argv.includes('--monthly'));
console.log(JSON.stringify({ event: 'publication_preflight', ...report }, null, 2));
if (!report.ready) process.exitCode = 1;
