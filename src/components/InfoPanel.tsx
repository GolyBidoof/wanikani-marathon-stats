import { useId, useState } from 'react';
import { SITE } from '../constants';

export default function InfoPanel() {
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
        {isOpen ? 'Hide info' : 'What is this?'}
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
            <p>
              The <strong>24-hour Readathon</strong> is a community event on the WaniKani forums,
              now organized by <strong>soggyboy</strong>. <strong>Taiyousea</strong> originally
              started and hosted the marathon for 8 instances! Participants attempt to read as much
              Japanese as they can within a 24-hour period, tracking pages, characters, or time.
              Participants then report their final numbers to the community. These stats are then
              tallied together to celebrate what we can accomplish as a group!
            </p>
            <p>
              Whether you&apos;re finishing a book club pick or just squeezing in a few pages, every
              contribution boosts our collective averages.
            </p>
            <a
              href={SITE.latestMarathon.threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              Join the discussion on the WaniKani Forums!
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
