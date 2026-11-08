/* Conservative spelling only. Runs in a worker and is independently testable. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.DraftedSpellingEngine=factory();})(globalThis,function(){
 'use strict';
 const common={
  en:{adress:'address',accomodate:'accommodate',acheive:'achieve',acheived:'achieved',enviroment:'environment',goverment:'government',proffesional:'professional',profesional:'professional',occured:'occurred',occuring:'occurring',begining:'beginning',commited:'committed',committment:'commitment',knowlege:'knowledge',bussiness:'business',employement:'employment',achievment:'achievement',abilty:'ability',oportunity:'opportunity',prefered:'preferred',developement:'development',improvments:'improvements',requirments:'requirements',requirment:'requirement',teh:'the',thsi:'this',thier:'their',recieve:'receive',recieved:'received',recieving:'receiving',beleive:'believe',becuase:'because',definately:'definitely',seperate:'separate',seperately:'separately',succesful:'successful',successfull:'successful',sucessful:'successful',responsibilty:'responsibility',responsibilites:'responsibilities',experiance:'experience',expereince:'experience',managment:'management',relevent:'relevant',langauge:'language',englsih:'English',englsh:'English',improvment:'improvement'},
  sv:{anställnign:'anställning',arbetsupgifter:'arbetsuppgifter',arbetslivserfarenhett:'arbetslivserfarenhet',proffesionell:'professionell',proffessionell:'professionell',profesionell:'professionell',intreserad:'intresserad',intresserrad:'intresserad',komunikation:'kommunikation',kommunikaton:'kommunikation',komunicera:'kommunicera',utbildnign:'utbildning',beskrivnign:'beskrivning',lösnign:'lösning',förbättrningar:'förbättringar',kundkontakterr:'kundkontakter',kundservise:'kundservice',ledarskapp:'ledarskap',samarbetee:'samarbete',resultatt:'resultat',ansvaradee:'ansvarade',ockås:'också',ocksåå:'också',mycekt:'mycket',myket:'mycket',efterssom:'eftersom',efersom:'eftersom',erfarenhett:'erfarenhet',erfarenhte:'erfarenhet',utvecklign:'utveckling',utvekling:'utveckling',projektlednign:'projektledning',förbättrign:'förbättring',ansavrar:'ansvarar',arbettade:'arbetade',anvndare:'användare',sammarbete:'samarbete'}
 };
 const markers={en:new Set('i the a an and with was were have has my we our to for in on this that it is of want worked work at from'.split(' ')),sv:new Set('jag och att som med var har hade min mitt vi vår våra till för det den de ett en på är från vill arbetade arbete'.split(' '))};
 function language(context){const words=(context.toLocaleLowerCase().match(/\p{L}+/gu)||[]).slice(-16);let en=0,sv=0;for(const word of words){if(markers.en.has(word))en++;if(markers.sv.has(word))sv++;}if(sv>=2&&sv>en)return 'sv';if(en>=2&&en>sv)return 'en';return null;}
 function create(dictionaries){
  function correction(word,context='',protectedWords=new Set()){
   // Unknown capitals, identifiers, compounds and short words are too risky.
   if(!/^[a-zåäöéèü]+$/u.test(word)||word.length>28||protectedWords.has(word)||word.length<3)return null;
   if(Object.values(dictionaries).some(d=>d.correct(word)))return null;
   const lang=language(context),mapped=Object.entries(common).filter(([key,map])=>(!lang||key===lang)&&map[word]);
   if(mapped.length===1&&dictionaries[mapped[0][0]].correct(mapped[0][1][word]))return {word:mapped[0][1][word],language:mapped[0][0]};
   // Dictionary proximity alone cannot distinguish a typo from a new name,
   // specialist term or Swedish compound. Only high-confidence typo mappings
   // above are automatic; native spellcheck remains available for other words.
   return null;
  }
  return {correction};
 }
 function prepareDictionary(dictionary){
  // nspell cannot safely interpret every Swedish compound rule (unescaped
  // punctuation can accept every token). Validate our explicit spelling pairs
  // against dictionary entries/inflections; unknown compounds stay untouched.
  dictionary.compoundRules=[];
  return dictionary;
 }
 return {create,language,prepareDictionary};
});
