param([ValidateSet('Capture','Origins','Secrets')][string]$Action='Capture')
$ErrorActionPreference='Stop'
$base='https://drafted.app.n8n.cloud/api/v1'
$state=Join-Path $env:LOCALAPPDATA 'Drafted/public-release-20261102'
$cli='site/hosting-work/node_modules/wrangler/bin/wrangler.js'
$stage='startup'
function Hash([string]$v){$sha=[Security.Cryptography.SHA256]::Create();try{return ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($v)))).Replace('-','').ToLower()}finally{$sha.Dispose()}}
function PrivateDirectory([string]$dir){New-Item -ItemType Directory -Force $dir|Out-Null;& icacls $dir /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'|Out-Null;if($LASTEXITCODE -ne 0){throw 'Private ACL failed'}}
function Snapshot([string]$id,[string]$raw,[string]$label,[string]$preState){
 $snapshotSource=if($id.StartsWith('cloudflare-')){'https://api.cloudflare.com/client/v4/accounts/6eb5ff1b6c3fd0cb1f779b4e04a97bc0/workers/scripts/drafted-invited-test'}else{$base}
 $object=$raw|ConvertFrom-Json
 $dir=Join-Path $env:LOCALAPPDATA "Drafted/dev-system-backups/n8n/$id"
 PrivateDirectory $dir
 $stamp=(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')
 $version=if($object.versionId){[string]$object.versionId}else{'absent'}
 $file=Join-Path $dir "${stamp}__${id}__${version}__${label}__pre-DEV-196.clixml"
 $published=if($object.activeVersion){$object.activeVersion|ConvertTo-Json -Depth 100 -Compress}else{'absent'}
 if($object.active -and !$object.activeVersion){if($object.activeVersionId -ne $object.versionId){throw 'Published body unavailable for a different active version'};$published=$raw}
 $envelope=@{rawSaved=$raw;rawPublished=$published;source=$snapshotSource;workflowId=$id;preState=$preState;label=$label;utc=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json -Depth 10 -Compress
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
 @{workflowId=$id;name=$object.name;instance=$snapshotSource;utc=(Get-Date).ToUniversalTime().ToString('o');updatedAt=$object.updatedAt;versionId=$object.versionId;activeVersionId=$object.activeVersionId;active=$object.active;preState=$preState;sourceGitSHA=(git rev-parse HEAD);dev='DEV-196';envelopeEncoding='gzip-base64-v1';rawSavedSHA256=(Hash $raw);rawPublishedSHA256=(Hash $published);encryptedSHA256=(Get-FileHash $file).Hash.ToLower();path=$file}|ConvertTo-Json|Set-Content ($file+'.manifest.json') -Encoding utf8
 return $file
}
function CheckProjection($expected,$actual){@{expected=$expected;actual=$actual}|ConvertTo-Json -Depth 100 -Compress|node tools/coverage/check-projection.cjs;if($LASTEXITCODE -ne 0){throw 'Projection verification failed'}}
function CloudHeaders(){
 $output=& node $cli auth token --json
 if($LASTEXITCODE -ne 0){throw 'Cloud auth unavailable'}
 $auth=$output|ConvertFrom-Json
 if(!$auth.token){throw 'Cloud token format changed'}
 return @{Authorization=('Bearer '+$auth.token)}
}
function CloudSnapshot(){
 $cloud=CloudHeaders
 $url='https://api.cloudflare.com/client/v4/accounts/6eb5ff1b6c3fd0cb1f779b4e04a97bc0/workers/scripts/drafted-invited-test'
 $script:stage='read Cloudflare settings'
 $settings=Invoke-RestMethod ($url+'/settings') -Headers $cloud
 $script:stage='read Cloudflare deployments'
 $deployments=Invoke-RestMethod ($url+'/deployments') -Headers $cloud
 if(!$settings.success -or !$deployments.success){throw 'Cloud read failed'}
 $current=$deployments.result.deployments[0]
 if($current.versions.Count -ne 1 -or $current.versions[0].percentage -ne 100){throw 'Unexpected split deployment'}
 $version=$current.versions[0].version_id
 $script:stage='read Cloudflare module content'
 $content=Invoke-WebRequest ($url+'/content/v2') -Headers $cloud -UseBasicParsing
 $bytes=$content.RawContentStream.ToArray()
 if(!$bytes.Length){throw 'Cloud source unavailable'}
 $published=@{contentType=$content.Headers['Content-Type'];moduleBase64=[Convert]::ToBase64String($bytes);settings=$settings.result;deployments=$deployments.result}
 $raw=@{name='drafted-invited-test';versionId=$version;activeVersionId=$version;active=$true;updatedAt=$current.created_on;activeVersion=$published}|ConvertTo-Json -Depth 100 -Compress
 $snapshot=Snapshot 'cloudflare-drafted-invited-test' $raw ('public-'+$Action.ToLower()) 'active'
 return @{version=$version;snapshot=$snapshot;deployment=$current.id}
}
try{
 PrivateDirectory $state
 $headers=@{'X-N8N-API-KEY'=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-n8n.credential.xml").GetNetworkCredential().Password}
 $ids=@('SYolQaSRsqkf5BDT','JaUV7PezrztJGpr7')
 if($Action -eq 'Capture'){
  $stage='capture current public Worker';$cf=CloudSnapshot
  $records=@()
  foreach($id in $ids){$stage='capture n8n '+$id;$raw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content;$saved=$raw|ConvertFrom-Json;if(!$saved.active -or $saved.activeVersionId -ne $saved.versionId){throw 'Different saved and active state'};$snapshot=Snapshot $id $raw 'public-origin-before' 'active';$records+=@{id=$id;versionId=$saved.versionId;updatedAt=$saved.updatedAt;snapshot=$snapshot}}
  @{capturedUTC=(Get-Date).ToUniversalTime().ToString('o');cloudflare=$cf;workflows=$records}|ConvertTo-Json -Depth 8|Set-Content "$state/baseline.json" -Encoding utf8
  Write-Output ('Verified encrypted baseline captured. Worker '+$cf.version+'; two n8n definitions.');exit 0
 }
 $baseline=Get-Content "$state/baseline.json" -Raw -Encoding UTF8|ConvertFrom-Json
 if($Action -eq 'Origins'){
  $results=@()
  foreach($record in $baseline.workflows){
   $id=$record.id;$stage='read before origin update '+$id;$raw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content;$saved=$raw|ConvertFrom-Json
   if($saved.versionId -ne $record.versionId -or $saved.updatedAt -ne $record.updatedAt -or $saved.activeVersionId -ne $saved.versionId){throw 'Concurrent workflow change'}
   $null=Snapshot $id $raw 'public-origin-update' 'active'
   if($id -eq 'SYolQaSRsqkf5BDT'){$node=$saved.nodes|Where-Object name -eq 'Validate private WAV';$old="h.origin!=='http://127.0.0.1:8826'";$new="!['http://127.0.0.1:8826','https://getmedrafted.com'].includes(h.origin)"}else{$node=$saved.nodes|Where-Object name -eq 'Validate coverage input';$old='entry.headers?.origin!=="http://127.0.0.1:8826"';$new='!["http://127.0.0.1:8826","https://getmedrafted.com"].includes(entry.headers?.origin)'}
   if($node.parameters.jsCode.Split(@($old),[StringSplitOptions]::None).Length -ne 2){throw 'Unexpected origin guard'}
   $node.parameters.jsCode=$node.parameters.jsCode.Replace($old,$new)
   $webhook=$saved.nodes|Where-Object type -eq 'n8n-nodes-base.webhook'
   if($webhook.parameters.options.allowedOrigins -ne 'http://127.0.0.1:8826'){throw 'Unexpected CORS origin'}
   $webhook.parameters.options.allowedOrigins='http://127.0.0.1:8826,https://getmedrafted.com'
   $payload=@{name=$saved.name;nodes=$saved.nodes;connections=$saved.connections;settings=$saved.settings}
   $again=Invoke-RestMethod "$base/workflows/$id" -Headers $headers
   if($again.versionId -ne $record.versionId -or $again.updatedAt -ne $record.updatedAt -or $again.activeVersionId -ne $record.versionId){throw 'Concurrent workflow change'}
   $stage='save approved public origin '+$id
   $null=Invoke-RestMethod "$base/workflows/$id" -Method Put -Headers $headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes(($payload|ConvertTo-Json -Depth 100 -Compress)))
   $fixedRaw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content;$fixed=$fixedRaw|ConvertFrom-Json;CheckProjection $payload $fixed;$null=Snapshot $id $fixedRaw 'public-origin-saved' 'active'
   if($fixed.activeVersionId -ne $fixed.versionId){$stage='publish approved public origin '+$id;$null=Invoke-RestMethod "$base/workflows/$id/activate" -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'}
   $afterRaw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content;$after=$afterRaw|ConvertFrom-Json
   if(!$after.active -or $after.activeVersionId -ne $after.versionId -or $after.versionId -ne $fixed.versionId){throw 'Origin activation failed'}
   CheckProjection $payload $after;$null=Snapshot $id $afterRaw 'public-origin-active' 'active'
   $results+=@{id=$id;before=$record.versionId;versionId=$after.versionId;activeVersionId=$after.activeVersionId;change='Public origin added; local origin, token hash, model, retention and routing preserved'}
  }
  $results|ConvertTo-Json -Depth 5|Set-Content "$state/origins.json" -Encoding utf8
  $results|ConvertTo-Json -Depth 5;exit 0
 }
 if($Action -eq 'Secrets'){
  $stage='snapshot Worker before secret bindings';$cf=CloudSnapshot
  if($cf.version -ne $baseline.cloudflare.version){throw 'Worker changed before secret provisioning'}
  $secrets=@{COVERAGE_GATEWAY_KEY=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-coverage.credential.xml").GetNetworkCredential().Password;DICTATION_GATEWAY_KEY=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-dictation.credential.xml").GetNetworkCredential().Password}
  foreach($value in $secrets.Values){if($value.Length -lt 32){throw 'Invalid private secret'}}
  $stage='add only server-side feature secrets'
  $secrets|ConvertTo-Json -Compress|& node $cli secret bulk --config site/hosting/wrangler.jsonc
  if($LASTEXITCODE -ne 0){throw 'Secret provisioning failed'}
  $after=CloudSnapshot
  @{before=$cf.version;after=$after.version;keys=@('COVERAGE_GATEWAY_KEY','DICTATION_GATEWAY_KEY');existingSecretPreserved='TEST_PASSWORD retained unused';snapshot=$after.snapshot}|ConvertTo-Json|Set-Content "$state/cloud-secrets.json" -Encoding utf8
  Write-Output ('Server-only keys configured; current Worker version '+$after.version)
 }
}catch{Write-Output "Release stopped at $stage. $($_.Exception.GetType().Name) HTTP $([int]$_.Exception.Response.StatusCode). No raw responses or credentials printed.";exit 1}
