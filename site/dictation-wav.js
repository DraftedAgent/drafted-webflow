/* Decode browser recording locally into bounded, canonical mono PCM. No network or persistence. */
(function(root){
 root.DraftedDictationWav=async function(blob){
  const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)throw Error('This browser cannot prepare dictation audio. Please type your answer.');
  const context=new Audio();let decoded;try{decoded=await context.decodeAudioData(await blob.arrayBuffer());}finally{await context.close();}
  if(!Number.isFinite(decoded.duration)||decoded.duration<.3||decoded.duration>120.5)throw Error('Recording must be between a moment and two minutes.');
  const samples=Math.min(1920000,Math.ceil(decoded.duration*16000)),offline=new OfflineAudioContext(1,samples,16000),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const pcm=(await offline.startRendering()).getChannelData(0),buffer=new ArrayBuffer(44+pcm.length*2),view=new DataView(buffer);
  const text=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};text(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,pcm.length*2,true);for(let i=0;i<pcm.length;i++)view.setInt16(44+i*2,Math.max(-1,Math.min(1,pcm[i]))*(pcm[i]<0?32768:32767),true);return new Blob([buffer],{type:'audio/wav'});
 };
})(window);
