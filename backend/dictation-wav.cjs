'use strict';
// Strict canonical PCM WAV: duration is derived from sample bytes, not client metadata.
function inspectWav(bytes){
 if(!ArrayBuffer.isView(bytes)||bytes.BYTES_PER_ELEMENT!==1||bytes.byteLength<46||bytes.byteLength>3840044)throw Error('INVALID_WAV');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),ascii=(a,b)=>String.fromCharCode(...bytes.subarray(a,b));
 if(ascii(0,4)!=='RIFF'||view.getUint32(4,true)!==bytes.byteLength-8||ascii(8,16)!=='WAVEfmt '||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==1||view.getUint32(24,true)!==16000||view.getUint32(28,true)!==32000||view.getUint16(32,true)!==2||view.getUint16(34,true)!==16||ascii(36,40)!=='data'||view.getUint32(40,true)!==bytes.byteLength-44||(bytes.byteLength-44)%2)throw Error('INVALID_WAV');
 const duration=(bytes.byteLength-44)/32000;if(duration<.3||duration>120)throw Error('INVALID_DURATION');return duration;
}
module.exports={inspectWav};
