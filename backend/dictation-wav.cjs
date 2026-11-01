'use strict';
// Strict canonical PCM WAV: duration is derived from sample bytes, not client metadata.
function inspectWav(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<46||bytes.length>3840044)throw Error('INVALID_WAV');
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.readUInt32LE(4)!==bytes.length-8||bytes.toString('ascii',8,16)!=='WAVEfmt '||bytes.readUInt32LE(16)!==16||bytes.readUInt16LE(20)!==1||bytes.readUInt16LE(22)!==1||bytes.readUInt32LE(24)!==16000||bytes.readUInt32LE(28)!==32000||bytes.readUInt16LE(32)!==2||bytes.readUInt16LE(34)!==16||bytes.toString('ascii',36,40)!=='data'||bytes.readUInt32LE(40)!==bytes.length-44||(bytes.length-44)%2)throw Error('INVALID_WAV');
 const duration=(bytes.length-44)/32000;if(duration<.3||duration>120)throw Error('INVALID_DURATION');return duration;
}
module.exports={inspectWav};
