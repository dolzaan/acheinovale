import { Logo } from "@/components/logo";

export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-label="Carregando página">
      <header className="site-header page-loading__header">
        <div className="container header-inner">
          <Logo />
          <div className="loading-skeleton loading-skeleton--nav" />
          <div className="loading-skeleton loading-skeleton--action" />
        </div>
      </header>
      <main className="page-loading__main">
        <div className="container page-loading__content">
          <div className="page-loading__heading">
            <div className="loading-skeleton loading-skeleton--eyebrow" />
            <div className="loading-skeleton loading-skeleton--title" />
            <div className="loading-skeleton loading-skeleton--copy" />
          </div>
          <div className="page-loading__cards">
            <div className="loading-skeleton loading-skeleton--card" />
            <div className="loading-skeleton loading-skeleton--card" />
            <div className="loading-skeleton loading-skeleton--card" />
          </div>
          <p className="page-loading__label"><span className="button-spinner" aria-hidden="true" /> Carregando conteúdo...</p>
        </div>
      </main>
    </div>
  );
}
