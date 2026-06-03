/**
 * Nagebootste systeem-data waarop de mini-interpreter (lib/winInterpreter.ts)
 * commando's écht uitvoert. Bewust realistisch + gevarieerd zodat filteren,
 * sorteren en selecteren zichtbaar resultaat geeft.
 */
export type PSObj = Record<string, any>;

export const SERVICES: PSObj[] = [
  { Status: "Running", Name: "Audiosrv",     DisplayName: "Windows Audio" },
  { Status: "Running", Name: "BFE",          DisplayName: "Base Filtering Engine" },
  { Status: "Running", Name: "Dhcp",         DisplayName: "DHCP Client" },
  { Status: "Running", Name: "Dnscache",     DisplayName: "DNS Client" },
  { Status: "Running", Name: "LanmanServer", DisplayName: "Server" },
  { Status: "Running", Name: "Spooler",      DisplayName: "Print Spooler" },
  { Status: "Running", Name: "Themes",       DisplayName: "Themes" },
  { Status: "Running", Name: "W32Time",      DisplayName: "Windows Time" },
  { Status: "Running", Name: "Winmgmt",      DisplayName: "Windows Management Instrumentation" },
  { Status: "Running", Name: "WinDefend",    DisplayName: "Microsoft Defender Antivirus Service" },
  { Status: "Running", Name: "WSearch",      DisplayName: "Windows Search" },
  { Status: "Stopped", Name: "Fax",          DisplayName: "Fax" },
  { Status: "Stopped", Name: "wuauserv",     DisplayName: "Windows Update" },
  { Status: "Stopped", Name: "WinRM",        DisplayName: "Windows Remote Management (WS-Management)" },
  { Status: "Stopped", Name: "WinHttpAutoProxySvc", DisplayName: "WinHTTP Web Proxy Auto-Discovery Service" },
];

export const PROCESSES: PSObj[] = [
  { Name: "chrome",     Id: 9241,  CPU: 412.5, WS: 680 * 1048576, PM: 512 * 1048576, NPM: 142 * 1024, SI: 1 },
  { Name: "Code",       Id: 4120,  CPU: 198.2, WS: 520 * 1048576, PM: 410 * 1048576, NPM: 88 * 1024,  SI: 1 },
  { Name: "firefox",    Id: 7820,  CPU: 88.1,  WS: 355 * 1048576, PM: 288 * 1048576, NPM: 64 * 1024,  SI: 1 },
  { Name: "explorer",   Id: 3310,  CPU: 45.6,  WS: 240 * 1048576, PM: 180 * 1048576, NPM: 54 * 1024,  SI: 1 },
  { Name: "Teams",      Id: 12044, CPU: 22.0,  WS: 180 * 1048576, PM: 120 * 1048576, NPM: 33 * 1024,  SI: 1 },
  { Name: "powershell", Id: 6600,  CPU: 5.2,   WS: 95 * 1048576,  PM: 70 * 1048576,  NPM: 20 * 1024,  SI: 1 },
  { Name: "dwm",        Id: 1280,  CPU: 60.3,  WS: 88 * 1048576,  PM: 65 * 1048576,  NPM: 18 * 1024,  SI: 1 },
  { Name: "svchost",    Id: 980,   CPU: 12.4,  WS: 42 * 1048576,  PM: 30 * 1048576,  NPM: 12 * 1024,  SI: 0 },
  { Name: "OUTLOOK",    Id: 8150,  CPU: 33.7,  WS: 310 * 1048576, PM: 240 * 1048576, NPM: 48 * 1024,  SI: 1 },
  { Name: "notepad",    Id: 5512,  CPU: 0.3,   WS: 12 * 1048576,  PM: 8 * 1048576,   NPM: 6 * 1024,   SI: 1 },
];

export const CHILDITEMS: PSObj[] = [
  { Mode: "d-----", LastWriteTime: "3/06/2026   14:22", Length: null, Name: "Documents" },
  { Mode: "d-----", LastWriteTime: "1/06/2026   09:10", Length: null, Name: "Downloads" },
  { Mode: "-a----", LastWriteTime: "28/05/2026  18:45", Length: 1024,    Name: "notities.txt" },
  { Mode: "-a----", LastWriteTime: "30/05/2026  11:02", Length: 5120,    Name: "script.ps1" },
  { Mode: "-a----", LastWriteTime: "12/05/2026  08:30", Length: 204800,  Name: "foto.png" },
  { Mode: "-a----", LastWriteTime: "2/06/2026   16:05", Length: 2048,    Name: "data.csv" },
  { Mode: "-a----", LastWriteTime: "2/06/2026   16:40", Length: 0,       Name: "leeg.txt" },
  { Mode: "-a----", LastWriteTime: "29/05/2026  21:15", Length: 1048576, Name: "backup.zip" },
];

export const LOCALUSERS: PSObj[] = [
  { Name: "Administrator", Enabled: false, Description: "Ingebouwd account voor systeembeheer" },
  { Name: "Ruben",         Enabled: true,  Description: "" },
  { Name: "StudentUser",   Enabled: true,  Description: "Nieuwe studentengebruiker" },
  { Name: "Gast",          Enabled: false, Description: "Ingebouwd account voor gasttoegang" },
];

export const WIN32: Record<string, PSObj[]> = {
  win32_operatingsystem: [{ Caption: "Microsoft Windows 11 Pro", Version: "10.0.22631", OSArchitecture: "64-bit", BuildNumber: "22631" }],
  win32_processor: [{ Name: "Intel(R) Core(TM) i7-12700H", NumberOfCores: 8, NumberOfLogicalProcessors: 16, MaxClockSpeed: 2300 }],
  win32_computersystem: [{ Manufacturer: "Dell Inc.", Model: "XPS 15", TotalPhysicalMemory: 17179869184, NumberOfProcessors: 1 }],
  win32_logicaldisk: [
    { DeviceID: "C:", Size: 511000000000, FreeSpace: 128456789012, VolumeName: "Windows" },
    { DeviceID: "D:", Size: 256000000000, FreeSpace: 200000000000, VolumeName: "Data" },
  ],
  win32_bios: [{ Manufacturer: "Dell Inc.", SMBIOSBIOSVersion: "1.21.0", SerialNumber: "5CD1234XYZ" }],
};

/** Welk mock-dataset hoort bij een data-cmdlet (lowercase canonieke naam). */
export function mockFor(cmdlet: string, arg?: string): PSObj[] | null {
  switch (cmdlet) {
    case "get-service": return SERVICES.map((s) => ({ ...s }));
    case "get-process": return PROCESSES.map((p) => ({ ...p }));
    case "get-childitem": return CHILDITEMS.map((c) => ({ ...c }));
    case "get-localuser": return LOCALUSERS.map((u) => ({ ...u }));
    case "get-ciminstance":
    case "get-wmiobject": {
      const cls = (arg ?? "").toLowerCase();
      return WIN32[cls] ? WIN32[cls].map((o) => ({ ...o })) : null;
    }
    default: return null;
  }
}
