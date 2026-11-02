param([ValidateSet('Create','Activate','Inspect','RepairOutput')][string]$Action='Inspect')
$ErrorActionPreference='Stop'
$base='https://drafted.app.n8n.cloud/api/v1'
$state=Join-Path $env:LOCALAPPDATA 'Drafted/coverage'
$secretPath=Join-Path $env:USERPROFILE '.codex/secrets/drafted-coverage.credential.xml'
$receipt=Get-Content 'dev-system/prepared/cv-coverage/receipt.json' -Raw -Encoding UTF8|ConvertFrom-Json
$stage='initial checks'
function Hash([string]$v){$sha=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($v)))).Replace('-','').ToLower()}finally{$sha.Dispose()}}
function PrivateDirectory([string]$dir){New-Item -ItemType Directory -Force $dir|Out-Null;& icacls $dir /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'|Out-Null;if($LASTEXITCODE -ne 0){throw 'Private ACL failed'}}
function Snapshot([string]$id,[string]$raw,[string]$label,[string]$preState){
 $object=$raw|ConvertFrom-Json
 $dir=Join-Path $env:LOCALAPPDATA "Drafted/dev-system-backups/n8n/$id"
 PrivateDirectory $dir
 $stamp=(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')
 $version=if($object.versionId){[string]$object.versionId}else{'absent'}
 $file=Join-Path $dir "${stamp}__${id}__${version}__${label}__pre-DEV-189.clixml"
 $published=if($object.activeVersion){$object.activeVersion|ConvertTo-Json -Depth 100 -Compress}else{'absent'}
 if($object.active -and !$object.activeVersion){if($object.activeVersionId -ne $object.versionId){throw 'Published body unavailable for a different active version'};$published=$raw}
 $envelope=@{rawSaved=$raw;rawPublished=$published;source=$base;workflowId=$id;preState=$preState;label=$label;utc=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json -Depth 10 -Compress
 # Compress the lossless envelope before DPAPI to stay below SecureString's 65536-character bound.
 $memory=[IO.MemoryStream]::new();$gzip=[IO.Compression.GZipStream]::new($memory,[IO.Compression.CompressionLevel]::Optimal,$true)
 try{$bytes=[Text.Encoding]::UTF8.GetBytes($envelope);$gzip.Write($bytes,0,$bytes.Length)}finally{$gzip.Dispose()}
 $encoded='gzip-base64-v1:'+ [Convert]::ToBase64String($memory.ToArray());$memory.Dispose()
 ConvertTo-SecureString $encoded -AsPlainText -Force|Export-Clixml -LiteralPath $file
 $encryptedBack=[PSCredential]::new('snapshot',(Import-Clixml -LiteralPath $file)).GetNetworkCredential().Password
 if(!$encryptedBack.StartsWith('gzip-base64-v1:')){throw 'Snapshot encoding failed'}
 $compressed=[Convert]::FromBase64String($encryptedBack.Substring(15));$source=[IO.MemoryStream]::new($compressed);$decoded=[IO.MemoryStream]::new();$unzip=[IO.Compression.GZipStream]::new($source,[IO.Compression.CompressionMode]::Decompress)
 try{$unzip.CopyTo($decoded);$back=[Text.Encoding]::UTF8.GetString($decoded.ToArray())|ConvertFrom-Json}finally{$unzip.Dispose();$source.Dispose();$decoded.Dispose()}
 if((Hash $back.rawSaved) -ne (Hash $raw) -or (Hash $back.rawPublished) -ne (Hash $published)){throw 'Snapshot integrity check failed'}
 if(($back.rawSaved|ConvertFrom-Json).name -ne $object.name){throw 'Snapshot identity check failed'}
 @{workflowId=$id;name=$object.name;instance=$base;utc=(Get-Date).ToUniversalTime().ToString('o');updatedAt=$object.updatedAt;versionId=$object.versionId;activeVersionId=$object.activeVersionId;active=$object.active;preState=$preState;sourceGitSHA=(git rev-parse HEAD);dev='DEV-189';envelopeEncoding='gzip-base64-v1';rawSavedSHA256=(Hash $raw);rawPublishedSHA256=(Hash $published);encryptedSHA256=(Get-FileHash $file).Hash.ToLower();path=$file}|ConvertTo-Json|Set-Content ($file+'.manifest.json') -Encoding utf8
 return $file
}
function CheckProjection($expected,$actual){@{expected=$expected;actual=$actual}|ConvertTo-Json -Depth 100 -Compress|node tools/coverage/check-projection.cjs;if($LASTEXITCODE -ne 0){throw 'Projection verification failed'}}
try{
 $headers=@{'X-N8N-API-KEY'=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-n8n.credential.xml").GetNetworkCredential().Password}
 PrivateDirectory $state
 if($Action -eq 'Create'){
  $template=Get-Content $receipt.candidateFile -Raw -Encoding UTF8
  if((Hash $template) -ne $receipt.candidateSHA256){throw 'Approved candidate file changed'}
  $source=Invoke-RestMethod "$base/workflows/$($receipt.sourceWorkflowId)" -Headers $headers
  if($source.versionId -ne $receipt.sourceSavedVersion -or $source.activeVersionId -ne $receipt.sourceActiveVersion -or !$source.active){throw 'Source workflow changed'}
  $workflows=Invoke-RestMethod "$base/workflows?limit=250" -Headers $headers
  $candidate=$template|ConvertFrom-Json
  if($workflows.nextCursor){throw 'Workflow inventory incomplete; review before create'}
  if($workflows.data|Where-Object name -eq $candidate.name){throw 'Coverage workflow already exists; inspect without another creation'}
  if(Test-Path $secretPath){$secret=(Import-Clixml $secretPath).GetNetworkCredential().Password}else{
   $bytes=New-Object byte[] 48;$rng=[Security.Cryptography.RandomNumberGenerator]::Create();try{$rng.GetBytes($bytes)}finally{$rng.Dispose()};$secret=[Convert]::ToBase64String($bytes)
   [PSCredential]::new('Drafted coverage gateway',(ConvertTo-SecureString $secret -AsPlainText -Force))|Export-Clixml -LiteralPath $secretPath
   & icacls $secretPath /inheritance:r /grant:r "${env:USERNAME}:F" '*S-1-5-18:F' '*S-1-5-32-544:F'|Out-Null
   if($LASTEXITCODE -ne 0){throw 'Secret ACL failed'}
  }
  $node=$candidate.nodes|Where-Object name -eq 'Validate coverage input'
  $needle='const expected="UNCONFIGURED"'
  if($node.parameters.jsCode.Split(@($needle),[StringSplitOptions]::None).Length -ne 2){throw 'Unexpected gateway placeholder'}
  $node.parameters.jsCode=$node.parameters.jsCode.Replace($needle,('const expected="'+(Hash $secret)+'"'))
  $payload=$candidate|ConvertTo-Json -Depth 100 -Compress
  $stage='verified absent-prestate snapshot'
  $snapshot=Snapshot 'coverage-new' $payload 'create' 'absent'
  $sourceAgain=Invoke-RestMethod "$base/workflows/$($receipt.sourceWorkflowId)" -Headers $headers
  if($sourceAgain.versionId -ne $source.versionId -or $sourceAgain.activeVersionId -ne $source.activeVersionId){throw 'Concurrent source change'}
  $stage='create inactive coverage workflow'
  $created=Invoke-RestMethod "$base/workflows" -Method Post -Headers $headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
  $raw=(Invoke-WebRequest "$base/workflows/$($created.id)" -Headers $headers -UseBasicParsing).Content;$saved=$raw|ConvertFrom-Json
  if($saved.active){throw 'Unexpected automatic activation'}
  CheckProjection $candidate $saved
  @{id=$saved.id;versionId=$saved.versionId;updatedAt=$saved.updatedAt;active=$saved.active;createSnapshot=$snapshot;createdUTC=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json|Set-Content "$state/workflow.json" -Encoding utf8
  $null=Snapshot $saved.id $raw 'created' 'inactive'
  if(!(Test-Path "$state/budget.json")){'{"enabled":true,"used":0,"recent":[],"leases":{}}'|Set-Content "$state/budget.json" -Encoding ascii}
  Write-Output "Created inactive coverage workflow $($saved.id); complete projection and encrypted snapshots verified."
 }else{
  $local=Get-Content "$state/workflow.json" -Raw|ConvertFrom-Json
  $raw=(Invoke-WebRequest "$base/workflows/$($local.id)" -Headers $headers -UseBasicParsing).Content;$saved=$raw|ConvertFrom-Json
  if($Action -eq 'RepairOutput'){
   if($saved.id -ne 'JaUV7PezrztJGpr7' -or $saved.versionId -ne 'cc588a70-a1b7-442e-a8ac-a52d3f59c4e7' -or !$saved.active -or $saved.activeVersionId -ne $saved.versionId){throw 'Coverage version changed before bounded repair'}
   $stage='verified snapshot before output-decoding repair';$null=Snapshot $saved.id $raw 'repair-output' 'active'
   $node=$saved.nodes|Where-Object name -eq 'Validate coverage result'
   $old=".map(x=>x.text).join('');"
   $new=".map(x=>typeof x.text==='string'?x.text:x.text&&typeof x.text==='object'&&!Array.isArray(x.text)?JSON.stringify(x.text):'').join('');"
   if($node.parameters.jsCode.Split(@($old),[StringSplitOptions]::None).Length -ne 2){throw 'Unexpected result decoder'}
   $node.parameters.jsCode=$node.parameters.jsCode.Replace($old,$new)
   $payload=@{name=$saved.name;nodes=$saved.nodes;connections=$saved.connections;settings=$saved.settings}
   $again=Invoke-RestMethod "$base/workflows/$($saved.id)" -Headers $headers
   if($again.versionId -ne $saved.versionId -or $again.updatedAt -ne $saved.updatedAt -or $again.activeVersionId -ne $saved.activeVersionId){throw 'Concurrent coverage change'}
   $stage='repair only JSON object output decoder'
   $null=Invoke-RestMethod "$base/workflows/$($saved.id)" -Method Put -Headers $headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes(($payload|ConvertTo-Json -Depth 100 -Compress)))
   $fixedRaw=(Invoke-WebRequest "$base/workflows/$($saved.id)" -Headers $headers -UseBasicParsing).Content;$fixed=$fixedRaw|ConvertFrom-Json
   CheckProjection $payload $fixed
   $null=Snapshot $fixed.id $fixedRaw 'repaired-saved' 'active'
   if($fixed.activeVersionId -ne $fixed.versionId){
    $stage='publish bounded repaired version'
    $null=Invoke-RestMethod "$base/workflows/$($fixed.id)/activate" -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'
   }
   $afterRaw=(Invoke-WebRequest "$base/workflows/$($saved.id)" -Headers $headers -UseBasicParsing).Content;$after=$afterRaw|ConvertFrom-Json
   if(!$after.active -or $after.activeVersionId -ne $after.versionId -or $after.versionId -ne $fixed.versionId){throw 'Repair active identity verification failed'}
   CheckProjection $payload $after
   $null=Snapshot $after.id $afterRaw 'repaired-active' 'active'
   @{id=$after.id;versionId=$after.versionId;activeVersionId=$after.activeVersionId;active=$after.active;repairedUTC=(Get-Date).ToUniversalTime().ToString('o');change='JSON output object normalization only'}|ConvertTo-Json|Set-Content "$state/repair.json" -Encoding utf8
   $saved=$after
  }
  if($Action -eq 'Activate'){
   if($saved.active -or $saved.versionId -ne $local.versionId -or $saved.updatedAt -ne $local.updatedAt){throw 'Saved coverage state changed before activation'}
   $stage='verified inactive snapshot before activation';$null=Snapshot $saved.id $raw 'activate' 'inactive'
   $again=Invoke-RestMethod "$base/workflows/$($saved.id)" -Headers $headers
   if($again.versionId -ne $saved.versionId -or $again.updatedAt -ne $saved.updatedAt -or $again.active){throw 'Concurrent change before activation'}
   $stage='activate only approved coverage workflow'
   $null=Invoke-RestMethod "$base/workflows/$($saved.id)/activate" -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'
   $afterRaw=(Invoke-WebRequest "$base/workflows/$($saved.id)" -Headers $headers -UseBasicParsing).Content;$after=$afterRaw|ConvertFrom-Json
   if(!$after.active -or $after.activeVersionId -ne $after.versionId -or $after.versionId -ne $saved.versionId){throw 'Activation identity verification failed'}
   CheckProjection $saved $after
   $null=Snapshot $after.id $afterRaw 'activated' 'active'
   @{id=$after.id;versionId=$after.versionId;activeVersionId=$after.activeVersionId;active=$after.active;activatedUTC=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json|Set-Content "$state/activation.json" -Encoding utf8
   $saved=$after
  }
  @{id=$saved.id;name=$saved.name;active=$saved.active;versionId=$saved.versionId;activeVersionId=$saved.activeVersionId;model=($saved.nodes|Where-Object name -eq 'Coverage model').parameters.modelId.value;settings=$saved.settings}|ConvertTo-Json -Depth 5
 }
}catch{if($_.Exception.Message -match '^(Approved candidate file changed|Source workflow changed|Workflow inventory incomplete|Coverage workflow already exists|Unexpected gateway placeholder|Concurrent source change|Private ACL failed|Secret ACL failed)'){Write-Output $_.Exception.Message};Write-Output "Operation stopped at stage: $stage. No raw response/credentials printed. $($_.Exception.GetType().Name)";exit 1}
