param([ValidateSet('Create','Activate','Inspect')][string]$Action='Inspect')
$ErrorActionPreference='Stop'
$base='https://drafted.app.n8n.cloud/api/v1'
$headers=@{'X-N8N-API-KEY'=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-n8n.credential.xml").GetNetworkCredential().Password}
$state="$env:LOCALAPPDATA/Drafted/dictation"
New-Item -ItemType Directory -Force $state | Out-Null
function Hash([string]$v){$s=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($s.ComputeHash([Text.Encoding]::UTF8.GetBytes($v)))).Replace('-','').ToLower()}finally{$s.Dispose()}}
function Snapshot([string]$id,[string]$raw,[string]$stage){
 $dir="$env:LOCALAPPDATA/Drafted/dev-system-backups/n8n/$id"
 New-Item -ItemType Directory -Force $dir | Out-Null
 & icacls $dir /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' 'Administrators:(OI)(CI)F' | Out-Null
 if($LASTEXITCODE -ne 0){throw 'Snapshot ACL failed'}
 $file=Join-Path $dir ((Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')+"__${id}__${stage}__pre-DEV-185.clixml")
 $envelope=@{raw=$raw;published='absent';stage=$stage;host=$base}|ConvertTo-Json -Compress
 ConvertTo-SecureString $envelope -AsPlainText -Force | Export-Clixml -LiteralPath $file
 $verified=[PSCredential]::new('snapshot',(Import-Clixml $file)).GetNetworkCredential().Password|ConvertFrom-Json
 if((Hash $verified.raw) -ne (Hash $raw)){throw 'Snapshot verification failed'}
 @{workflowId=$id;stage=$stage;capturedUTC=(Get-Date).ToUniversalTime().ToString('o');sha=(git rev-parse HEAD);rawSHA256=(Hash $raw);encryptedSHA256=(Get-FileHash $file).Hash;path=$file}|ConvertTo-Json|Set-Content ($file+'.manifest.json')
}
try {
 if($Action -eq 'Create'){
  $existing=Invoke-RestMethod "$base/workflows?limit=250" -Headers $headers
  if($existing.data|Where-Object name -eq 'Drafted Dev Dictation — gpt-transcribe'){throw 'Workflow already exists; inspect before mutation'}
  $secretPath="$env:USERPROFILE/.codex/secrets/drafted-dictation.credential.xml"
  if(Test-Path $secretPath){$secret=(Import-Clixml $secretPath).GetNetworkCredential().Password}else{
   $bytes=New-Object byte[] 48;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes);$secret=[Convert]::ToBase64String($bytes)
   [PSCredential]::new('Drafted local dictation',(ConvertTo-SecureString $secret -AsPlainText -Force))|Export-Clixml $secretPath
   & icacls $secretPath /inheritance:r /grant:r "${env:USERNAME}:F" 'SYSTEM:F' 'Administrators:F'|Out-Null
   if($LASTEXITCODE -ne 0){throw 'Secret ACL failed'}
  }
  $payload=(Hash $secret)|node tools/dictation/workflow.cjs
  if($LASTEXITCODE -ne 0){throw 'Definition failed'}
  Snapshot 'dictation-new' $payload 'create-absent'
  $created=Invoke-RestMethod "$base/workflows" -Method Post -Headers $headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
  $saved=Invoke-RestMethod "$base/workflows/$($created.id)" -Headers $headers
  if($saved.active -or $saved.nodes.Count -ne 5 -or $saved.settings.saveDataSuccessExecution -ne 'none' -or $saved.settings.saveDataErrorExecution -ne 'none'){throw 'Definition verification failed'}
  @{id=$saved.id;versionId=$saved.versionId;active=$saved.active;createdUTC=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json|Set-Content "$state/workflow.json"
  if(!(Test-Path "$state/budget.json")){'{"enabled":true,"used":0,"recent":[],"leases":{}}'|Set-Content "$state/budget.json" -Encoding ascii}
  Write-Output "Created inactive workflow $($saved.id), retention disabled."
 }else{
  $receipt=Get-Content "$state/workflow.json"|ConvertFrom-Json
  $raw=(Invoke-WebRequest "$base/workflows/$($receipt.id)" -Headers $headers -UseBasicParsing).Content
  $saved=$raw|ConvertFrom-Json
  if($Action -eq 'Activate'){
   if($saved.active -or $saved.versionId -ne $receipt.versionId){throw 'Concurrent change or already active'}
   Snapshot $saved.id $raw 'activate-inactive'
   $again=Invoke-RestMethod "$base/workflows/$($saved.id)" -Headers $headers
   if($again.versionId -ne $saved.versionId -or $again.active){throw 'Concurrent change'}
   $null=Invoke-RestMethod "$base/workflows/$($saved.id)/activate" -Headers $headers -Method Post -ContentType 'application/json' -Body '{}'
   $saved=Invoke-RestMethod "$base/workflows/$($saved.id)" -Headers $headers
   if(!$saved.active){throw 'Activation not confirmed'}
  }
  Write-Output (@{id=$saved.id;active=$saved.active;versionId=$saved.versionId;activeVersionId=$saved.activeVersionId;settings=$saved.settings}|ConvertTo-Json -Depth 4)
 }
}catch{Write-Output ('Operation stopped: '+$_.Exception.Message.Split([Environment]::NewLine)[0]);exit 1}
