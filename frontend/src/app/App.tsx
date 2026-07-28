export function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="topbar">
        <span className="brand" aria-label="TezFin">
          TezFin
        </span>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span aria-current="page">Markets</span>
        </nav>
      </header>
      <main id="main-content" className="workspace" />
    </div>
  );
}
