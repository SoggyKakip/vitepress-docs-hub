param(
  [string]$ProjectName,
  [string]$HubRepository = "SoggyKakip/vitepress-docs-hub",
  [string]$TargetRoot = "."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
  $ProjectName = Read-Host "Project name (used as repository name, e.g. proj-root-docs-a)"
}

$normalizedName = $ProjectName.Trim().ToLower() -replace "\s+", "-"
if ($normalizedName -notmatch "^[a-z0-9][a-z0-9-]*$") {
  throw "Invalid project name: '$normalizedName'. Use lowercase letters, numbers, and hyphens only."
}

$resolvedRoot = (Resolve-Path -LiteralPath $TargetRoot).Path
$projectRoot = Join-Path $resolvedRoot $normalizedName

if (Test-Path -LiteralPath $projectRoot) {
  $existingEntries = Get-ChildItem -LiteralPath $projectRoot -Force
  if ($existingEntries.Count -gt 0) {
    throw "Target directory already exists and is not empty: $projectRoot"
  }
} else {
  New-Item -ItemType Directory -Path $projectRoot | Out-Null
}

$titleInput = Read-Host "Display title (default: $normalizedName)"
$categoryInput = Read-Host "Category (default: Uncategorized)"
$descriptionInput = Read-Host "Description (optional)"

$displayTitle = if ([string]::IsNullOrWhiteSpace($titleInput)) { $normalizedName } else { $titleInput.Trim() }
$category = if ([string]::IsNullOrWhiteSpace($categoryInput)) { "Uncategorized" } else { $categoryInput.Trim() }
$description = if ([string]::IsNullOrWhiteSpace($descriptionInput)) { "Project documentation." } else { $descriptionInput.Trim() }

$workflowDir = Join-Path $projectRoot ".github/workflows"
New-Item -ItemType Directory -Path $workflowDir -Force | Out-Null

$indexContent = @"
---
title: $displayTitle
category: $category
description: $description
---

# $displayTitle

Welcome to the project documentation.
"@

$workflowTemplate = @'
name: Notify Docs Hub

on:
  push:
    branches: [main, master]

permissions:
  contents: read

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Dispatch update event to docs hub
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.HUB_REPO_DISPATCH_TOKEN }}
          repository: __HUB_REPOSITORY__
          event-type: docs-updated
          client-payload: >-
            {"submodule_path":"docs/project-docs/__PROJECT_NAME__","source_repo":"${{ github.repository }}","source_repo_name":"${{ github.event.repository.name }}","source_sha":"${{ github.sha }}","source_ref":"${{ github.ref_name }}"}
'@

$workflowContent = $workflowTemplate.Replace("__HUB_REPOSITORY__", $HubRepository).Replace("__PROJECT_NAME__", $normalizedName)

$readmeContent = @"
# $normalizedName

## Setup

1. Create this repository on GitHub as: \`$normalizedName\`
2. Add repository secret in GitHub Actions:
   - \`HUB_REPO_DISPATCH_TOKEN\`
3. Push to \`main\` or \`master\`

## What happens after push

- This repository sends a \`repository_dispatch\` event to \`$HubRepository\`
- Docs Hub updates submodule \`docs/project-docs/$normalizedName\`
- If changed, Docs Hub creates an automated PR
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $projectRoot "index.md"), $indexContent, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $workflowDir "notify-docs-hub.yml"), $workflowContent, $utf8NoBom)
[System.IO.File]::WriteAllText((Join-Path $projectRoot "README.md"), $readmeContent, $utf8NoBom)

Write-Host "Scaffold created: $projectRoot"
Write-Host "Next:"
Write-Host "  1) git init"
Write-Host "  2) create remote repository '$normalizedName'"
Write-Host "  3) add secret HUB_REPO_DISPATCH_TOKEN"
Write-Host "  4) commit and push"
