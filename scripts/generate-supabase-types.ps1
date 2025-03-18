#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generates TypeScript types from Supabase database schema
.DESCRIPTION
    This script uses the Supabase CLI to generate TypeScript types from your Supabase project.
    It requires the Supabase CLI to be installed and properly configured.
.EXAMPLE
    ./generate-supabase-types.ps1
#>

# Configuration
$outputFile = "../types/supabase-types.ts"
$errorFile = "../types/supabase-error.log"

# Create types directory if it doesn't exist
if (!(Test-Path -Path "../types")) {
    New-Item -ItemType Directory -Path "../types"
}

Write-Host "🔄 Generating Supabase types..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
try {
    $supabaseVersion = npx supabase --version
    Write-Host "✅ Supabase CLI detected: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it with: npm install -g supabase" -ForegroundColor Red
    exit 1
}

# Get Supabase URL and key from .env.local file
$envFile = "../.env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $supabaseUrl = ($envContent | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=(.*)" } | ForEach-Object { $matches[1] })
    $supabaseKey = ($envContent | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)" } | ForEach-Object { $matches[1] })
    
    if (!$supabaseUrl -or !$supabaseKey) {
        Write-Host "❌ Could not find Supabase URL or key in .env.local file" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    exit 1
}

# Generate types
try {
    Write-Host "🔄 Connecting to Supabase and generating types..." -ForegroundColor Cyan
    
    # Run the Supabase CLI command to generate types
    $output = npx supabase gen types typescript --db-url "$supabaseUrl" --schema public 2>&1
    
    # Check if the command was successful
    if ($LASTEXITCODE -eq 0) {
        # Save the output to the file
        $output | Out-File -FilePath $outputFile
        Write-Host "✅ Types generated successfully and saved to $outputFile" -ForegroundColor Green
        
        # Display a preview of the generated types
        Write-Host "`n📄 Preview of generated types:" -ForegroundColor Cyan
        Get-Content $outputFile -TotalCount 20 | ForEach-Object { Write-Host $_ }
        Write-Host "... (more types in the file)" -ForegroundColor DarkGray
    } else {
        # Save the error output to a log file
        $output | Out-File -FilePath $errorFile
        Write-Host "❌ Error generating types. See $errorFile for details." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    $_.Exception | Out-File -FilePath $errorFile
    exit 1
}

Write-Host "`n✨ Done! You can now review the types in $outputFile" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the generated types" -ForegroundColor Yellow
Write-Host "2. Update your TypeScript interfaces to match the database schema" -ForegroundColor Yellow
Write-Host "3. Use these types in your application code" -ForegroundColor Yellow
