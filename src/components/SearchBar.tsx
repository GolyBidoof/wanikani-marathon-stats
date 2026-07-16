import {
  useState,
  useEffect,
  useMemo,
  useId,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../hooks/StoreContext';
import { findCanonicalUsername } from '../utils/username';
import { normalizeUsername } from '../utils/statsQueries';
import { getSearchSuggestions } from '../utils/searchSuggestions';
import { SrOnly } from './a11y/SrOnly';
import type { DataProps } from '../types';

const SEARCH_DEBOUNCE_MS = 250;

export default function SearchBar({ allUsers }: Pick<DataProps, 'allUsers'>) {
  const { t } = useTranslation();
  const { currentQuery, setCurrentQuery, setSearchDraft } = useStore();
  const [inputValue, setInputValue] = useState('');
  const inputId = useId();
  const hintId = useId();
  const headingId = useId();
  const suggestionsId = useId();

  useEffect(() => {
    const matchedUser = findCanonicalUsername(allUsers, currentQuery);
    const nextValue = matchedUser ?? currentQuery;
    setInputValue(nextValue);
    setSearchDraft(nextValue);
  }, [currentQuery, allUsers, setSearchDraft]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentQuery(inputValue.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [inputValue, setCurrentQuery]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSearchDraft(value);
  };

  const selectSuggestion = useCallback(
    (username: string) => {
      setInputValue(username);
      setCurrentQuery(username);
    },
    [setCurrentQuery],
  );

  const selectFirstSuggestion = useCallback(() => {
    const normalized = normalizeUsername(inputValue);
    if (!normalized) return;

    const match =
      allUsers.find((user) => normalizeUsername(user) === normalized) ??
      allUsers.find((user) => normalizeUsername(user).includes(normalized));

    if (match) {
      selectSuggestion(match);
    }
  }, [allUsers, inputValue, selectSuggestion]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      selectFirstSuggestion();
    }
  };

  const handleClear = () => {
    setInputValue('');
    setSearchDraft('');
    setCurrentQuery('');
  };

  const trimmedInput = inputValue.trim();
  const hasQuery = trimmedInput.length > 0;
  const isExactMatch = Boolean(findCanonicalUsername(allUsers, trimmedInput));

  const suggestions = useMemo(
    () => getSearchSuggestions(allUsers, trimmedInput),
    [allUsers, trimmedInput],
  );

  const showNoMatches = hasQuery && !isExactMatch && suggestions.length === 0;

  return (
    <section className="search-section" aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">
        {t('search.heading')}
      </h2>
      <div className={`search-box${hasQuery ? ' search-box--has-clear' : ''}`}>
        <div className="search-icon search-icon--leading" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <label htmlFor={inputId} className="sr-only">
          {t('search.usernameLabel')}
        </label>
        <input
          type="text"
          id={inputId}
          placeholder={t('search.placeholder')}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={hintId}
        />
        {hasQuery && (
          <button
            type="button"
            className="search-clear"
            aria-label={t('search.clear')}
            onClick={handleClear}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <SrOnly id={hintId}>{t('search.help')}</SrOnly>
      </div>

      {suggestions.length > 0 && (
        <div
          id={suggestionsId}
          className="search-suggestions"
          role="group"
          aria-label={t('search.suggestionsLabel')}
        >
          {suggestions.map((username) => (
            <button
              key={username}
              type="button"
              className="suggestion-pill"
              onClick={() => selectSuggestion(username)}
            >
              {username}
            </button>
          ))}
        </div>
      )}

      {showNoMatches && (
        <p className="search-status" role="status">
          {t('search.noMatches', { query: trimmedInput })}
        </p>
      )}
    </section>
  );
}
