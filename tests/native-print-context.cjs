'use strict';
// Isolated test profile only. Never changes the user's browser/printer settings.
const {chromium}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'drafted-native-print-profile-')),dir=fs.mkdtempSync(path.join(os.tmpdir(),'drafted-native-print-files-'));
 fs.mkdirSync(path.join(profile,'Default'));
 const settings={recentDestinations:[{id:'Save as PDF',origin:'local',account:''}],selectedDestinationId:'Save as PDF',version:2,isHeaderFooterEnabled:false,isCssBackgroundEnabled:true,marginsType:1,scaling:'100',mediaSize:{height_microns:297000,width_microns:210000,name:'ISO_A4',custom_display_name:'A4'}};
 fs.writeFileSync(path.join(profile,'Default/Preferences'),JSON.stringify({printing:{print_preview_sticky_settings:{appState:JSON.stringify(settings)}},savefile:{default_directory:dir},download:{default_directory:dir,prompt_for_download:false}}));
 const context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:false,args:['--kiosk-printing','--window-position=-20000,-20000'],viewport:{width:1440,height:1000}});
 return {
  async newPage(options={}){const page=await context.newPage();if(options.viewport)await page.setViewportSize(options.viewport);return page;},
  version:()=>context.browser().version(),close:()=>context.close(),
  async savePrint(page,target){
   const before=new Map(fs.readdirSync(dir).map(name=>[name,fs.statSync(path.join(dir,name)).mtimeMs]));
   await page.getByRole('button',{name:'Print / Save as PDF',exact:true}).click();
   let saved;
   for(let i=0;i<80&&!saved;i++){
    await new Promise(resolve=>setTimeout(resolve,250));
    for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.pdf'))){
     const file=path.join(dir,name);if(before.get(name)===fs.statSync(file).mtimeMs)continue;
     const bytes=fs.readFileSync(file);if(bytes.subarray(0,5).toString()==='%PDF-'&&bytes.subarray(-64).toString().includes('%%EOF')){saved=file;break;}
    }
   }
   assert.ok(saved,'Native Save as PDF must produce a complete file');fs.copyFileSync(saved,target);
   await page.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]'));
   assert.match(await page.locator('.workspace-print-status').textContent(),/Print dialog closed/);
  }
 };
};
