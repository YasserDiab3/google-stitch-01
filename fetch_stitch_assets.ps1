param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [string]$OutputDir = "stitch_exports",
  [string]$ScreensFile = "stitch_screens.json"
)

$ErrorActionPreference = "Stop"

function Get-Slug {
  param(
    [int]$Order,
    [string]$Title
  )

  $safe = $Title.ToLowerInvariant()
  $safe = [System.Text.RegularExpressions.Regex]::Replace($safe, "[^a-z0-9]+", "-")
  $safe = $safe.Trim("-")
  if ([string]::IsNullOrWhiteSpace($safe)) {
    $safe = "screen"
  }
  return "{0:d2}-{1}" -f $Order, $safe
}

function Invoke-StitchTool {
  param(
    [string]$ToolName,
    [hashtable]$Arguments
  )

  $body = @{
    jsonrpc = "2.0"
    id = [int](Get-Random -Minimum 1000 -Maximum 999999)
    method = "tools/call"
    params = @{
      name = $ToolName
      arguments = $Arguments
    }
  } | ConvertTo-Json -Depth 10 -Compress

  $bodyPath = Join-Path $PWD "mcp-request.json"
  Set-Content -Path $bodyPath -Value $body -Encoding UTF8

  $response = curl.exe -sS -X POST "https://stitch.googleapis.com/mcp" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json, text/event-stream" `
    -H "X-Goog-Api-Key: $ApiKey" `
    --data-binary "@$bodyPath"

  return $response | ConvertFrom-Json
}

function Download-File {
  param(
    [string]$Url,
    [string]$Destination
  )

  curl.exe -sS -L --fail --output $Destination $Url
  if ($LASTEXITCODE -ne 0) {
    throw "curl failed for $Destination"
  }
}

$screens = Get-Content $ScreensFile -Raw | ConvertFrom-Json
$root = Join-Path $PWD $OutputDir
New-Item -ItemType Directory -Path $root -Force | Out-Null

$manifest = @()

foreach ($screen in $screens) {
  $slug = Get-Slug -Order $screen.order -Title $screen.title
  $screenDir = Join-Path $root $slug
  New-Item -ItemType Directory -Path $screenDir -Force | Out-Null

  $toolResult = Invoke-StitchTool -ToolName "get_screen" -Arguments @{
    name = "projects/$ProjectId/screens/$($screen.screenId)"
    projectId = $ProjectId
    screenId = $screen.screenId
  }

  $data = $toolResult.result.structuredContent
  if (-not $data) {
    throw "Missing structuredContent for screen $($screen.screenId)"
  }

  $jsonPath = Join-Path $screenDir "screen.json"
  $imagePath = Join-Path $screenDir "screen.png"
  $htmlPath = Join-Path $screenDir "screen.html"

  $data | ConvertTo-Json -Depth 20 | Set-Content -Path $jsonPath -Encoding UTF8
  Download-File -Url $data.screenshot.downloadUrl -Destination $imagePath
  Download-File -Url $data.htmlCode.downloadUrl -Destination $htmlPath

  $manifest += [pscustomobject]@{
    order = $screen.order
    title = $screen.title
    screenId = $screen.screenId
    slug = $slug
    directory = $screenDir
    image = $imagePath
    html = $htmlPath
    metadata = $jsonPath
  }
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $root "manifest.json") -Encoding UTF8
