param([switch]$ApplyApprovedOrigin)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskWorkflow='6Bvk0NYcElT9OirH'
$taskUri="https://drafted.app.n8n.cloud/api/v1/workflows/$taskWorkflow"
$taskHelper=Join-Path $taskRoot 'backend/n8n-local-origin-release.cjs'
$taskBackupRoot="C:/Users/wallg/AppData/Local/Drafted/dev-system-backups/n8n/$taskWorkflow"
$taskFolder=Join-Path $taskBackupRoot (([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))+'__local-origin-DEV-163')
function Digest([string]$value){[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($value))).ToLowerInvariant()}
function Snapshot([string]$raw,[string]$label){
 $definition=$raw|ConvertFrom-Json -Depth 100
 if($definition.id -ne $taskWorkflow -or !$definition.activeVersion){throw 'Missing complete active definition'}
 $active=$definition.activeVersion|ConvertTo-Json -Depth 100 -Compress
 $envelope=@{savedRaw=$raw;activeRaw=$active;instance='https://drafted.app.n8n.cloud';workflowId=$taskWorkflow;capturedUtc=[DateTime]::UtcNow.ToString('o');sourceGit=(git -C $taskRoot rev-parse HEAD)}|ConvertTo-Json -Depth 100 -Compress
 $file=Join-Path $taskFolder ($label+'.clixml');if(Test-Path -LiteralPath $file){throw 'Snapshot already exists'}
 # SecureString has a length limit; encrypt ordered bounded chunks losslessly.
 $chunks=@(for($offset=0;$offset -lt $envelope.Length;$offset+=16000){ConvertTo-SecureString -String $envelope.Substring($offset,[Math]::Min(16000,$envelope.Length-$offset)) -AsPlainText -Force})
 $chunks|Export-Clixml -LiteralPath $file
 $restoredText=(@(Import-Clixml -LiteralPath $file)|ForEach-Object{([pscredential]::new('snapshot',$_)).GetNetworkCredential().Password}) -join ''
 $restored=$restoredText|ConvertFrom-Json -Depth 100
 if((Digest $raw) -ne (Digest $restored.savedRaw) -or (Digest $active) -ne (Digest $restored.activeRaw)){throw 'Snapshot verification failed'}
 $safe=@{file=$file;workflowId=$taskWorkflow;version=$definition.versionId;activeVersion=$definition.activeVersionId;active=$definition.active;savedSha256=(Digest $raw);activeSha256=(Digest $active);encryptedSha256=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash}
 $safe|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $taskFolder ($label+'.manifest.json')) -Encoding utf8
 return $safe
}
$taskWriteAttempted=$false
$taskStage='read'
try {
 $taskCredential=Import-Clixml -LiteralPath 'C:/Users/wallg/.codex/secrets/drafted-n8n.credential.xml'
 $taskHeaders=@{'X-N8N-API-KEY'=$taskCredential.GetNetworkCredential().Password}
 $taskBefore=(Invoke-WebRequest -Uri $taskUri -Headers $taskHeaders -Method Get).Content
 $taskStage='prepare'
 $taskPayload=$taskBefore|node $taskHelper payload
 if($LASTEXITCODE -ne 0){throw 'Candidate rejected'}
 $taskStage='backup-acl'
 New-Item -ItemType Directory -Path $taskFolder | Out-Null
 $taskAcl=[Security.AccessControl.DirectorySecurity]::new();$taskAcl.SetAccessRuleProtection($true,$false)
 $taskSids=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18','S-1-5-32-544')
 foreach($sid in $taskSids){$rule=[Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow');$taskAcl.AddAccessRule($rule)}
 Set-Acl -LiteralPath $taskFolder -AclObject $taskAcl
 $taskActualAcl=Get-Acl -LiteralPath $taskFolder
 if(!$taskActualAcl.AreAccessRulesProtected){throw 'Backup ACL inheritance not disabled'}
 foreach($rule in $taskActualAcl.Access){if($rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -notin $taskSids){throw 'Unexpected backup access rule'}}
 $taskStage='snapshot';$taskSnapshot=Snapshot $taskBefore 'pre'
 if(!$ApplyApprovedOrigin){@{prepared=$true;writes=0;snapshot=$taskSnapshot}|ConvertTo-Json -Depth 5;exit 0}
 $taskFresh=(Invoke-WebRequest -Uri $taskUri -Headers $taskHeaders -Method Get).Content
 # Compare the entire response immediately before mutation, not only its version ID.
 if((Digest $taskFresh) -ne (Digest $taskBefore)){throw 'Concurrent workflow change; no write made'}
 $taskStage='update';$taskWriteAttempted=$true
 $null=Invoke-WebRequest -Uri ($taskUri+'?publishIfActive=true') -Headers $taskHeaders -Method Put -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($taskPayload))
 $taskStage='verify';$taskAfter=(Invoke-WebRequest -Uri $taskUri -Headers $taskHeaders -Method Get).Content
 $taskPost=Snapshot $taskAfter 'post'
 $taskVerification=(@{before=($taskBefore|ConvertFrom-Json -Depth 100);after=($taskAfter|ConvertFrom-Json -Depth 100)}|ConvertTo-Json -Depth 100 -Compress)|node $taskHelper verify
 if($LASTEXITCODE -ne 0){throw 'Read-back mismatch; stop, do not run tests'}
 $taskReceipt=@{result=($taskVerification|ConvertFrom-Json);snapshots=@($taskSnapshot,$taskPost);writes=1;workflowExecutions=0;verifiedUtc=[DateTime]::UtcNow.ToString('o')}
 $taskReceipt|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $taskRoot 'site/integration/deployment-receipt.json') -Encoding utf8
 $taskReceipt|ConvertTo-Json -Depth 8
} catch {
 # Never print raw errors/HTTP bodies: definitions may contain pinned personal data.
 if($taskWriteAttempted){try{$taskFailureAfter=(Invoke-WebRequest -Uri $taskUri -Headers $taskHeaders -Method Get).Content;$null=Snapshot $taskFailureAfter 'after-failure'}catch{}}
 Write-Output (@{status='stopped';stage=$taskStage;errorType=$_.Exception.GetType().Name;errorLine=$_.InvocationInfo.ScriptLineNumber;writeAttempted=$taskWriteAttempted;backupFolder=$taskFolder;reason='Snapshot, concurrency, HTTP or read-back validation failed. Inspect encrypted state; do not retry automatically.'}|ConvertTo-Json)
 exit 1
} finally {$taskHeaders=$null;$taskCredential=$null;$taskBefore=$null;$taskFresh=$null;$taskAfter=$null;$taskPayload=$null;$taskFailureAfter=$null}
