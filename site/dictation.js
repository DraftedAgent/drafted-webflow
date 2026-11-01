/* Shared, draft-only dictation. No CV mutation or submission capability. */
(function(root){
 'use strict';
 const targets=new Map(),limitMs=120000,maxBytes=8*1024*1024;
 let active=null,dock;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 function config(){return root.__DRAFTED_DICTATION__||{mode:'blocked'};}
 function supported(){return !!(root.isSecureContext&&navigator.mediaDevices?.getUserMedia&&root.MediaRecorder);}
 function ui(target,message){target.message=message;for(const view of target.views){if(!view.wrap.isConnected){target.views.delete(view);continue;}view.status.textContent=message;const own=active?.key===target.key;view.start.disabled=!!active||!supported()||config().mode==='blocked';view.stop.hidden=!own||active.state!=='recording';view.cancel.hidden=!own;view.wrap.dataset.state=own?active.state:'idle';}}
 function refresh(){for(const t of targets.values())ui(t,t.message||'');if(active&&dock){dock.hidden=false;dock.label.textContent=active.state==='recording'?'Recording — '+active.label:active.state==='permission'?'Waiting for microphone permission…':'Transcribing — '+active.label;dock.stop.hidden=active.state!=='recording';}else if(dock)dock.hidden=true;}
 function release(job){clearInterval(job.timer);job.stream?.getTracks().forEach(t=>t.stop());job.audioContext?.close().catch(()=>{});job.chunks=[];if(active===job)active=null;refresh();}
 function cancel(message='Dictation cancelled. Your text is unchanged.') {const job=active;if(!job)return;job.cancelled=true;job.controller?.abort();if(job.recorder?.state==='recording')job.recorder.stop();release(job);ui(targets.get(job.key),message);}
 function stop(){if(active?.state==='recording'){active.state='transcribing';clearInterval(active.timer);active.recorder.stop();refresh();}}
 function merge(current,original,at,text){const changed=current!==original,pos=changed?current.length:Math.min(at,current.length),prefix=current.slice(0,pos),suffix=current.slice(pos);return {text:prefix+(prefix&&!/\s$/.test(prefix)?' ':'')+text+(suffix&&!/^\s/.test(suffix)?' ':'')+suffix,changed};}
 async function finish(job){
  job.stream?.getTracks().forEach(t=>t.stop());job.audioContext?.close().catch(()=>{});if(job.cancelled)return;
  const target=targets.get(job.key),audio=new Blob(job.chunks,{type:job.recorder.mimeType});job.chunks=[];
  try{
   if(job.size>maxBytes)throw Error('Recording exceeded 8 MB. Please record a shorter answer.');
   if(job.analyser&&!job.heardSpeech)throw Error('No audible speech was detected. Your text is unchanged. Please try again.');
   if(!audio.size||performance.now()-job.started<300)throw Error('The recording was empty or too short. Please try again.');
   job.state='transcribing';ui(target,'Transcribing… You can keep editing.');refresh();job.controller=new AbortController();const timeout=setTimeout(()=>job.controller.abort(),95000);
   let response;try{const upload=config().mode==='live'?await root.DraftedDictationWav(audio):audio;if(job.cancelled)return;response=await fetch(config().endpoint,{method:'POST',headers:{'Content-Type':upload.type,'X-Drafted-Duration':String(Math.min(120,(performance.now()-job.started)/1000))},body:upload,signal:job.controller.signal});}finally{clearTimeout(timeout);}
   if(!response.ok)throw Error('Transcription failed. Your existing text is unchanged. Please record again.');
   const result=await response.json();if(job.cancelled)return;if(!result.ok||typeof result.text!=='string'||result.text.length>20000)throw Error('The transcription response was invalid. Your text is unchanged.');
   const text=result.text.trim();if(!text)throw Error('No speech was recognised. Your text is unchanged.');
   if(!target.alive())throw Error('This question or workspace is no longer active. Dictation was discarded.');
   const draft=merge(target.read(),job.original,job.at,text);if(draft.text.length>target.maxLength)throw Error('The transcript would exceed the field limit. Your text is unchanged; record a shorter section.');
   target.write(draft.text);ui(target,(config().mode==='simulated'?'Simulated transcript. ':'')+(draft.changed?'Added at the end because your draft changed. ':'')+'Review the text before sending.');
   document.dispatchEvent(new Event('drafted-draft-change'));
  }catch(e){if(!job.cancelled)ui(target,e.name==='AbortError'?'Transcription timed out. Your text is unchanged. Please record again.':e.message);}
  finally{release(job);}
 }
 async function start(target,input){
  if(active||!supported()||config().mode==='blocked')return;
  const job={key:target.key,label:target.label,state:'permission',original:target.read(),at:input?.selectionStart??target.read().length,chunks:[],size:0};active=job;ui(target,'Waiting for microphone permission…');refresh();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(job.cancelled){stream.getTracks().forEach(t=>t.stop());return;}job.stream=stream;
   for(const track of stream.getTracks())track.addEventListener('ended',()=>{if(active===job&&job.state==='recording')cancel('The microphone was disconnected. Your text is unchanged.');});
   try{const Audio=root.AudioContext||root.webkitAudioContext;if(Audio){job.audioContext=new Audio();await job.audioContext.resume();job.analyser=job.audioContext.createAnalyser();job.audioContext.createMediaStreamSource(stream).connect(job.analyser);job.samples=new Float32Array(job.analyser.fftSize);}}catch{job.audioContext?.close().catch(()=>{});job.analyser=null;}
   if(job.cancelled){release(job);return;}

   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('This browser cannot record a supported audio format. Please type your answer.');
   job.recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:64000});job.recorder.ondataavailable=e=>{if(!job.cancelled&&e.data.size){job.chunks.push(e.data);job.size+=e.data.size;if(job.size>maxBytes)cancel('Recording exceeded 8 MB. Your text is unchanged.');}};
   job.recorder.onerror=()=>cancel('Recording was interrupted. Your text is unchanged.');job.recorder.onstop=()=>finish(job);
   job.started=performance.now();job.state='recording';job.recorder.start(250);ui(target,'Recording. Stop when you are ready.');refresh();
   const tick=()=>{if(job.analyser){job.analyser.getFloatTimeDomainData(job.samples);const rms=Math.sqrt(job.samples.reduce((sum,x)=>sum+x*x,0)/job.samples.length);if(rms>.004)job.heardSpeech=true;}const elapsed=performance.now()-job.started,seconds=Math.floor(elapsed/1000),time=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} / 2:00`;dock.time.textContent=time;for(const v of target.views)v.time.textContent=time;if(elapsed>=limitMs){ui(target,'Two-minute limit reached. Transcribing…');stop();}};tick();job.timer=setInterval(tick,250);
  }catch(e){if(!job.cancelled){ui(target,e.name==='NotAllowedError'?'Microphone access was denied. You can still type your answer.':e.name==='NotFoundError'?'No microphone was found. You can still type your answer.':e.message||'Recording could not start.');release(job);}}
 }
 function attach(input,{key,label='your draft',read=()=>input.value,write=value=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},alive=()=>input.isConnected,maxLength=50000}={}){
  if(!input||input.dataset.dictationAttached)return;input.dataset.dictationAttached='true';
  let target=targets.get(key);if(!target){target={key,views:new Set(),message:''};targets.set(key,target);}Object.assign(target,{read,write,alive,maxLength,label});
  const wrap=node('div',null,'drafted-dictation'),mic=node('button',null,'dictation-mic');mic.type='button';mic.setAttribute('aria-label','Dictate '+label);mic.title='Dictate '+label;mic.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M8 21h8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const stopButton=node('button','Stop'),abort=node('button','Cancel'),time=node('span',null,'dictation-time'),status=node('span',null,'dictation-status');stopButton.type=abort.type='button';stopButton.setAttribute('aria-label','Stop dictation for '+label);abort.setAttribute('aria-label','Cancel dictation for '+label);time.setAttribute('aria-live','off');status.setAttribute('role','status');
  mic.addEventListener('click',()=>start(target,input));stopButton.onclick=stop;abort.onclick=()=>cancel();wrap.append(mic,stopButton,abort,time,status);input.after(wrap);target.views.add({wrap,start:mic,stop:stopButton,cancel:abort,time,status});
  if(!supported())target.message='Dictation needs microphone support and HTTPS or localhost. You can still type.';
  else if(config().mode==='blocked')target.message='Dictation is not connected yet. You can still type.';
  else if(!target.message&&config().mode==='simulated')target.message='Simulated dictation test — audio is not recognised.';
  refresh();
 }
 function mount(){const input=document.getElementById('editor-input');if(input)attach(input,{key:'chat',label:'chat message',maxLength:input.maxLength>0?input.maxLength:5000});if(!dock){dock=node('div',null,'dictation-dock');dock.hidden=true;dock.label=node('span');dock.label.setAttribute('role','status');dock.time=node('span',null,'dictation-time');dock.stop=node('button','Stop recording');dock.stop.type='button';dock.stop.onclick=stop;const abort=node('button','Cancel');abort.type='button';abort.onclick=()=>cancel();dock.append(dock.label,dock.time,dock.stop,abort);document.body.append(dock);}}
 root.DraftedDictation={attach,cancel,merge,isActiveFor(prefix){return !!active?.key.startsWith(prefix);},cancelFor(prefix){if(active?.key.startsWith(prefix))cancel();}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0),{once:true});else setTimeout(mount,0);
 addEventListener('pagehide',()=>cancel());
 document.addEventListener('change',e=>{if(e.target.id==='cv-file')cancel();});
})(window);
