export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-2xs text-fg-dim">
        <div className="flex items-center gap-2">
          <span className="font-mono text-fg-muted">WinCommander</span>
          <span>· Computer Management oefenplatform</span>
        </div>
        <div className="flex items-center gap-3">
          <span>🔒 100% client-side — je commando's verlaten je toestel niet</span>
        </div>
      </div>
    </footer>
  );
}
