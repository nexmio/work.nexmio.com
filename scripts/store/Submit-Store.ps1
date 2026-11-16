<#
.SYNOPSIS
  Sends a Microsoft Store package to Partner Center and updates the listing text, through the
  Microsoft Store submission API (https://learn.microsoft.com/windows/uwp/monetize/create-and-manage-submissions-using-windows-store-services).

.DESCRIPTION
  Used by the release workflow (.github/workflows/release.yml), once for Nexmio Work Preview and once
  for Nexmio Work after the owner approves. It:
    1. gets a token from Azure AD (an app registration that is linked to Partner Center),
    2. removes an unfinished submission of the app, if there is one,
    3. starts a new submission, replaces the package, and sets the description, the short
       description, the search terms and "What's new" (release notes) in every language of the listing,
    4. uploads the package and commits the submission, and waits until the Store has accepted it.
  Microsoft then certifies it and publishes it (the submission is set to publish when certified).

  The app must already have been published once by hand in Partner Center (the API only updates).
  Without TenantId, ClientId and ClientSecret the script says so and exits without an error, so a
  release still works before the Store is connected.

.PARAMETER ListingJson
  store-listing.json made by scripts/release/notes.mjs (description, shortDescription, keywords).
.PARAMETER NotesFile
  store-notes.txt made by scripts/release/notes.mjs ("What's new").
#>
param(
  [Parameter(Mandatory)] [string]$AppId,
  [Parameter(Mandatory)] [string]$PackagePath,
  [Parameter(Mandatory)] [string]$ListingJson,
  [Parameter(Mandatory)] [string]$NotesFile,
  [ValidateSet("Preview", "Stable")] [string]$Edition = "Stable",
  [string]$TenantId = $env:STORE_TENANT_ID,
  [string]$ClientId = $env:STORE_CLIENT_ID,
  [string]$ClientSecret = $env:STORE_CLIENT_SECRET
)

$ErrorActionPreference = "Stop"

if (-not $TenantId -or -not $ClientId -or -not $ClientSecret -or -not $AppId) {
  Write-Host "::notice::The Microsoft Store is not connected yet (STORE_TENANT_ID, STORE_CLIENT_ID, STORE_CLIENT_SECRET and the app id are missing). The package was built but not sent."
  exit 0
}

$base = "https://manage.devcenter.microsoft.com/v1.0/my"

# 1. Token
$token = (Invoke-RestMethod -Method Post -Uri "https://login.microsoftonline.com/$TenantId/oauth2/token" -Body @{
    grant_type    = "client_credentials"
    client_id     = $ClientId
    client_secret = $ClientSecret
    resource      = "https://manage.devcenter.microsoft.com"
  }).access_token
$headers = @{ Authorization = "Bearer $token" }

function Call([string]$method, [string]$path, $body = $null) {
  $req = @{ Method = $method; Uri = "$base$path"; Headers = $headers; ContentType = "application/json" }
  if ($null -ne $body) { $req.Body = ($body | ConvertTo-Json -Depth 20) }
  Invoke-RestMethod @req
}

# 2. An unfinished submission blocks a new one: remove it.
$app = Call Get "/applications/$AppId"
if ($app.pendingApplicationSubmission) {
  Write-Host "Removing the unfinished submission $($app.pendingApplicationSubmission.id)."
  Call Delete "/applications/$AppId/submissions/$($app.pendingApplicationSubmission.id)" | Out-Null
}

# 3. A new submission, with the package and the texts
$sub = Call Post "/applications/$AppId/submissions"
Write-Host "Started submission $($sub.id)."
$listing = Get-Content -Raw $ListingJson | ConvertFrom-Json
$notes = (Get-Content -Raw $NotesFile).Trim()
$description = $listing.description
if ($Edition -eq "Preview") {
  $description = "This is the Preview edition of Nexmio Work: the newest features, as they are built. It can be installed next to Nexmio Work.`n`n$description"
}

foreach ($p in $sub.applicationPackages) { $p.fileStatus = "PendingDelete" }
$fileName = [IO.Path]::GetFileName($PackagePath)
$sub.applicationPackages += [pscustomobject]@{
  fileName = $fileName; fileStatus = "PendingUpload"; minimumDirectXVersion = "None"; minimumSystemRam = "None"
}
foreach ($lang in $sub.listings.PSObject.Properties) {
  $bl = $lang.Value.baseListing
  $bl.description = $description
  $bl.shortDescription = $listing.shortDescription
  $bl.releaseNotes = $notes
  $bl.keywords = @($listing.keywords)
}
$sub.targetPublishMode = "Immediate"

# 4. Upload the package (a zip with the .msix in it) and commit
$zip = Join-Path ([IO.Path]::GetTempPath()) "store-package.zip"
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path $PackagePath -DestinationPath $zip
Invoke-RestMethod -Method Put -Uri $sub.fileUploadUrl -InFile $zip -Headers @{ "x-ms-blob-type" = "BlockBlob" } | Out-Null

Call Put "/applications/$AppId/submissions/$($sub.id)" $sub | Out-Null
Call Post "/applications/$AppId/submissions/$($sub.id)/commit" | Out-Null

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 20
  $status = (Call Get "/applications/$AppId/submissions/$($sub.id)/status")
  Write-Host "Status: $($status.status)"
  if ($status.status -eq "CommitFailed") {
    $status.statusDetails.errors | ForEach-Object { Write-Host "::error::$($_.code): $($_.details)" }
    exit 1
  }
  if ($status.status -in @("PreProcessing", "Certification", "Release", "Published")) {
    Write-Host "The Store has the submission ($Edition, $fileName) and is certifying it."
    exit 0
  }
}
Write-Host "::warning::The Store did not answer in ten minutes. Look at the submission in Partner Center."
