import { useTranslation } from 'react-i18next';
import { useStore } from '../hooks/StoreContext';

export default function LanguageToggle() {
  const { t } = useTranslation();
  const { appLanguage, setAppLanguage } = useStore();

  return (
    <div className="language-toggle" role="radiogroup" aria-label={t('header.languageLabel')}>
      {(['en', 'ja'] as const).map((language) => (
        <button
          key={language}
          type="button"
          role="radio"
          aria-checked={appLanguage === language}
          className={appLanguage === language ? 'active' : ''}
          onClick={() => setAppLanguage(language)}
        >
          {t(language === 'en' ? 'header.languageEn' : 'header.languageJa')}
        </button>
      ))}
    </div>
  );
}
