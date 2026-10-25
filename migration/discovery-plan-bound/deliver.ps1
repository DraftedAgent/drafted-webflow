param([ValidateSet('prepare','smoke','activate')][string]$Phase='prepare')
$ErrorActionPreference='Stop'
$taskPackageSha='92c2634907b46e8ce421fe8f816f2d21024acb0116481df746ab6b008daa4f20'
$taskTransactionRoot='C:/Users/wallg/AppData/Local/Drafted/dev-system-backups/n8n/discovery-bound-20261025-92c2634'
$taskReceiptRoot=Join-Path (Get-Location) 'dev-system/deliveries/discovery-bound-2026-10-25'
$taskStatePath=Join-Path $taskTransactionRoot 'state.dpapi'
$taskAst=[Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) 'migration/luna-delivery/deploy.ps1'),[ref]$null,[ref]$null)
foreach($taskFunction in $taskAst.FindAll({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst]},$true)){if($taskFunction.Name -in @('Get-TextHash','Protect-Text','Unprotect-Text','Save-Encrypted','Save-State','Read-State','Read-Workflow','Write-Journal')){Invoke-Expression $taskFunction.Extent.Text}}
function Check-Bound([string]$Mode,$Value){$taskOut=($Value|ConvertTo-Json -Depth 100 -Compress)| & node migration/discovery-plan-bound/delivery-helper.cjs $Mode;if($LASTEXITCODE -ne 0){throw ('BOUND_CHECK_FAILED_'+$Mode)};return ($taskOut|ConvertFrom-Json -Depth 100)}
$taskHeaders=$null;$taskCredential=$null
try{
 $script:taskGitSha=(& git rev-parse HEAD).Trim()
 New-Item -ItemType Directory -Path $taskTransactionRoot -Force|Out-Null
 New-Item -ItemType Directory -Path $taskReceiptRoot -Force|Out-Null
 $taskCredential=Import-Clixml -LiteralPath 'C:/Users/wallg/.codex/secrets/drafted-n8n.credential.xml'
 $taskBase=[Environment]::GetEnvironmentVariable('N8N_BASE_URL','User');if(-not $taskBase){$taskBase=$env:N8N_BASE_URL}
 if(([uri]$taskBase).Host -ne 'drafted.app.n8n.cloud'){throw 'INSTANCE_HOST_CHANGED'}
 $script:taskApi=$taskBase.TrimEnd('/')+'/api/v1';$script:taskHeaders=@{'X-N8N-API-KEY'=$taskCredential.GetNetworkCredential().Password}
 if($Phase -eq 'prepare'){
  $taskPrepareLock=Join-Path $taskTransactionRoot 'prepare-started.lock'
  if(Test-Path -LiteralPath $taskPrepareLock){
   $taskPreviousEvents=@(Get-Content -LiteralPath (Join-Path $taskTransactionRoot 'events.jsonl')|ForEach-Object{$_|ConvertFrom-Json})
   if((Test-Path -LiteralPath $taskStatePath) -or @($taskPreviousEvents|Where-Object{$_.event -notin @('stopped','preflight_retry')}).Count){throw 'BOUND_PREPARATION_ALREADY_PROGRESSSED'}
   Write-Journal @{event='preflight_retry';reason='No prior snapshot, workflow save or model call; capture-metadata comparison corrected'}
  }else{$taskLock=[IO.File]::Open($taskPrepareLock,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);$taskLock.Dispose()}
  $taskBefore=Read-Workflow 'zeIzzxPwD2Y91OyD';$taskPlan=Check-Bound 'prepare' @{workflow=$taskBefore.definition}
  $taskBeforeSnap=Save-Encrypted $taskBefore.raw $taskPlan.id $taskBefore.definition.versionId 'BOUND-before'
  $taskCandidateSnap=Save-Encrypted ($taskPlan|ConvertTo-Json -Depth 100 -Compress) $taskPlan.id $taskBefore.definition.versionId 'BOUND-candidate'
  Write-Journal @{event='prepared';beforeVersion=$taskBefore.definition.versionId;beforeSnapshot=$taskBeforeSnap;candidateSnapshot=$taskCandidateSnap}
  $taskFresh=Read-Workflow $taskPlan.id;$null=Check-Bound 'before-save' @{workflow=$taskFresh.definition;plan=$taskPlan}
  $taskSave=Invoke-WebRequest -Method Put -Uri ($script:taskApi+'/workflows/'+$taskPlan.id+'?publishIfActive=false') -Headers $script:taskHeaders -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes(($taskPlan.payload|ConvertTo-Json -Depth 100 -Compress))) -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
  Write-Journal @{event='save_response';httpStatus=[int]$taskSave.StatusCode};if([int]$taskSave.StatusCode -ne 200){throw ('BOUND_SAVE_HTTP_'+[int]$taskSave.StatusCode)}
  $taskSaved=Read-Workflow $taskPlan.id;$taskProof=Check-Bound 'saved' @{workflow=$taskSaved.definition;plan=$taskPlan}
  $taskSavedSnap=Save-Encrypted $taskSaved.raw $taskPlan.id $taskSaved.definition.versionId 'BOUND-saved-not-active'
  $taskFixture=(& node -e "const r=structuredClone(require('./dev-system/prepared/model-pilot/manifest.json').cases.find(c=>c.id==='plan-overlap').request);r.requestId='schema-smoke-'+require('crypto').randomUUID();r.contextRevision='synthetic-schema-context';r.cvVersionId='synthetic-schema-cv';r.blocks=[{blockId:'synthetic-summary',type:'summary',label:'Profile',order:10,text:'Software tester. Tested internal releases. Did not lead delivery planning.'}];r.jobContext.topPriorities=[{signal:'Lead delivery planning',weight:5},{signal:'Run training workshops',weight:4}];r.jobContext.mustHave=['Willingness to travel'];process.stdout.write(JSON.stringify(r));")|ConvertFrom-Json -Depth 30
  $taskState=@{phase='saved_not_active';plan=$taskPlan;savedVersionId=$taskSaved.definition.versionId;request=$taskFixture;snapshots=@($taskBeforeSnap,$taskCandidateSnap,$taskSavedSnap);modelCallsReserved=0;smoke=$null};Save-State $taskState
  @{status='saved_not_active';proof=$taskProof;modelCallsInitiated=0;snapshots=@($taskBeforeSnap,$taskCandidateSnap,$taskSavedSnap)}|ConvertTo-Json -Depth 20|Set-Content -LiteralPath (Join-Path $taskReceiptRoot 'prepared.json') -Encoding utf8NoBOM
  Write-Output ('SAVED DRAFT '+$taskSaved.definition.versionId+'; original active remains '+$taskProof.activeVersionId+'; zero model calls.')
 }
 elseif($Phase -eq 'smoke'){
  $taskState=Read-State;if($taskState.phase -ne 'saved_not_active'){throw 'BOUND_NOT_READY_FOR_SMOKE'}
  $taskCurrent=Read-Workflow $taskState.plan.id;$null=Check-Bound 'saved' @{workflow=$taskCurrent.definition;plan=$taskState.plan};if($taskCurrent.definition.versionId -ne $taskState.savedVersionId){throw 'BOUND_DRAFT_CHANGED'}
  # One durable slot, claimed before HTTP. No retries or replacement calls.
  $taskCallLock=[IO.File]::Open((Join-Path $taskTransactionRoot 'synthetic-call-consumed.lock'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);$taskCallLock.Dispose()
  $taskState.modelCallsReserved=1;Save-State $taskState;Write-Journal @{event='synthetic_slot_consumed';requestId=$taskState.request.requestId;maxCalls=1}
  $taskResponse=Invoke-WebRequest -Method Post -Uri ($taskBase.TrimEnd('/')+'/webhook-test/webflow-experience-discovery') -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes(($taskState.request|ConvertTo-Json -Depth 40 -Compress))) -TimeoutSec 150 -MaximumRedirection 0 -SkipHttpErrorCheck
  $taskBody=$taskResponse.Content|ConvertFrom-Json -Depth 100
  @{request=$taskState.request;status=[int]$taskResponse.StatusCode;response=$taskBody}|ConvertTo-Json -Depth 100|Set-Content -LiteralPath (Join-Path $taskReceiptRoot 'synthetic-response.json') -Encoding utf8NoBOM
  $taskSmoke=Check-Bound 'smoke' @{request=$taskState.request;status=[int]$taskResponse.StatusCode;response=$taskBody}
  $taskState.phase='synthetic_smoke_passed';$taskState.smoke=$taskSmoke;Save-State $taskState
  Write-Journal @{event='synthetic_smoke_passed';status=[int]$taskResponse.StatusCode;requestId=$taskState.request.requestId}
  $taskSmoke|ConvertTo-Json -Depth 5
 }
 elseif($Phase -eq 'activate'){
  $taskState=Read-State;if($taskState.phase -ne 'synthetic_smoke_passed' -or $taskState.modelCallsReserved -ne 1){throw 'BOUND_SMOKE_REQUIRED_BEFORE_ACTIVATION'}
  $taskRuntimeProof=Get-Content -Raw -LiteralPath (Join-Path $taskReceiptRoot 'runtime-proof.json')|ConvertFrom-Json -Depth 20
  if($taskRuntimeProof.savedVersion -ne $taskState.savedVersionId -or $taskRuntimeProof.requestId -ne $taskState.request.requestId -or $taskRuntimeProof.modelCalls -ne 1 -or $taskRuntimeProof.model -ne 'gpt-6-luna' -or $taskRuntimeProof.apiEcho.strict -ne $true -or $taskRuntimeProof.apiEcho.format -ne 'json_schema' -or $taskRuntimeProof.publicResponseValidated -ne $true){throw 'BOUND_ACTUAL_SCHEMA_PROOF_REQUIRED'}
  $taskCurrent=Read-Workflow $taskState.plan.id;$null=Check-Bound 'saved' @{workflow=$taskCurrent.definition;plan=$taskState.plan};if($taskCurrent.definition.versionId -ne $taskState.savedVersionId){throw 'BOUND_SAVED_VERSION_CHANGED'}
  $taskPublish=Invoke-WebRequest -Method Post -Uri ($script:taskApi+'/workflows/'+$taskState.plan.id+'/activate') -Headers $script:taskHeaders -ContentType 'application/json' -Body (@{versionId=$taskState.savedVersionId}|ConvertTo-Json -Compress) -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
  Write-Journal @{event='activate_response';httpStatus=[int]$taskPublish.StatusCode;versionId=$taskState.savedVersionId};if([int]$taskPublish.StatusCode -ne 200){throw ('BOUND_ACTIVATION_HTTP_'+[int]$taskPublish.StatusCode)}
  $taskActive=Read-Workflow $taskState.plan.id;$null=Check-Bound 'published' @{workflow=$taskActive.definition;plan=$taskState.plan}
  $taskSnapshot=Save-Encrypted $taskActive.raw $taskState.plan.id $taskActive.definition.versionId 'BOUND-active'
  $taskFinal=Read-Workflow $taskState.plan.id;$taskProof=Check-Bound 'published' @{workflow=$taskFinal.definition;plan=$taskState.plan}
  $taskState.phase='active_verified';$taskState.snapshots+=@($taskSnapshot);Save-State $taskState
  @{status='active_verified';proof=$taskProof;changedNodes=$taskState.plan.changedNodes;addedNodes=$taskState.plan.addedNodes;snapshots=$taskState.snapshots;syntheticVerification=$taskState.smoke;runtimeSchemaVerification=$taskRuntimeProof;modelCallsInitiated=1;ordinaryUserFlowVerified=$false}|ConvertTo-Json -Depth 25|Set-Content -LiteralPath (Join-Path $taskReceiptRoot 'receipt.json') -Encoding utf8NoBOM
  Write-Journal @{event='active_verified';versionId=$taskProof.activeVersionId;projection=$taskProof.candidateProjectionSha256}
  Write-Output ('ACTIVE VERIFIED '+$taskProof.activeVersionId+'; Luna; one synthetic call; no retries.')
 }
}catch{Write-Journal @{event='stopped';phase=$Phase;reason='BOUND_DELIVERY_CHECK_FAILED'};Write-Output ('STOPPED: '+$_.Exception.Message);exit 1}
finally{if($script:taskHeaders){$script:taskHeaders.Clear()};$script:taskHeaders=$null;$taskCredential=$null;$taskBefore=$null;$taskState=$null}
