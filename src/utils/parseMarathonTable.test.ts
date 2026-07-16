import { describe, expect, it } from 'vitest';
import {
  marathonNameToGifFilename,
  parseMarathonTable,
  parseNumericCell,
  parseTimeCell,
  parseUserCell,
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
});

describe('marathonNameToGifFilename', () => {
  it('maps marathon names to public gif filenames', () => {
    expect(marathonNameToGifFilename('Summer 2026')).toBe('summer2026.gif');
    expect(marathonNameToGifFilename('Autumn 2025')).toBe('autumn2025.gif');
  });
});
