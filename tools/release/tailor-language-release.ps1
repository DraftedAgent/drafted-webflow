param([ValidateSet('Capture','Activate','Verify')][string]$Action='Capture')
$ErrorActionPreference='Stop'
$OutputEncoding=[Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding=$OutputEncoding
$base='https://drafted.app.n8n.cloud/api/v1'
$state=Join-Path $env:LOCALAPPDATA 'Drafted/tailor-language-release-20261104'
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
 $file=Join-Path $dir "${stamp}__${id}__${version}__${label}__pre-DEV-251.clixml"
 $published=if($object.activeVersion){$object.activeVersion|ConvertTo-Json -Depth 100 -Compress}else{'absent'}
 if($object.active -and !$object.activeVersion){if($object.activeVersionId -ne $object.versionId){throw 'Published body unavailable for a different active version'};$published=$raw}
 $envelope=@{rawSaved=$raw;rawPublished=$published;source=$snapshotSource;workflowId=$id;preState=$preState;label=$label;utc=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json -Depth 10 -Compress
  # Lossless gzip/base64 is split into DPAPI SecureStrings: definitions can exceed 65536 chars.
 $memory=[IO.MemoryStream]::new();$gzip=[IO.Compression.GZipStream]::new($memory,[IO.Compression.CompressionLevel]::Optimal,$true)
 try{$bytes=[Text.Encoding]::UTF8.GetBytes($envelope);$gzip.Write($bytes,0,$bytes.Length)}finally{$gzip.Dispose()}
 $encoded='gzip-base64-v1:'+ [Convert]::ToBase64String($memory.ToArray());$memory.Dispose()
  $chunks=@();for($offset=0;$offset -lt $encoded.Length;$offset+=30000){$chunks+=ConvertTo-SecureString $encoded.Substring($offset,[Math]::Min(30000,$encoded.Length-$offset)) -AsPlainText -Force}
  @{encoding='dpapi-chunked-gzip-base64-v1';chunks=$chunks}|Export-Clixml -LiteralPath $file
  $stored=Import-Clixml -LiteralPath $file
  if($stored.encoding -ne 'dpapi-chunked-gzip-base64-v1'){throw 'Snapshot container failed'}
  $encryptedBack=(@($stored.chunks)|ForEach-Object {[PSCredential]::new('snapshot',$_).GetNetworkCredential().Password}) -join ''
 if(!$encryptedBack.StartsWith('gzip-base64-v1:')){throw 'Snapshot encoding failed'}
 $compressed=[Convert]::FromBase64String($encryptedBack.Substring(15));$source=[IO.MemoryStream]::new($compressed);$decoded=[IO.MemoryStream]::new();$unzip=[IO.Compression.GZipStream]::new($source,[IO.Compression.CompressionMode]::Decompress)
 try{$unzip.CopyTo($decoded);$back=[Text.Encoding]::UTF8.GetString($decoded.ToArray())|ConvertFrom-Json}finally{$unzip.Dispose();$source.Dispose();$decoded.Dispose()}
 if((Hash $back.rawSaved) -ne (Hash $raw) -or (Hash $back.rawPublished) -ne (Hash $published)){throw 'Snapshot integrity check failed'}
 if(($back.rawSaved|ConvertFrom-Json).name -ne $object.name){throw 'Snapshot identity check failed'}
  @{workflowId=$id;name=$object.name;instance=$snapshotSource;utc=(Get-Date).ToUniversalTime().ToString('o');updatedAt=$object.updatedAt;versionId=$object.versionId;activeVersionId=$object.activeVersionId;active=$object.active;preState=$preState;sourceGitSHA=(git rev-parse HEAD);dev='DEV-251';envelopeEncoding='dpapi-chunked-gzip-base64-v1';rawSavedSHA256=(Hash $raw);rawPublishedSHA256=(Hash $published);encryptedSHA256=(Get-FileHash $file).Hash.ToLower();path=$file}|ConvertTo-Json|Set-Content ($file+'.manifest.json') -Encoding utf8
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
try {
 PrivateDirectory $state
 $headers=@{'X-N8N-API-KEY'=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-n8n.credential.xml").GetNetworkCredential().Password}
 $manifest=Get-Content 'dev-system/prepared/tailor-quality/language-v14/manifest.json' -Raw -Encoding UTF8|ConvertFrom-Json
 $id=$manifest.workflowId
 if($id -ne 'H8oAioy58R1v3PvRe3YUa'){throw 'Unexpected workflow'}
 $stage='read and encrypt fresh Tailor baseline'
 $raw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content
 $before=$raw|ConvertFrom-Json
 if($Action -eq 'Verify'){
  $snapshot=Snapshot $id $raw 'language-final-readback' 'active'
  $baseline=Get-Content "$state/baseline.json" -Raw -Encoding UTF8|ConvertFrom-Json
  $stored=Import-Clixml $baseline.snapshot
  if($stored.encoding -ne 'dpapi-chunked-gzip-base64-v1'){throw 'Snapshot encoding changed'}
  $encoded=(@($stored.chunks)|ForEach-Object {[PSCredential]::new('snapshot',$_).GetNetworkCredential().Password}) -join ''
  $source=[IO.MemoryStream]::new([Convert]::FromBase64String($encoded.Substring(15)));$decoded=[IO.MemoryStream]::new();$unzip=[IO.Compression.GZipStream]::new($source,[IO.Compression.CompressionMode]::Decompress)
  try{$unzip.CopyTo($decoded);$back=[Text.Encoding]::UTF8.GetString($decoded.ToArray())|ConvertFrom-Json}finally{$unzip.Dispose();$source.Dispose();$decoded.Dispose()}
  $savedManifest=Get-Content ($baseline.snapshot+'.manifest.json') -Raw -Encoding UTF8|ConvertFrom-Json
  if((Hash $back.rawSaved) -ne $savedManifest.rawSavedSHA256 -or (Get-FileHash $baseline.snapshot).Hash.ToLower() -ne $savedManifest.encryptedSHA256){throw 'Baseline snapshot integrity failed'}
  @{before=($back.rawSaved|ConvertFrom-Json);after=$before}|ConvertTo-Json -Depth 100 -Compress|node tools/release/tailor-language-diff.cjs
  if($LASTEXITCODE -ne 0){throw 'Final saved/active candidate mismatch'}
  $receipt=@{workflowId=$id;beforeVersion=$baseline.versionId;activeVersion=$before.activeVersionId;activatedUTC=(Get-Date).ToUniversalTime().ToString('o');sourcesSchemaVersion='1.4';changedNodes=$manifest.changedNodes;beforeSnapshot=$baseline.snapshot;activeSnapshot=$snapshot;workflowExecutions=0;modelCalls=0;publication='Saved update was observed active on independent readback; no repeated PUT or activation'}
  $receipt|ConvertTo-Json -Depth 10|Set-Content "$state/active.json" -Encoding UTF8
  [PSCustomObject]$receipt|Select-Object workflowId,beforeVersion,activeVersion,activatedUTC,sourcesSchemaVersion,workflowExecutions,modelCalls|ConvertTo-Json
  exit 0
 }
 if(!$before.active -or $before.versionId -ne $manifest.savedVersion -or $before.activeVersionId -ne $manifest.activeVersion){throw 'Saved/active baseline drift'}
 if($before.staticData -or $before.pinData.PSObject.Properties.Count -gt 0 -or $before.nodeGroups.Count -gt 0){throw 'Unexpected additional writable state'}
 $snapshot=Snapshot $id $raw ('language-'+$Action.ToLower()+'-before') 'active'
 CheckProjection @{name=$before.name;nodes=$before.nodes;connections=$before.connections;settings=$before.settings} @{name=$before.name;nodes=$before.activeVersion.nodes;connections=$before.activeVersion.connections;settings=$before.settings}
 $desired=$raw|ConvertFrom-Json
 for($i=0;$i -lt $manifest.changedNodes.Count;$i++){
  $record=$manifest.changedNodes[$i]
  $node=@($desired.nodes|Where-Object id -eq $record.id)
  if($node.Count -ne 1 -or $node[0].name -ne $record.name -or (Hash $node[0].parameters.jsCode) -ne $record.beforeSHA256){throw 'Node identity/hash drift'}
  $key=if($i -eq 0){'validate'}else{'compose'}
  $code=[IO.File]::ReadAllText((Join-Path (Get-Location) "dev-system/prepared/tailor-quality/language-v14/$key-candidate.js"))
  if((Hash $code) -ne $record.candidateSHA256){throw 'Candidate hash mismatch'}
  $node[0].parameters.jsCode=$code
 }
 @{before=$before;after=$desired}|ConvertTo-Json -Depth 100 -Compress|node tools/release/tailor-language-check.cjs
 if($LASTEXITCODE -ne 0){throw 'Two-node diff guard failed'}
 if($Action -eq 'Capture'){
  $stage='capture current Worker without changing it'
  $cloud=CloudSnapshot
  @{workflowId=$id;versionId=$before.versionId;updatedAt=$before.updatedAt;snapshot=$snapshot;cloudflare=$cloud;capturedUTC=(Get-Date).ToUniversalTime().ToString('o')}|ConvertTo-Json -Depth 10|Set-Content "$state/baseline.json" -Encoding UTF8
  Write-Output ('Verified encrypted Tailor/Worker snapshots; baseline '+$before.versionId+'; Worker '+$cloud.version)
  exit 0
 }
 $baseline=Get-Content "$state/baseline.json" -Raw -Encoding UTF8|ConvertFrom-Json
 if($baseline.versionId -ne $before.versionId -or $baseline.updatedAt -ne $before.updatedAt){throw 'Captured baseline drift'}
 $payload=@{name=$desired.name;nodes=$desired.nodes;connections=$desired.connections;settings=$desired.settings}
 $again=Invoke-RestMethod "$base/workflows/$id" -Headers $headers
 if($again.versionId -ne $before.versionId -or $again.updatedAt -ne $before.updatedAt -or $again.activeVersionId -ne $before.activeVersionId){throw 'Concurrent workflow change'}
 $stage='save exactly the two approved Tailor Code fields'
 $null=Invoke-RestMethod "$base/workflows/$id" -Method Put -Headers $headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes(($payload|ConvertTo-Json -Depth 100 -Compress)))
 $savedRaw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content;$saved=$savedRaw|ConvertFrom-Json
 CheckProjection $payload $saved
 $savedSnapshot=Snapshot $id $savedRaw 'language-saved-before-activation' 'active'
 if($saved.activeVersionId -ne $before.activeVersionId -and $saved.activeVersionId -ne $saved.versionId){throw 'Unexpected active version after save'}
 if($saved.activeVersionId -ne $saved.versionId){
  $stage='activate the verified approved Tailor version'
  $null=Invoke-RestMethod "$base/workflows/$id/activate" -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'
 }
 $afterRaw=(Invoke-WebRequest "$base/workflows/$id" -Headers $headers -UseBasicParsing).Content;$after=$afterRaw|ConvertFrom-Json
 if(!$after.active -or $after.activeVersionId -ne $after.versionId -or $after.versionId -ne $saved.versionId){throw 'Tailor activation not verified'}
 CheckProjection $payload $after
 CheckProjection $payload @{name=$after.name;nodes=$after.activeVersion.nodes;connections=$after.activeVersion.connections;settings=$after.settings}
 $afterSnapshot=Snapshot $id $afterRaw 'language-verified-active' 'active'
 $receipt=@{workflowId=$id;beforeVersion=$before.versionId;activeVersion=$after.activeVersionId;activatedUTC=(Get-Date).ToUniversalTime().ToString('o');sourcesSchemaVersion='1.4';changedNodes=$manifest.changedNodes;beforeSnapshot=$snapshot;savedSnapshot=$savedSnapshot;activeSnapshot=$afterSnapshot;workflowExecutions=0;modelCalls=0}
 $receipt|ConvertTo-Json -Depth 10|Set-Content "$state/active.json" -Encoding UTF8
 [PSCustomObject]$receipt|Select-Object workflowId,beforeVersion,activeVersion,activatedUTC,sourcesSchemaVersion,workflowExecutions,modelCalls|ConvertTo-Json
} catch {
 Write-Output $_.ScriptStackTrace
 Write-Error ('Tailor language release stopped at '+$stage+'. '+$_.Exception.GetType().Name+'. No raw response printed.')
 exit 1
} finally {$headers=$null}
