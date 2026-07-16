import { Suspense, lazy, type ReactNode } from 'react';
import { useData } from './hooks/useData';
import { useUrlUserSync } from './hooks/useUrlUserSync';
import { usePageMeta } from './hooks/usePageMeta';
import { useExactUser } from './hooks/useExactUser';
import { StoreProvider, useStore } from './hooks/StoreContext';
import { goToMainPage } from './utils/urlUser';
import InfoPanel from './components/InfoPanel';
import SearchBar from './components/SearchBar';
import AppearanceControls from './components/AppearanceControls';
import AchievementCustomizeArea from './components/AchievementCustomizeArea';
import IndividualCards from './components/IndividualCards';
import LoadingSkeleton from './components/LoadingSkeleton';
import { formatLastUpdated } from './utils/formatDate';
import type { DataProps } from './types';

const StatsChart = lazy(() => import('./components/StatsChart'));

function PageHeader() {
  const { setCurrentQuery } = useStore();

  const handleGoHome = () => {
    setCurrentQuery('');
    goToMainPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="page-header">
      <a
        href="/"
        className="page-header-home"
        aria-label="Return to home page"
        onClick={(event) => {
          event.preventDefault();
          handleGoHome();
        }}
      >
        <h1>
          <span>WaniKani</span> / 24-hour Readathon
        </h1>
        <p className="subtitle">Statistics for the 24-hour readathons!</p>
      </a>
      <InfoPanel />
    </header>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main id="main-content" className="container">
        <PageHeader />
        {children}
      </main>
    </>
  );
}

function AppContent({ allStats, allUsers, lastUpdated }: DataProps & { lastUpdated: string }) {
  useUrlUserSync(allUsers);
  const { exactUsername } = useExactUser(allUsers);
  usePageMeta({ username: exactUsername || undefined });

  return (
    <>
      <SearchBar allUsers={allUsers} />
      <AppearanceControls allStats={allStats} allUsers={allUsers} />
      <AchievementCustomizeArea allStats={allStats} allUsers={allUsers} />
      <Suspense
        fallback={
          <div className="chart-section chart-section-loading" aria-busy="true">
            Loading chart…
          </div>
        }
      >
        <StatsChart allStats={allStats} allUsers={allUsers} />
      </Suspense>
      <IndividualCards allStats={allStats} allUsers={allUsers} />
      <footer>
        <p className="footer-credits">
          Marathon organized by <strong>soggyboy</strong> (originally started by{' '}
          <strong>taiyousea</strong>). Data curated by <strong>GolyBidoof</strong>. Not affiliated
          with Tofugu LLC.
        </p>
        <p className="footer-meta">Last updated {formatLastUpdated(lastUpdated)}</p>
      </footer>
    </>
  );
}

export default function App() {
  const { allStats, allUsers, lastUpdated, loading, error } = useData();

  if (loading) {
    return (
      <PageShell>
        <LoadingSkeleton />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="no-results" role="alert">
          {error}
        </div>
      </PageShell>
    );
  }

  return (
    <StoreProvider allUsers={allUsers}>
      <PageShell>
        <AppContent allStats={allStats} allUsers={allUsers} lastUpdated={lastUpdated} />
      </PageShell>
    </StoreProvider>
  );
}
