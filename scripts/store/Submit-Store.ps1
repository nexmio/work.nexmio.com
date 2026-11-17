<#
.SYNOPSIS
  Sends a Microsoft Store package to Partner Center and updates the listing text, through the
  Microsoft Store submission API (https://learn.microsoft.com/windows/uwp/monetize/create-and-manage-submissions-using-windows-store-services).

.DESCRIPTION
  Used by the release workflow (.github/workflows/build.yml), once for Nexmio Work Preview (on every
  tag) and once for Nexmio Work (when the owner starts Release Stable). It:
    1. gets a token from Azure AD (an app registration that is linked to Partner Center),
    2. removes an unfinished submission of the app, if there is one,
    3. starts a new submission, replaces the package, and sets every text field of the listing in every
       language: description, short description, search terms, "What's new", copyright and trademark,
       developed by, website, privacy policy, support contact, features, hardware, and the notes for
       certification, and the pictures (screenshots, the 300 x 300 icon and the 1080 x 1080 box art,
       replacing the ones the Store has). Price, markets, visibility, category and age rating are not
       touched: the new submission keeps them from the last one,
    4. uploads the package and commits the submission, and waits until the Store has accepted it.
  Microsoft then certifies it and publishes it (the submission is set to publish when certified).

  The app must already have been published once by hand in Partner Center (the API only updates).
  Without TenantId, ClientId and ClientSecret the script says so and exits without an error, so a
  release still works before the Store is connected.

.PARAMETER ListingJson
  store-listing.json made by scripts/release/notes.mjs (all the fields of the listing).
.PARAMETER NotesFile
  store-notes.txt made by scripts/release/notes.mjs ("What's new").
#>
param(
  [Parameter(Mandatory)] [string]$AppId,
  [Parameter(Mandatory)] [string]$PackagePath,
  [Parameter(Mandatory)] [string]$ListingJson,
  [Parameter(Mandatory)] [string]$NotesFile,
  [ValidateSet("Preview", "Stable")] [string]$Edition = "Stable",
  [string]$ImagesDir = "docs",
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
# Preview must never be public. A new submission keeps the visibility of the last one; if that is not
# hidden, the new submission is removed and nothing is sent.
if ($Edition -eq "Preview" -and $sub.visibility -notin @("Hidden", "Private")) {
  Write-Host "::error::Nexmio Work Preview is not hidden in the Store (visibility: $($sub.visibility)). Set it to 'available by direct link' in Partner Center. Nothing was sent."
  Call Delete "/applications/$AppId/submissions/$($sub.id)" | Out-Null
  exit 1
}

function Set-Field($obj, [string]$name, $value) {
  if ($null -eq $value) { return }
  if ($obj.PSObject.Properties[$name]) { $obj.$name = $value }
  else { Add-Member -InputObject $obj -NotePropertyName $name -NotePropertyValue $value }
}

# The pictures: ten screenshots, the icon and the box art (docs/STORE-LISTING.md). A picture that is
# missing from the repository is skipped with a warning; the Store keeps the ones it has for that type.
$pictures = @()
foreach ($n in "start-page", "note-editor", "tasks", "task-page", "focus", "meeting", "tags", "themes", "midnight", "ideas") {
  $pictures += @{ type = "Screenshot"; path = Join-Path $ImagesDir "screenshots/$n.png" }
}
$pictures += @{ type = "Icon"; path = Join-Path $ImagesDir "store/icon-300x300.png" }
$pictures += @{ type = "StoreLogoSquare"; path = Join-Path $ImagesDir "store/box-art-1080x1080.png" }
$pictures = @($pictures | Where-Object {
    $found = Test-Path $_.path
    if (-not $found) { Write-Host "::warning::The picture $($_.path) is missing and was not sent." }
    $found
  })
$replaced = @($pictures | ForEach-Object { $_.type } | Select-Object -Unique)

foreach ($lang in $sub.listings.PSObject.Properties) {
  $bl = $lang.Value.baseListing
  # Remove the pictures of the types that are sent again, then add the new ones.
  foreach ($old in @($bl.images)) { if ($old.imageType -in $replaced) { $old.fileStatus = "PendingDelete" } }
  $images = @($bl.images)
  foreach ($pic in $pictures) {
    $images += [pscustomobject]@{
      fileName = "$($pic.type)-$([IO.Path]::GetFileName($pic.path))"; fileStatus = "PendingUpload"; id = ""; description = ""; imageType = $pic.type
    }
  }
  $bl.images = $images
  Set-Field $bl "description" $description
  Set-Field $bl "shortDescription" $listing.shortDescription
  Set-Field $bl "releaseNotes" $notes
  Set-Field $bl "keywords" @($listing.keywords)
  Set-Field $bl "features" @($listing.features)
  Set-Field $bl "copyrightAndTrademarkInfo" $listing.copyrightAndTrademarkInfo
  Set-Field $bl "licenseTerms" $listing.licenseTerms
  Set-Field $bl "devStudio" $listing.devStudio
  Set-Field $bl "websiteUrl" $listing.websiteUrl
  Set-Field $bl "privacyPolicy" $listing.privacyPolicy
  Set-Field $bl "supportContact" $listing.supportContact
  Set-Field $bl "minimumHardware" @($listing.minimumHardware)
  Set-Field $bl "recommendedHardware" @($listing.recommendedHardware)
}
Set-Field $sub "notesForCertification" $listing.notesForCertification
$sub.targetPublishMode = "Immediate"

# 4. Upload the package and the pictures (one zip, the file names as in the listing) and commit
$zip = Join-Path ([IO.Path]::GetTempPath()) "store-package.zip"
if (Test-Path $zip) { Remove-Item $zip }
$staging = Join-Path ([IO.Path]::GetTempPath()) "store-staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse }
New-Item -ItemType Directory -Path $staging | Out-Null
Copy-Item $PackagePath $staging
foreach ($pic in $pictures) { Copy-Item $pic.path (Join-Path $staging "$($pic.type)-$([IO.Path]::GetFileName($pic.path))") }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zip
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
