import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SITE } from '../constants';

export default function InfoPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="info-toggle">
      <button
        id="infoBtn"
        type="button"
        className="info-btn"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? t('info.hide') : t('info.show')}
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="info-panel"
          role="region"
          aria-labelledby="infoBtn"
          style={{ display: 'block', animation: 'slideDown 0.3s ease' }}
        >
          <div className="info-content">
            <p>{t('info.description')}</p>
            <p>{t('info.contribution')}</p>
            <a
              href={SITE.latestMarathon.threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              {t('info.forumLink')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
