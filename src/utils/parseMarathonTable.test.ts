import { describe, expect, it } from 'vitest';
import {
  isSummaryRow,
  marathonNameToGifFilename,
  parseBadgeCell,
  parseMarathonTable,
  parseNumericCell,
  parseTimeCell,
  parseUserCell,
  splitTableRow,
} from './parseMarathonTable';

describe('parseUserCell', () => {
  it('parses plain usernames', () => {
    expect(parseUserCell('Ditto20')).toEqual({ user: 'Ditto20' });
  });

  it('parses markdown links into user and url', () => {
    expect(parseUserCell('[Akashelia](https://community.wanikani.com/t/x/74572/408)')).toEqual({
      user: 'Akashelia',
      url: 'https://community.wanikani.com/t/x/74572/408',
    });
  });
});

describe('parseTimeCell', () => {
  it('normalizes short and full times to HH:MM:SS', () => {
    expect(parseTimeCell('8:27')).toEqual({ time: '08:27:00' });
    expect(parseTimeCell('9:05:12')).toEqual({ time: '09:05:12' });
    expect(parseTimeCell('05:09')).toEqual({ time: '05:09:00' });
  });

  it('omits empty time cells', () => {
    expect(parseTimeCell('')).toEqual({});
    expect(parseTimeCell('-')).toEqual({});
  });
});

describe('parseNumericCell', () => {
  it('parses plain numbers and thousands suffixes', () => {
    expect(parseNumericCell('89', 'pages')).toEqual({ value: 89 });
    expect(parseNumericCell('82.8k', 'characters')).toEqual({ value: 82800 });
    expect(parseNumericCell('16k', 'characters')).toEqual({ value: 16000 });
  });

  it('omits empty markers and warns on ranges', () => {
    expect(parseNumericCell('-', 'pages')).toEqual({});
    expect(parseNumericCell('n/a', 'characters')).toEqual({});
    expect(parseNumericCell('5-6', 'sources')).toEqual({
      value: 6,
      warning: 'sources range "5-6" → using 6',
    });
  });
});

describe('parseMarathonTable', () => {
  it('parses a mixed markdown results table', () => {
    const markdown = `
| User | Time | Pages | Characters | Sources |  |
|----|---:|---:|---:|---:|----|
| [Akashelia](https://community.wanikani.com/t/x/74572/408) | 8:27 |  | 82.8k | 1 |  |
| Ditto20 | 4:42 |  | 81.2k | 1 |  |
| Cathm2 | 3:00 | 89 |  | 4 |  |
| [malinkal](https://community.wanikani.com/t/2026-summer-solstice-24-hour-readathon/74572/438) | 9:05:12 | 514 |  | 3 |  |
| RebBlue | 05:09 | 450 |  | 9 |
`;

    const { participants, warnings } = parseMarathonTable(markdown);

    expect(warnings).toEqual([]);
    expect(participants).toEqual([
      {
        user: 'Akashelia',
        url: 'https://community.wanikani.com/t/x/74572/408',
        time: '08:27:00',
        characters: 82800,
        sources: 1,
      },
      {
        user: 'Ditto20',
        time: '04:42:00',
        characters: 81200,
        sources: 1,
      },
      {
        user: 'Cathm2',
        time: '03:00:00',
        pages: 89,
        sources: 4,
      },
      {
        user: 'malinkal',
        url: 'https://community.wanikani.com/t/2026-summer-solstice-24-hour-readathon/74572/438',
        time: '09:05:12',
        pages: 514,
        sources: 3,
      },
      {
        user: 'RebBlue',
        time: '05:09:00',
        pages: 450,
        sources: 9,
      },
    ]);
  });

  it('skips tally rows such as Total and Goal', () => {
    const markdown = `
| User | Time | Pages | Characters | Sources |  |
|----|---:|---:|---:|---:|----|
| Ditto20 | 5:00:00 |  | 81253 | 1 |  |
| **Total**: | 5:00:00 |  | 81253 | 1 |  |
| **Goal 1**: | ~~213:11:00~~ | ~~7396~~ | 555.4k |  |  |
| **Goal 2**: | 318:45:00 | 12905 | 664.2k |  |  |
| Cathm2 | 5:00:00 | 113 |  | 3 |  |
`;

    const { participants, warnings } = parseMarathonTable(markdown);

    expect(warnings).toEqual([]);
    expect(participants.map((participant) => participant.user)).toEqual(['Ditto20', 'Cathm2']);
  });
});

describe('isSummaryRow', () => {
  it('recognizes total and goal markers', () => {
    expect(isSummaryRow(['**Total**:', '313:01:45', '11588'])).toBe(true);
    expect(isSummaryRow(['Total', '313:01:45', '11588'])).toBe(true);
    expect(isSummaryRow(['**Goal 2**:', '318:45:00'])).toBe(true);
    expect(isSummaryRow(['Ditto20', '5:00:00'])).toBe(false);
  });
});

describe('parseBadgeCell', () => {
  it('keeps shortcodes and literal emoji', () => {
    expect(parseBadgeCell(':ram:')).toEqual({ emoji: ':ram:' });
    expect(parseBadgeCell('🐧')).toEqual({ emoji: '🐧' });
    expect(parseBadgeCell(':herb: :strawberry:')).toEqual({ emoji: ':herb: :strawberry:' });
  });

  it('maps an inline image to a local badges/ path', () => {
    expect(
      parseBadgeCell(
        '![trunky_rolling\\|690x448, 7%](https://global.discourse-cdn.com/x/031c6cea.gif)',
      ),
    ).toEqual({ emojiImage: 'badges/trunky_rolling.gif' });
  });

  it('treats empty and non-emoji cells as no badge', () => {
    expect(parseBadgeCell('')).toEqual({});
    expect(parseBadgeCell('-')).toEqual({});
    expect(parseBadgeCell('trunky')).toEqual({});
  });
});

describe('splitTableRow', () => {
  it('keeps escaped pipes inside a single cell', () => {
    const cells = splitTableRow(
      '|trunklayer | 04:05:00 | 79 |  | 3 | ![trunky_rolling\\|690x448](https://cdn/x.gif) |  |  |',
    );
    expect(cells?.[5]).toBe('![trunky_rolling\\|690x448](https://cdn/x.gif)');
  });
});

describe('marathonNameToGifFilename', () => {
  it('maps marathon names to public gif filenames', () => {
    expect(marathonNameToGifFilename('Summer 2026')).toBe('summer2026.gif');
    expect(marathonNameToGifFilename('Autumn 2025')).toBe('autumn2025.gif');
  });
});
