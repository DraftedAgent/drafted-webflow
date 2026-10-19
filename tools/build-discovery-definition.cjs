/* Read inspected model descriptor on stdin. Stdout is for a protected caller capture, never chat. */
const {definition}=require('../backend/n8n-discovery-definition.cjs');
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>input+=chunk);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(definition(JSON.parse(input)))));
