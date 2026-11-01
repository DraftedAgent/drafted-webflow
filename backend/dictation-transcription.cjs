'use strict';
// Prepared server adapter; no route enables this in integration or production.
const MODEL='gpt-transcribe';
const MAX_BYTES=8*1024*1024,MAX_SECONDS=120;
function validate({bytes,mime}){
 if(!Buffer.isBuffer(bytes)||!bytes.length)throw Error('EMPTY_AUDIO');
 if(bytes.length>MAX_BYTES)throw Error('AUDIO_TOO_LARGE');
 const type=String(mime).split(';')[0];if(!['audio/webm','audio/mp4'].includes(type))throw Error('UNSUPPORTED_AUDIO');
 const magic=type==='audio/webm'?bytes.length>4&&bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):bytes.length>12&&bytes.toString('ascii',4,8)==='ftyp';
 if(!magic)throw Error('INVALID_AUDIO');return type;
}
function create({enabled=false,inspectDuration,transcribe}={}){
 return async input=>{
  if(!enabled)throw Error('TRANSCRIPTION_DISABLED');const type=validate(input);
  // A client-supplied duration is NOT sufficient to bound paid audio processing.
  if(typeof inspectDuration!=='function'||typeof transcribe!=='function')throw Error('TRANSCRIPTION_NOT_CONFIGURED');
  const duration=await inspectDuration(input.bytes,type);if(!Number.isFinite(duration)||duration<=0||duration>MAX_SECONDS)throw Error('INVALID_DURATION');
  const text=await transcribe({bytes:input.bytes,mime:type,model:MODEL});
  if(typeof text!=='string'||text.length>20000)throw Error('INVALID_TRANSCRIPT');return {ok:true,text};
 };
}
function openAI({apiKey,fetchImpl=fetch}){
 return async({bytes,mime,model=MODEL})=>{if(model!==MODEL)throw Error('UNSUPPORTED_TRANSCRIPTION_MODEL');if(!apiKey)throw Error('SERVER_KEY_REQUIRED');const form=new FormData();form.append('file',new Blob([bytes],{type:mime}),mime==='audio/mp4'?'recording.mp4':'recording.webm');form.append('model',model);form.append('languages[]','sv');form.append('languages[]','en');form.append('prompt','Transcribe the spoken words in their original language. Preserve Swedish and English. Do not translate, paraphrase or add information.');const response=await fetchImpl('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+apiKey},body:form,signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error('TRANSCRIPTION_FAILED');return (await response.json()).text;};
}
module.exports={MODEL,MAX_BYTES,MAX_SECONDS,validate,create,openAI};
