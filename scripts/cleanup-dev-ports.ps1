param(
  [switch]$Quiet
)

$ports = @(5000, 5173)

$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  Group-Object OwningProcess

if (-not $connections) {
  if (-not $Quiet) {
    Write-Host "No stale dev processes found on ports 5000 or 5173."
  }
  exit 0
}

foreach ($group in $connections) {
  $processId = [int]$group.Name
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

  if (-not $process) {
    continue
  }

  $usedPorts = ($group.Group | Select-Object -ExpandProperty LocalPort | Sort-Object -Unique) -join ', '

  if ($process.ProcessName -ieq 'node') {
    if (-not $Quiet) {
      Write-Host "Stopping stale node process $processId on port(s): $usedPorts"
    }
    Stop-Process -Id $processId -Force -ErrorAction Stop
    continue
  }

  Write-Error "Port(s) $usedPorts are in use by non-node process '$($process.ProcessName)' (PID $processId). Close that process manually, then rerun npm run dev."
  exit 1
}

Start-Sleep -Milliseconds 700
