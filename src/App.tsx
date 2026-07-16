import { Suspense, lazy, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from './hooks/useData';
import { useUrlUserSync } from './hooks/useUrlUserSync';
import { usePageMeta } from './hooks/usePageMeta';
import { useExactUser } from './hooks/useExactUser';
import { StoreProvider, useStore } from './hooks/StoreContext';
import { goToMainPage } from './utils/urlUser';
import InfoPanel from './components/InfoPanel';
import LanguageToggle from './components/LanguageToggle';
import SearchBar from './components/SearchBar';
import AppearanceControls from './components/AppearanceControls';
import AchievementCustomizeArea from './components/AchievementCustomizeArea';
import IndividualCards from './components/IndividualCards';
import LoadingSkeleton from './components/LoadingSkeleton';
import { formatLastUpdated } from './utils/formatDate';
import { localeTagForLanguage } from './i18n';
import type { DataProps } from './types';

const StatsChart = lazy(() => import('./components/StatsChart'));

function PageHeader() {
  const { setCurrentQuery } = useStore();
  const { t } = useTranslation();

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
        aria-label={t('header.homeAriaLabel')}
        onClick={(event) => {
          event.preventDefault();
          handleGoHome();
        }}
      >
        <h1>
          <span>{t('header.titleWaniKani')}</span>
          {t('header.titleRest')}
        </h1>
        <p className="subtitle">{t('header.subtitle')}</p>
      </a>
      <InfoPanel />
    </header>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t('header.skipToMain')}
      </a>
      <LanguageToggle />
      <main id="main-content" className="container">
        <PageHeader />
        {children}
      </main>
    </>
  );
}

function AppContent({ allStats, allUsers, lastUpdated }: DataProps & { lastUpdated: string }) {
  const { t } = useTranslation();
  const { appLanguage } = useStore();
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
            {t('header.loadingChart')}
          </div>
        }
      >
        <StatsChart allStats={allStats} allUsers={allUsers} />
      </Suspense>
      <IndividualCards allStats={allStats} allUsers={allUsers} />
      <footer>
        <p className="footer-credits">{t('header.footerCredits')}</p>
        <p className="footer-meta">
          {t('header.lastUpdated', {
            date: formatLastUpdated(lastUpdated, localeTagForLanguage(appLanguage)),
          })}
        </p>
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
