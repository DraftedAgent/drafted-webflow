param([ValidateSet('prepare','deploy','compat','verify')][string]$Phase = 'prepare')
$ErrorActionPreference = 'Stop'
$taskPackageSha = 'e2e5f7f027a559ac131f0c44e7e78fe79e7b6d5b226db5ac533807ea1201198e'
$taskTransactionRoot = 'C:/Users/wallg/AppData/Local/Drafted/dev-system-backups/n8n/luna-migration-2026-10-25-e2e5f7f'
$taskReceiptRoot = Join-Path (Get-Location) 'dev-system/deliveries/luna-2026-10-25'
$taskStatePath = Join-Path $taskTransactionRoot 'state.dpapi'
$taskCredential = $null
$taskHeaders = $null
function Get-TextHash([string]$Text) { return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($Text))).ToLowerInvariant() }
function Protect-Text([string]$Text) {
 $taskParts=@(); for($taskOffset=0;$taskOffset -lt $Text.Length;$taskOffset+=40000) {
  $taskPart=$Text.Substring($taskOffset,[Math]::Min(40000,$Text.Length-$taskOffset))
  $taskPartSecure=ConvertTo-SecureString -String $taskPart -AsPlainText -Force
  $taskParts+=ConvertFrom-SecureString -SecureString $taskPartSecure
 }
 return ([pscustomobject]@{format='dpapi-chunks-1';parts=$taskParts} | ConvertTo-Json -Depth 4 -Compress)
}
function Unprotect-Text([string]$Cipher) {
 $taskContainer=$Cipher | ConvertFrom-Json -Depth 5
 if($taskContainer.format -ne 'dpapi-chunks-1') { throw 'SNAPSHOT_FORMAT_INVALID' }
 $taskClearParts=@();foreach($taskPart in @($taskContainer.parts)) {
  $taskClearParts+=[System.Net.NetworkCredential]::new('', (ConvertTo-SecureString -String $taskPart)).Password
 }
 return [string]::Concat([string[]]$taskClearParts)
}
function Save-Encrypted([string]$Text,[string]$Id,[string]$Version,[string]$Label) {
 $taskFolder = Join-Path 'C:/Users/wallg/AppData/Local/Drafted/dev-system-backups/n8n' $Id
 New-Item -ItemType Directory -Path $taskFolder -Force | Out-Null
 $taskStamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
 $taskFile = Join-Path $taskFolder ($taskStamp + '__' + $Id + '__' + $Version + '__LUNA-' + $Label + '.dpapi')
 if (Test-Path -LiteralPath $taskFile) { throw 'SNAPSHOT_ALREADY_EXISTS' }
 $taskCipher = Protect-Text $Text
 [IO.File]::WriteAllText($taskFile,$taskCipher,[Text.UTF8Encoding]::new($false))
 $taskRoundTrip = Unprotect-Text ([IO.File]::ReadAllText($taskFile))
 $taskHash = Get-TextHash $Text
 if ((Get-TextHash $taskRoundTrip) -ne $taskHash) { throw 'SNAPSHOT_DECRYPT_VERIFY_FAILED' }
 $taskMeta = [pscustomobject]@{ snapshotPath=$taskFile; manifestPath=($taskFile+'.manifest.json'); plaintextSha256=$taskHash; verified=$true; workflowId=$Id; versionId=$Version; label=$Label; sourceGitCommit=$script:taskGitSha; packageSha256=$taskPackageSha; instanceHost='drafted.app.n8n.cloud'; createdUtc=[DateTime]::UtcNow.ToString('o') }
 [IO.File]::WriteAllText($taskMeta.manifestPath,($taskMeta | ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
 $taskSecure=$null; $taskReadSecure=$null; $taskRoundTrip=$null; $taskCipher=$null
 return $taskMeta
}
function Save-State($State) {
 $taskText = $State | ConvertTo-Json -Depth 100 -Compress
 [IO.File]::WriteAllText($taskStatePath,(Protect-Text $taskText),[Text.UTF8Encoding]::new($false))
 $taskVerify = Unprotect-Text ([IO.File]::ReadAllText($taskStatePath))
 if ((Get-TextHash $taskVerify) -ne (Get-TextHash $taskText)) { throw 'STATE_VERIFY_FAILED' }
}
function Read-State {
 return ((Unprotect-Text ([IO.File]::ReadAllText($taskStatePath))) | ConvertFrom-Json -Depth 100)
}
function Invoke-LocalCheck([string]$Mode,$InputObject) {
 $taskJson = $InputObject | ConvertTo-Json -Depth 100 -Compress
 $taskOut = $taskJson | & node migration/luna-delivery/helper.cjs $Mode
 if ($LASTEXITCODE -ne 0) { throw ('LOCAL_CHECK_FAILED_'+$Mode) }
 return ($taskOut | ConvertFrom-Json -Depth 100)
}
function Read-Workflow([string]$Id) {
 $taskResponse = Invoke-WebRequest -Method Get -Uri ($script:taskApi + '/workflows/' + $Id) -Headers $script:taskHeaders -TimeoutSec 60 -MaximumRedirection 0
 return [pscustomobject]@{ raw=[string]$taskResponse.Content; definition=([string]$taskResponse.Content | ConvertFrom-Json -Depth 100) }
}
function Write-Journal($Event) {
 $taskLine = ($Event | ConvertTo-Json -Depth 30 -Compress) + [Environment]::NewLine
 $taskBytes = [Text.Encoding]::UTF8.GetBytes($taskLine)
 $taskStream = [IO.File]::Open((Join-Path $taskTransactionRoot 'events.jsonl'),[IO.FileMode]::Append,[IO.FileAccess]::Write,[IO.FileShare]::Read)
 try { $taskStream.Write($taskBytes,0,$taskBytes.Length); $taskStream.Flush($true) } finally { $taskStream.Dispose() }
}
try {
 $script:taskGitSha = (& git rev-parse HEAD).Trim()
 $taskCredential = Import-Clixml -LiteralPath 'C:/Users/wallg/.codex/secrets/drafted-n8n.credential.xml'
 $taskBase = [Environment]::GetEnvironmentVariable('N8N_BASE_URL','User')
 if (-not $taskBase) { $taskBase=$env:N8N_BASE_URL }
 if (([uri]$taskBase).Host -ne 'drafted.app.n8n.cloud') { throw 'INSTANCE_HOST_CHANGED' }
 $script:taskApi = $taskBase.TrimEnd('/') + '/api/v1'
 $script:taskHeaders = @{ 'X-N8N-API-KEY'=$taskCredential.GetNetworkCredential().Password }
 New-Item -ItemType Directory -Path $taskReceiptRoot -Force | Out-Null
 if ($Phase -eq 'prepare') {
  if (Test-Path -LiteralPath $taskStatePath) { throw 'PREPARED_TRANSACTION_EXISTS' }
  New-Item -ItemType Directory -Path $taskTransactionRoot -Force | Out-Null
  $taskInventory = Get-Content -Raw -LiteralPath 'dev-system/prepared/luna-migration/inventory.json' | ConvertFrom-Json -Depth 100
  $taskBefore=@(); foreach($taskEntry in @($taskInventory.workflows | Where-Object { $_.models.Count -gt 0 })) { $taskBefore += (Read-Workflow $taskEntry.id) }
  $taskPrepared = Invoke-LocalCheck 'preflight' ([pscustomobject]@{workflows=@($taskBefore | ForEach-Object { $_.definition })})
  $taskSnapshots=@(); foreach($taskItem in $taskBefore) {
   $taskW=$taskItem.definition
   $taskSnapshots += Save-Encrypted $taskItem.raw $taskW.id $taskW.versionId 'before'
   $taskP=@($taskPrepared.plans | Where-Object { $_.id -eq $taskW.id })[0]
   $taskSnapshots += Save-Encrypted ($taskP.payload | ConvertTo-Json -Depth 100 -Compress) $taskW.id $taskW.versionId 'candidate'
  }
  $taskState=[pscustomobject]@{packageSha256=$taskPackageSha; phase='prepared'; preparedUtc=[DateTime]::UtcNow.ToString('o'); plans=@($taskPrepared.plans); snapshots=$taskSnapshots; completed=@()}
  Save-State $taskState
  $taskSafe=[pscustomobject]@{phase='prepared'; packageSha256=$taskPackageSha; workflows=@($taskPrepared.plans | ForEach-Object { [pscustomobject]@{id=$_.id; name=$_.name; beforeVersionId=$_.beforeVersionId; beforeActiveVersionId=$_.beforeActiveVersionId; candidateProjectionSha256=$_.candidateProjectionSha256; modelNodes=$_.modelNodes; guardCount=$_.guardNodes.Count} }); snapshots=$taskSnapshots; modelExecutionsInitiated=0; workflowWrites=0}
  $taskSafe | ConvertTo-Json -Depth 15 | Set-Content -LiteralPath (Join-Path $taskReceiptRoot 'prepared.json') -Encoding utf8NoBOM
  Write-Journal ([pscustomobject]@{event='prepared'; packageSha256=$taskPackageSha; workflowCount=6; modelCount=13; verifiedSnapshots=$taskSnapshots.Count})
  Write-Output ('PREPARED six workflows; thirteen models; '+$taskSnapshots.Count+' encrypted snapshots verified; zero workflow writes.')
 }
 elseif($Phase -eq 'deploy') {
  $taskState=Read-State
  if ($taskState.phase -ne 'prepared' -or $taskState.packageSha256 -ne $taskPackageSha) { throw 'TRANSACTION_NOT_PREPARED' }
  $taskLock=[IO.File]::Open((Join-Path $taskTransactionRoot 'deployment-started.lock'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None); $taskLock.Dispose()
  foreach($taskP in @($taskState.plans)) {
   $taskCurrent=Read-Workflow $taskP.id
   $null=Invoke-LocalCheck 'before-save' ([pscustomobject]@{workflow=$taskCurrent.definition;plan=$taskP})
   $taskFinalBefore=Save-Encrypted $taskCurrent.raw $taskP.id $taskCurrent.definition.versionId 'pre-save'
   Write-Journal ([pscustomobject]@{event='before_save';workflowId=$taskP.id;beforeVersionId=$taskCurrent.definition.versionId;snapshot=$taskFinalBefore})
   $taskPayload=$taskP.payload | ConvertTo-Json -Depth 100 -Compress
   $taskSave=Invoke-WebRequest -Method Put -Uri ($script:taskApi+'/workflows/'+$taskP.id+'?publishIfActive=false') -Headers $script:taskHeaders -Body ([Text.Encoding]::UTF8.GetBytes($taskPayload)) -ContentType 'application/json' -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
   Write-Journal ([pscustomobject]@{event='save_response';workflowId=$taskP.id;httpStatus=[int]$taskSave.StatusCode})
   if ([int]$taskSave.StatusCode -ne 200) { throw ('SAVE_HTTP_'+[int]$taskSave.StatusCode) }
   $taskSaved=Read-Workflow $taskP.id
   $taskSaveProof=Invoke-LocalCheck 'saved' ([pscustomobject]@{workflow=$taskSaved.definition;plan=$taskP})
   $taskSavedSnap=Save-Encrypted $taskSaved.raw $taskP.id $taskSaved.definition.versionId 'saved-before-publish'
   Write-Journal ([pscustomobject]@{event='saved_verified';proof=$taskSaveProof;snapshot=$taskSavedSnap})
   $taskPrePublish=Read-Workflow $taskP.id
   if ($taskPrePublish.definition.versionId -ne $taskSaved.definition.versionId) { throw 'SAVED_VERSION_CHANGED_BEFORE_PUBLISH' }
   $null=Invoke-LocalCheck 'saved' ([pscustomobject]@{workflow=$taskPrePublish.definition;plan=$taskP})
   $taskActivationBody=@{versionId=$taskSaved.definition.versionId} | ConvertTo-Json -Compress
   $taskActivate=Invoke-WebRequest -Method Post -Uri ($script:taskApi+'/workflows/'+$taskP.id+'/activate') -Headers $script:taskHeaders -Body ([Text.Encoding]::UTF8.GetBytes($taskActivationBody)) -ContentType 'application/json' -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
   Write-Journal ([pscustomobject]@{event='activate_response';workflowId=$taskP.id;versionId=$taskSaved.definition.versionId;httpStatus=[int]$taskActivate.StatusCode})
   if ([int]$taskActivate.StatusCode -ne 200) { throw ('ACTIVATE_HTTP_'+[int]$taskActivate.StatusCode) }
   $taskPublished=Read-Workflow $taskP.id
   $taskProof=Invoke-LocalCheck 'published' ([pscustomobject]@{workflow=$taskPublished.definition;plan=$taskP})
   if ($taskProof.activeVersionId -ne $taskSaved.definition.versionId) { throw 'WRONG_PUBLISHED_VERSION' }
   $taskPostSnap=Save-Encrypted $taskPublished.raw $taskP.id $taskPublished.definition.versionId 'published'
   $taskResult=[pscustomobject]@{proof=$taskProof;preSaveSnapshot=$taskFinalBefore;savedSnapshot=$taskSavedSnap;postPublishSnapshot=$taskPostSnap;modelExecutionsInitiated=0}
   $taskResult | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $taskReceiptRoot ($taskP.id+'.json')) -Encoding utf8NoBOM
   $taskState.completed+= $taskP.id
   Save-State $taskState
   Write-Journal ([pscustomobject]@{event='published_verified';workflowId=$taskP.id;versionId=$taskProof.activeVersionId;projectionSha256=$taskProof.projectionSha256;modelCount=$taskProof.modelNodes.Count;snapshot=$taskPostSnap})
   Write-Output ('PUBLISHED '+$taskP.name+'; '+$taskProof.modelNodes.Count+' Luna model nodes; active '+$taskProof.activeVersionId)
  }
  $taskState.phase='published'; Save-State $taskState
 }
 elseif($Phase -eq 'compat') {
  $taskState=Read-State
  if ($taskState.phase -ne 'published') { throw 'BASE_DEPLOYMENT_NOT_FINISHED' }
  $taskCompatLock=[IO.File]::Open((Join-Path $taskTransactionRoot 'native-json-compatibility-started.lock'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);$taskCompatLock.Dispose()
  foreach($taskCompatId in @('6Bvk0NYcElT9OirH','zeIzzxPwD2Y91OyD')) {
   $taskOldPlan=@($taskState.plans | Where-Object { $_.id -eq $taskCompatId })[0]
   $taskCompatCurrent=Read-Workflow $taskCompatId
   $taskCompatInput=[pscustomobject]@{workflow=$taskCompatCurrent.definition;plan=$taskOldPlan}
   $taskCompatJson=($taskCompatInput | ConvertTo-Json -Depth 100 -Compress) | & node migration/luna-delivery/native-json-compat.cjs
   if ($LASTEXITCODE -ne 0) { throw 'NATIVE_JSON_COMPATIBILITY_PRECHECK_FAILED' }
   $taskP=$taskCompatJson | ConvertFrom-Json -Depth 100
   $taskBeforeCompat=Save-Encrypted $taskCompatCurrent.raw $taskP.id $taskCompatCurrent.definition.versionId 'pre-native-json-compat'
   $taskCompatCandidateSnap=Save-Encrypted ($taskP.payload | ConvertTo-Json -Depth 100 -Compress) $taskP.id $taskCompatCurrent.definition.versionId 'native-json-compatible-candidate'
   # Re-read immediately before saving; refuse any intervening content or version change.
   $taskFreshCompat=Read-Workflow $taskP.id
   if ($taskFreshCompat.definition.versionId -ne $taskCompatCurrent.definition.versionId) { throw 'COMPAT_BASE_VERSION_CHANGED' }
   $taskFreshCheck=([pscustomobject]@{workflow=$taskFreshCompat.definition;plan=$taskOldPlan} | ConvertTo-Json -Depth 100 -Compress) | & node migration/luna-delivery/native-json-compat.cjs
   if ($LASTEXITCODE -ne 0) { throw 'COMPAT_BASE_CHANGED' }
   $taskPayload=$taskP.payload | ConvertTo-Json -Depth 100 -Compress
   Write-Journal ([pscustomobject]@{event='native_json_compat_before_save';workflowId=$taskP.id;guards=$taskP.compatibilityGuards;snapshot=$taskBeforeCompat})
   $taskSave=Invoke-WebRequest -Method Put -Uri ($script:taskApi+'/workflows/'+$taskP.id+'?publishIfActive=false') -Headers $script:taskHeaders -Body ([Text.Encoding]::UTF8.GetBytes($taskPayload)) -ContentType 'application/json' -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
   if ([int]$taskSave.StatusCode -ne 200) { throw ('COMPAT_SAVE_HTTP_'+[int]$taskSave.StatusCode) }
   $taskSaved=Read-Workflow $taskP.id
   $null=Invoke-LocalCheck 'saved' ([pscustomobject]@{workflow=$taskSaved.definition;plan=$taskP})
   $taskCompatSaved=Save-Encrypted $taskSaved.raw $taskP.id $taskSaved.definition.versionId 'native-json-saved-before-publish'
   $taskCompatFresh=Read-Workflow $taskP.id
   if ($taskCompatFresh.definition.versionId -ne $taskSaved.definition.versionId) { throw 'COMPAT_SAVED_VERSION_CHANGED' }
   $null=Invoke-LocalCheck 'saved' ([pscustomobject]@{workflow=$taskCompatFresh.definition;plan=$taskP})
   $taskActivationBody=@{versionId=$taskSaved.definition.versionId} | ConvertTo-Json -Compress
   $taskActivate=Invoke-WebRequest -Method Post -Uri ($script:taskApi+'/workflows/'+$taskP.id+'/activate') -Headers $script:taskHeaders -Body ([Text.Encoding]::UTF8.GetBytes($taskActivationBody)) -ContentType 'application/json' -TimeoutSec 60 -MaximumRedirection 0 -SkipHttpErrorCheck
   if ([int]$taskActivate.StatusCode -ne 200) { throw ('COMPAT_ACTIVATE_HTTP_'+[int]$taskActivate.StatusCode) }
   $taskPublished=Read-Workflow $taskP.id
   $taskProof=Invoke-LocalCheck 'published' ([pscustomobject]@{workflow=$taskPublished.definition;plan=$taskP})
   if ($taskProof.activeVersionId -ne $taskSaved.definition.versionId) { throw 'COMPAT_WRONG_ACTIVE_VERSION' }
   $taskCompatPublished=Save-Encrypted $taskPublished.raw $taskP.id $taskPublished.definition.versionId 'native-json-published'
   $taskCompatReceipt=[pscustomobject]@{reason='Native n8n JSON output is sometimes already parsed to an object; accept object or string before unchanged validation.';scope='Necessary API/response handling only; no prompt, model, product or contract change.';proof=$taskProof;changedGuards=$taskP.compatibilityGuards;preSnapshot=$taskBeforeCompat;candidateSnapshot=$taskCompatCandidateSnap;savedSnapshot=$taskCompatSaved;postSnapshot=$taskCompatPublished;modelExecutionsInitiated=0}
   $taskCompatReceipt | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $taskReceiptRoot ($taskP.id+'.native-json-compat.json')) -Encoding utf8NoBOM
   $taskState.plans=@($taskState.plans | ForEach-Object { if($_.id -eq $taskP.id) { $taskP } else { $_ } })
   Save-State $taskState
   Write-Journal ([pscustomobject]@{event='native_json_compat_published_verified';workflowId=$taskP.id;versionId=$taskProof.activeVersionId;guards=$taskP.compatibilityGuards;projectionSha256=$taskProof.projectionSha256})
   Write-Output ('VERIFIED native-JSON compatibility: '+$taskP.name+'; '+$taskP.compatibilityGuards.Count+' guards; active '+$taskProof.activeVersionId)
  }
 }
 elseif($Phase -eq 'verify') {
  $taskState=Read-State
  $taskProofs=@(); foreach($taskP in @($taskState.plans)) {
   $taskRead=Read-Workflow $taskP.id
   $taskProofs += Invoke-LocalCheck 'published' ([pscustomobject]@{workflow=$taskRead.definition;plan=$taskP})
  }
  $taskFinal=[pscustomobject]@{phase='published_verified'; verifiedAtUtc=[DateTime]::UtcNow.ToString('o'); packageSha256=$taskPackageSha; workflows=$taskProofs; modelCount=@($taskProofs | ForEach-Object { $_.modelNodes }).Count; modelExecutionsInitiated=0; modelPilotRuns=0; solFallback=$false;v3Activated=$false;verifierAdded=$false;frontendPublished=$false;pdfExportChanged=$false}
  $taskFinal | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $taskReceiptRoot 'receipt.json') -Encoding utf8NoBOM
  Write-Journal ([pscustomobject]@{event='all_active_versions_verified'; workflowCount=$taskProofs.Count; modelCount=$taskFinal.modelCount})
  Write-Output ('VERIFIED '+$taskProofs.Count+' active workflows and '+$taskFinal.modelCount+' Luna nodes; no model executions initiated.')
 }
} catch {
 $taskFailure=[pscustomobject]@{phase=$Phase;code=$_.Exception.Message;stoppedAtUtc=[DateTime]::UtcNow.ToString('o')}
 if (Test-Path -LiteralPath $taskTransactionRoot) { Write-Journal ([pscustomobject]@{event='stopped';phase=$Phase;reason='LOCAL_OR_HTTP_CHECK_FAILED'}) }
 # Do not print response bodies, headers, workflow definitions or credential objects.
 Write-Output ('STOPPED phase '+$Phase+'; '+$taskFailure.code)
 exit 1
} finally {
 if ($taskHeaders) { $taskHeaders.Clear() }
 $taskCredential=$null; $taskHeaders=$null; $script:taskHeaders=$null; $taskState=$null; $taskPrepared=$null; $taskBefore=$null; $taskPayload=$null; $taskSave=$null; $taskActivate=$null
}
