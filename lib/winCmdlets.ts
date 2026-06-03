/**
 * Lijst van veelgebruikte cmdlets (proper-case) voor autocomplete en
 * commando-herkenning in de highlighter. De volledige cmdlet-bibliotheek
 * (met beschrijvingen/parameters) komt later in data/cmdlets.json.
 */
export const CMDLETS: string[] = [
  // Basis & help
  "Get-Help", "Get-Command", "Get-Member", "Get-Alias", "Get-History",
  "Write-Output", "Write-Host", "Out-Host", "Out-File",
  // Bestandssysteem
  "Get-ChildItem", "Get-Item", "Get-Content", "Set-Content", "Add-Content",
  "New-Item", "Copy-Item", "Move-Item", "Remove-Item", "Rename-Item",
  "Test-Path", "Set-Location", "Get-Location",
  // Filtering & vorm
  "Where-Object", "Select-Object", "Sort-Object", "Group-Object",
  "Measure-Object", "ForEach-Object", "Format-Table", "Format-List",
  "Format-Wide", "Compare-Object", "Select-String", "Tee-Object", "Get-Unique",
  // Services
  "Get-Service", "Start-Service", "Stop-Service", "Restart-Service", "Set-Service",
  // Processen
  "Get-Process", "Start-Process", "Stop-Process", "Wait-Process",
  // Gebruikers & groepen
  "Get-LocalUser", "New-LocalUser", "Set-LocalUser", "Remove-LocalUser",
  "Get-LocalGroup", "Add-LocalGroupMember", "Get-LocalGroupMember",
  // Registry
  "Get-ItemProperty", "Set-ItemProperty", "New-ItemProperty", "Remove-ItemProperty",
  "Get-ItemPropertyValue", "New-Item",
  // Netwerk
  "Test-Connection", "Test-NetConnection", "Get-NetIPAddress", "Get-NetAdapter",
  "Resolve-DnsName", "Invoke-WebRequest", "Invoke-RestMethod",
  // Event logs
  "Get-EventLog", "Get-WinEvent",
  // Scripts & systeem
  "Get-ExecutionPolicy", "Set-ExecutionPolicy", "Invoke-Command",
  "Get-CimInstance", "Get-WmiObject",
  // Geplande taken
  "Get-ScheduledTask", "Register-ScheduledTask", "Start-ScheduledTask",
  // Diversen
  "Import-Csv", "Export-Csv", "ConvertTo-Json", "ConvertFrom-Json", "Clear-Host",
];

/** Lowercase-set voor snelle commando-herkenning in de highlighter. */
export const CMDLET_SET = new Set(CMDLETS.map((c) => c.toLowerCase()));
