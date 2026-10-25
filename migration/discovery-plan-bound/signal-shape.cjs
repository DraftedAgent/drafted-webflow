'use strict';
// Bounded diagnostics only. Never read or serialize assessment values or free-text keys.
function describe(expectedKeys,assessments){
 const containerType=assessments===undefined?'missing':assessments===null?'null':Array.isArray(assessments)?'array':typeof assessments;
 const report={containerType,expectedKeys:expectedKeys.slice(),actualKeyCount:null,missingKeys:null,unexpectedSignalKeys:null,redactedUnexpectedKeyCount:0,omittedUnexpectedSignalKeyCount:0};
 if(containerType!=='object')return report;
 const keys=Object.keys(assessments),expected=new Set(expectedKeys);
 report.actualKeyCount=keys.length;report.missingKeys=expectedKeys.filter(id=>!Object.hasOwn(assessments,id));report.unexpectedSignalKeys=[];
 for(const key of keys){
  if(expected.has(key))continue;
  // Only backend-vocabulary tokens plus a bounded numeric suffix are safe to expose.
  // Everything else, including a CV sentence used as a key, is counted only.
  if(!/^(?:signal_)?(?:topPriorities|mustHave)_\d{1,6}$/.test(key)){report.redactedUnexpectedKeyCount++;continue;}
  if(report.unexpectedSignalKeys.length<20)report.unexpectedSignalKeys.push(key);else report.omittedUnexpectedSignalKeyCount++;
 }
 return report;
}
module.exports={describe};
