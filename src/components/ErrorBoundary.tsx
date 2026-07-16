import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main id="main-content" className="container error-boundary">
          <h1>{i18n.t('errors.unexpectedTitle')}</h1>
          <p className="error-boundary-message">{i18n.t('errors.unexpectedMessage')}</p>
          <div className="error-boundary-actions">
            <button type="button" className="action-btn" onClick={this.handleRetry}>
              {i18n.t('errors.tryAgain')}
            </button>
            <button
              type="button"
              className="action-btn action-btn-secondary"
              onClick={() => window.location.reload()}
            >
              {i18n.t('errors.reloadPage')}
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
