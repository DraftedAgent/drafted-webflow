/* One tab's recoverable editor work. No account/profile or backend storage. */
(function(global){
  'use strict';
  const SCHEMA=1,DB='drafted-workspace-v1';
  function valid(state){const cv=state?.cv;return !!(cv&&typeof cv.cvVersionId==='string'&&cv.cvVersionId&&Array.isArray(cv.documentBlocksState)&&cv.documentBlocksState.length&&new Set(cv.documentBlocksState.map(b=>b.blockId)).size===cv.documentBlocksState.length&&cv.documentBlocksState.every(b=>typeof b.blockId==='string'&&b.blockId&&typeof b.text==='string'&&Number.isFinite(b.order)));}
  function create(){
    let id;try{id=sessionStorage.getItem('drafted.workspace.tab');if(!id){id=crypto.randomUUID();sessionStorage.setItem('drafted.workspace.tab',id);}}catch{throw Error('Workspace storage is unavailable in this browser. Enable browser storage and try again.');}
    const mirror='drafted.workspace.state.'+id,identity=new WeakMap(),hashes=new WeakMap(),written=new Set();let sequence=0,chain=Promise.resolve();
    const database=new Promise((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore('entries',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('Your workspace could not be saved in this browser. Check browser storage and try again.'));request.onblocked=()=>reject(Error('Workspace storage is busy. Close other Drafted windows and try again.'));});
    const read=async key=>{const db=await database;return new Promise((resolve,reject)=>{const request=db.transaction('entries').objectStore('entries').get(key);request.onsuccess=()=>resolve(request.result?.value);request.onerror=()=>reject(request.error);});};
    async function load(){
      let local;try{local=JSON.parse(sessionStorage.getItem(mirror)||'null');}catch{}
      const stored=await read('state:'+id),payload=local?.schema===SCHEMA&&(!stored||local.sequence>stored.sequence)?local:stored;
      if(!payload)return null;if(payload.schema!==SCHEMA||!payload.state||typeof payload.state!=='object')throw Error('The saved workspace cannot be restored. Return to setup and choose your CV.');sequence=payload.sequence||0;
      const files={};for(const [kind,key] of Object.entries(payload.files||{})){if(!key){files[kind]=null;continue;}const record=await read('file:'+id+':'+key);if(record){const file=record.blob instanceof File?record.blob:new File([record.blob],record.name,{type:record.type,lastModified:record.modified});identity.set(file,key);written.add(key);files[kind]=file;}else files[kind]=null;}
      return {state:payload.state,files};
    }
    function save(state,files={}){
      const fresh=[],keys={};for(const [kind,file] of Object.entries(files)){if(!file){keys[kind]=null;continue;}let key=identity.get(file);if(!key){key=crypto.randomUUID();identity.set(file,key);}keys[kind]=key;if(!written.has(key))fresh.push({key:'file:'+id+':'+key,value:{blob:file,name:file.name,type:file.type,modified:file.lastModified}});}
      const payload={schema:SCHEMA,sequence:++sequence,state:JSON.parse(JSON.stringify(state)),files:keys};
      // Synchronous mirror protects the latest edits when a reload interrupts a write.
      try{sessionStorage.setItem(mirror,JSON.stringify(payload));}catch{/* IndexedDB remains authoritative if the text mirror is full. */}
      const write=async()=>{const db=await database;await new Promise((resolve,reject)=>{
        const tx=db.transaction('entries','readwrite'),store=tx.objectStore('entries'),current=store.get('state:'+id);let accepted=false;
        current.onsuccess=()=>{if(current.result?.value?.sequence>payload.sequence)return;accepted=true;for(const entry of fresh)store.put(entry);store.put({key:'state:'+id,value:payload});const request=store.getAllKeys();request.onsuccess=()=>{for(const key of request.result)if(String(key).startsWith('file:'+id+':')&&!Object.values(keys).some(value=>key==='file:'+id+':'+value))store.delete(key);};};
        tx.oncomplete=()=>{if(accepted)for(const key of Object.values(keys))if(key)written.add(key);resolve();};tx.onerror=()=>reject(Error('Your latest work could not be saved. Check browser storage before leaving this page.'));tx.onabort=()=>reject(Error('Workspace saving was interrupted. Try again before leaving this page.'));
      });};
      const result=chain.catch(()=>{}).then(write);chain=result;return result;
    }
    function fingerprint(file){if(!hashes.has(file))hashes.set(file,file.arrayBuffer().then(bytes=>crypto.subtle.digest('SHA-256',bytes)).then(bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')));return hashes.get(file);}
    return {load,save,fingerprint};
  }
  global.DraftedWorkspaceStore={create,valid};
})(window);
