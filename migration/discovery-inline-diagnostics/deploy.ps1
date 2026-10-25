$ErrorActionPreference='Stop'
$taskCredential=$null;$taskHeaders=$null
$taskTransactionRoot='C:/Users/wallg/AppData/Local/Drafted/dev-system-backups/n8n/discovery-diagnostics-2026-10-25'
$taskReceiptRoot=Join-Path (Get-Location) 'dev-system/deliveries/discovery-diagnostics-2026-10-25'
$taskAst=[Management.Automation.Language.Parser]::ParseFile((Join-Path (Get-Location) 'migration/luna-delivery/deploy.ps1'),[ref]$null,[ref]$null)
$taskFunctions=@('Get-TextHash','Protect-Text','Unprotect-Text','Save-Encrypted','Read-Workflow','Write-Journal')
foreach($taskFunction in $taskAst.FindAll({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst]},$true)) {if($taskFunction.Name -in $taskFunctions){Invoke-Expression $taskFunction.Extent.Text}}
function Check-Diagnostics([string]$Mode,$Value){$taskInput=$Value|ConvertTo-Json -Depth 100 -Compress;$taskOutput=$taskInput| & node migration/discovery-inline-diagnostics/delivery-helper.cjs $Mode;if($LASTEXITCODE -ne 0){throw ('DIAGNOSTIC_LOCAL_CHECK_FAILED_'+$Mode)};return ($taskOutput|ConvertFrom-Json -Depth 100)}
try{
 $script:taskGitSha=(& git rev-parse HEAD).Trim()
 $taskPackageSha=Get-TextHash ([IO.File]::ReadAllText((Join-Path (Get-Location) 'dev-system/prepared/discovery-inline-diagnostics/proposal.json')))
 New-Item -ItemType Directory -Path $taskTransactionRoot -Force|Out-Null
 New-Item -ItemType Directory -Path $taskReceiptRoot -Force|Out-Null
 $taskLock=[IO.File]::Open((Join-Path $taskTransactionRoot 'delivery-started.lock'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);$taskLock.Dispose()
 $taskCredential=Import-Clixml -LiteralPath 'C:/Users/wallg/.codex/secrets/drafted-n8n.credential.xml'
 $taskBase=[Environment]::GetEnvironmentVariable('N8N_BASE_URL','User');if(-not $taskBase){$taskBase=$env:N8N_BASE_URL}
 if(([uri]$taskBase).Host -ne 'drafted.app.n8n.cloud'){throw 'INSTANCE_HOST_CHANGED'}
 $script:taskApi=$taskBase.TrimEnd('/')+'/api/v1'
 $script:taskHeaders=@{'X-N8N-API-KEY'=$taskCredential.GetNetworkCredential().Password}
 $taskBefore=Read-Workflow 'zeIzzxPwD2Y91OyD'
 $taskPlan=Check-Diagnostics 'prepare' ([pscustomobject]@{workflow=$taskBefore.definition})
 $taskPreSnapshot=Save-Encrypted $taskBefore.raw $taskPlan.id $taskBefore.definition.versionId 'DIAGNOSTIC-before'
 $taskCandidateSnapshot=Save-Encrypted ($taskPlan|ConvertTo-Json -Depth 100 -Compress) $taskPlan.id $taskBefore.definition.versionId 'DIAGNOSTIC-candidate-and-binding'
 Write-Journal ([pscustomobject]@{event='prepared';beforeVersionId=$taskPlan.beforeVersionId;proposalSha256=$taskPlan.proposalSha256;beforeSnapshot=$taskPreSnapshot;candidateSnapshot=$taskCandidateSnapshot})
 $taskFresh=Read-Workflow $taskPlan.id
 $null=Check-Diagnostics 'before-save' ([pscustomobject]@{workflow=$taskFresh.definition;plan=$taskPlan})
 $taskPayload=$taskPlan.payload|ConvertTo-Json -Depth 100 -Compress
 $taskSave=Invoke-WebRequest -Method Put -Uri ($script:taskApi+'/workflows/'+$taskPlan.id+'?publishIfActive=false') -Headers $script:taskHeaders -Body ([Text.Encoding]::UTF8.GetBytes($taskPayload)) -ContentType 'application/json' -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
 Write-Journal ([pscustomobject]@{event='save_response';httpStatus=[int]$taskSave.StatusCode})
 if([int]$taskSave.StatusCode -ne 200){throw ('DIAGNOSTIC_SAVE_HTTP_'+[int]$taskSave.StatusCode)}
 $taskSaved=Read-Workflow $taskPlan.id
 $null=Check-Diagnostics 'saved' ([pscustomobject]@{workflow=$taskSaved.definition;plan=$taskPlan})
 $taskSavedSnapshot=Save-Encrypted $taskSaved.raw $taskPlan.id $taskSaved.definition.versionId 'DIAGNOSTIC-saved-before-publish'
 $taskFreshSaved=Read-Workflow $taskPlan.id
 if($taskFreshSaved.definition.versionId -ne $taskSaved.definition.versionId){throw 'DIAGNOSTIC_VERSION_CHANGED_BEFORE_PUBLISH'}
 $null=Check-Diagnostics 'saved' ([pscustomobject]@{workflow=$taskFreshSaved.definition;plan=$taskPlan})
 $taskBody=@{versionId=$taskSaved.definition.versionId}|ConvertTo-Json -Compress
 $taskPublish=Invoke-WebRequest -Method Post -Uri ($script:taskApi+'/workflows/'+$taskPlan.id+'/activate') -Headers $script:taskHeaders -Body ([Text.Encoding]::UTF8.GetBytes($taskBody)) -ContentType 'application/json' -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
 Write-Journal ([pscustomobject]@{event='activate_response';httpStatus=[int]$taskPublish.StatusCode;versionId=$taskSaved.definition.versionId})
 if([int]$taskPublish.StatusCode -ne 200){throw ('DIAGNOSTIC_ACTIVATE_HTTP_'+[int]$taskPublish.StatusCode)}
 $taskActive=Read-Workflow $taskPlan.id
 $taskProof=Check-Diagnostics 'published' ([pscustomobject]@{workflow=$taskActive.definition;plan=$taskPlan})
 if($taskProof.activeVersionId -ne $taskSaved.definition.versionId){throw 'DIAGNOSTIC_WRONG_ACTIVE_VERSION'}
 $taskPostSnapshot=Save-Encrypted $taskActive.raw $taskPlan.id $taskActive.definition.versionId 'DIAGNOSTIC-published'
 $taskFinal=Read-Workflow $taskPlan.id
 $taskFinalProof=Check-Diagnostics 'published' ([pscustomobject]@{workflow=$taskFinal.definition;plan=$taskPlan})
 $taskReceipt=[pscustomobject]@{status='published_verified';date='2026-10-25';proof=$taskFinalProof;approval='Explicit owner approval of only the prepared one-node diagnostic change following DEV-108';snapshots=@($taskPreSnapshot,$taskCandidateSnapshot,$taskSavedSnapshot,$taskPostSnapshot);modelExecutionsInitiated=0;v3Activated=$false;verifierAdded=$false;graphChanged=$false;publicContractChanged=$false;modelConfigurationChanged=$false;interpretationChanged=$false;diagnosticOnly=$true;promptChanged=$false;strictValidationUnchanged=$true;ordinaryQuestionFlowVerified=$false;proposalSha256=$taskPlan.proposalSha256}
 $taskReceipt|ConvertTo-Json -Depth 20|Set-Content -LiteralPath (Join-Path $taskReceiptRoot 'receipt.json') -Encoding utf8NoBOM
 Write-Journal ([pscustomobject]@{event='active_verified';activeVersionId=$taskFinalProof.activeVersionId;projectionSha256=$taskFinalProof.projectionSha256})
 Write-Output ('PUBLISHED and re-read Discovery diagnostic detail; active '+$taskFinalProof.activeVersionId+'; only Validate model response changed; zero model calls.')
}catch{
 if(Test-Path -LiteralPath $taskTransactionRoot){Write-Journal ([pscustomobject]@{event='stopped';reason='DIAGNOSTIC_DELIVERY_CHECK_FAILED'})}
 Write-Output ('STOPPED: '+$_.Exception.Message);exit 1
}finally{
 if($taskHeaders){$taskHeaders.Clear()};$taskHeaders=$null;$script:taskHeaders=$null;$taskCredential=$null;$taskPlan=$null;$taskPayload=$null;$taskBefore=$null;$taskActive=$null;$taskSaved=$null
}
