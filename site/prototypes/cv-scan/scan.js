/* Prototype controls are deliberately outside the shared renderer and app build. */
(function(){
 'use strict';
 const wrap=document.querySelector('.paper-wrap'),status=document.querySelector('#status'),error=document.querySelector('#error'),reduce=document.querySelector('#reduce'),pause=document.querySelector('#pause'),slow=document.querySelector('#slow'),preference=matchMedia('(prefers-reduced-motion: reduce)');
 const scan=DraftedCvScan.create({host:wrap,paperSelector:'.paper',regionSelector:'[data-scan]'});
 let state='analyzing',paused=false,speed=1;
 reduce.checked=preference.matches;reduce.disabled=preference.matches;
 function setState(next){state=next;wrap.dataset.state=state;error.hidden=state!=='error';status.textContent=state==='analyzing'?'Analyzing your CV…':state==='complete'?'CV ready to review':'Analysis could not be completed';if(state!=='analyzing')scan.stop();pause.disabled=slow.disabled=state!=='analyzing'||reduce.checked;}
 function restart(){paused=false;pause.textContent='Pausa';pause.setAttribute('aria-pressed','false');scan.start();setState('analyzing');}
 document.querySelector('#restart').onclick=restart;document.querySelector('#retry').onclick=restart;
 document.querySelector('#complete').onclick=()=>setState('complete');document.querySelector('#fail').onclick=()=>setState('error');
 pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Fortsätt':'Pausa';pause.setAttribute('aria-pressed',String(paused));scan.pause(paused);};
 slow.onclick=()=>{speed=speed===1?.35:1;slow.setAttribute('aria-pressed',String(speed!==1));scan.speed(speed);};
 reduce.onchange=()=>{scan.reduced(reduce.checked);setState(state);};preference.addEventListener('change',event=>{reduce.disabled=event.matches;reduce.checked=event.matches;scan.reduced(event.matches);setState(state);});
 window.DraftedScanPreview={start:restart,complete:()=>setState('complete'),fail:()=>setState('error'),get state(){return state;}};restart();
})();
