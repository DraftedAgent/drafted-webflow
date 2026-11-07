param([ValidateSet('Capture','Deploy','Verify')][string]$Action='Capture')
$ErrorActionPreference='Stop'
$base='https://drafted.app.n8n.cloud/api/v1/workflows/H8oAioy58R1v3PvRe3YUa'
$headers=@{'X-N8N-API-KEY'=(Import-Clixml "$env:USERPROFILE/.codex/secrets/drafted-n8n.credential.xml").GetNetworkCredential().Password}
function Snapshot([string]$raw,[string]$label){
 $dir=Join-Path $env:LOCALAPPDATA 'Drafted/tailor-multi-release-20261107';New-Item -ItemType Directory -Force $dir|Out-Null
 icacls $dir /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F'|Out-Null
 $file=Join-Path $dir ($label+'-'+(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ')+'.clixml')
 $chunks=@();for($offset=0;$offset -lt $raw.Length;$offset+=24000){$chunks+=ConvertTo-SecureString $raw.Substring($offset,[Math]::Min(24000,$raw.Length-$offset)) -AsPlainText -Force};$chunks|Export-Clixml -LiteralPath $file
 $back=(@(Import-Clixml $file)|ForEach-Object {[PSCredential]::new('snapshot',$_).GetNetworkCredential().Password}) -join '';if($back -cne $raw){throw 'Snapshot integrity failed'}
 return $file
}
try{
 $raw=(Invoke-WebRequest $base -Headers $headers).Content;$before=$raw|ConvertFrom-Json
 $snapshot=Snapshot $raw ('before-'+$Action)
 if($Action -eq 'Verify'){$original=Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Drafted/tailor-multi-release-20261107') -Filter 'before-Deploy-*.clixml'|Sort-Object LastWriteTime -Descending|Select-Object -First 1;$raw=(@(Import-Clixml $original.FullName)|ForEach-Object {[PSCredential]::new('snapshot',$_).GetNetworkCredential().Password}) -join '';$before=$raw|ConvertFrom-Json}
 if($Action -eq 'Capture'){$raw|node tools/release/prepare-multi-context.cjs;if($LASTEXITCODE -ne 0){throw 'Preparation failed'};Write-Output 'Complete saved/active workflow snapshot encrypted and roundtrip verified';exit 0}
 $m=Get-Content output/tailor-multi-release/manifest.json -Raw|ConvertFrom-Json
 if($before.versionId -ne $m.version -or $before.activeVersionId -ne $m.version -or $before.updatedAt -ne $m.updatedAt){throw 'Concurrent backend change'}
 $desired=$raw|ConvertFrom-Json
 foreach($record in $m.changedNodes){$node=@($desired.nodes|Where-Object id -eq $record.id);if($node.Count -ne 1){throw 'Node identity'};$sha=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($node[0].parameters.jsCode))).ToLower();if($sha -ne $record.beforeSHA256){throw 'Node drift'};$code=[IO.File]::ReadAllText((Join-Path (Get-Location) ('output/tailor-multi-release/'+$record.key+'.js')));$sha=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($code))).ToLower();if($sha -ne $record.candidateSHA256){throw 'Candidate changed'};$node[0].parameters.jsCode=$code}
 $payload=@{name=$desired.name;nodes=$desired.nodes;connections=$desired.connections;settings=$desired.settings}
 if($Action -ne 'Verify'){
 $null=Invoke-RestMethod $base -Method Put -Headers $headers -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes(($payload|ConvertTo-Json -Depth 100 -Compress)))
 $saved=Invoke-RestMethod $base -Headers $headers
 if($saved.activeVersionId -ne $saved.versionId){$null=Invoke-RestMethod ($base+'/activate') -Method Post -Headers $headers -ContentType 'application/json' -Body '{}'}
 }
 $afterRaw=(Invoke-WebRequest $base -Headers $headers).Content;$after=$afterRaw|ConvertFrom-Json
 if(!$after.active -or $after.versionId -ne $after.activeVersionId){throw 'Activation not verified'}
 @{expected=$payload;actual=@{name=$after.name;nodes=$after.nodes;connections=$after.connections;settings=$after.settings}}|ConvertTo-Json -Depth 100 -Compress|node tools/coverage/check-projection.cjs;if($LASTEXITCODE -ne 0){throw 'Saved projection mismatch'}
 @{expected=$payload;actual=@{name=$after.name;nodes=$after.activeVersion.nodes;connections=$after.activeVersion.connections;settings=$after.settings}}|ConvertTo-Json -Depth 100 -Compress|node tools/coverage/check-projection.cjs;if($LASTEXITCODE -ne 0){throw 'Active projection mismatch'}
 $post=Snapshot $afterRaw 'verified-active'
 @{sourcesSchemaVersion='1.5';workflowId=$after.id;activeVersion=$after.activeVersionId;previousVersion=$before.activeVersionId;verifiedUTC=(Get-Date).ToUniversalTime().ToString('o');changedNodes=$m.changedNodes;model='gpt-6-luna';maxOutputTokens=4000;workflowExecutions=0;modelCalls=0;beforeSnapshot=$snapshot;afterSnapshot=$post}|ConvertTo-Json -Depth 10|Set-Content site/hosting/tailor-release.json -Encoding utf8
 Write-Output ('Verified active Tailor1.5 '+$after.activeVersionId)
}finally{$headers=$null}
