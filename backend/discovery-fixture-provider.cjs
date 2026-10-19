/* Synthetic development provider; does not call any model service. */
function fixtureModel({request:r}){
  if(r.operation==='plan')return {topics:r.jobContext.topPriorities.map((p,index)=>({key:`fixture-${index}`,support:'unclear',question:r.conversationLanguage==='sv'?[
    'Har du varit med och bestämt vad ett produktteam ska bygga härnäst?',
    'Har du pratat med användare för att förstå vad de behöver?',
    'Har du arbetat tillsammans med designers och utvecklare?',
    'Har du följt upp om en förändring gjorde något bättre?',
    'Har du hjälpt till att hålla ihop ett arbete fram till leverans?',
    'Har du förklarat ett beslut för personer med olika perspektiv?',
    'Har du förenklat hur någon kommer igång med en tjänst?'][index]:[
    'Have you helped decide what a product team builds next?',
    'Have you talked with users to understand what they need?',
    'Have you worked with designers and developers?',
    'Have you checked whether a change made something better?',
    'Have you helped keep work on track through delivery?',
    'Have you explained a decision to people with different perspectives?',
    'Have you made it easier for someone to get started with a service?'][index],signalRefs:[{field:'topPriorities',index}],evidence:[]}))};
  const text=r.sourceAnswer.text;
  // Verbatim per paragraph: no unsupported inference even in fixtures.
  const paragraphs=text.split(/\n\s*\n/).filter(x=>x.trim());
  return {drafts:(paragraphs.length>20?[text]:paragraphs).map(x=>({proposedText:x,sourceQuote:x,coveredQuestionIds:[]}))};
}
module.exports={fixtureModel};
