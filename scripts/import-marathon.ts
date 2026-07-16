#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { marathonNameToGifFilename, parseMarathonTable } from '../src/utils/parseMarathonTable.ts';
import { updateLatestMarathon, upsertMarathon, PATHS } from './lib/marathonData.ts';

function printHelp() {
  console.log(`Add a marathon from a forum results table.

Usage:
  npm run import-marathon -- --name "Summer 2026" --file results.md
  npm run import-marathon -- --name "Summer 2026" --thread-url "https://community.wanikani.com/t/..." --file results.md
  npm run import-marathon -- --name "Summer 2026" --dry-run --file results.md

Options:
  --name <Season Year>   e.g. "Autumn 2025"
  --file <path>          markdown table (or pipe via stdin)
  --thread-url <url>     updates the "latest marathon" link in the site + README
  --dry-run              preview only, don't write files
  --help

Drop the matching GIF in public/ as summer2026.gif (season + year, lowercase, no space).
`);
}

function parseArgs(argv: string[]) {
  const parsedArguments: {
    file: string | null;
    name: string | null;
    threadUrl: string | null;
    dryRun: boolean;
    help: boolean;
  } = { file: null, name: null, threadUrl: null, dryRun: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') parsedArguments.help = true;
    else if (argument === '--dry-run') parsedArguments.dryRun = true;
    else if (argument === '--name') {
      const nameParts: string[] = [];
      while (index + 1 < argv.length && !argv[index + 1].startsWith('-')) {
        nameParts.push(argv[++index]);
      }
      parsedArguments.name = nameParts.join(' ') || null;
    } else if (argument === '--file') parsedArguments.file = argv[++index] ?? null;
    else if (argument === '--thread-url') parsedArguments.threadUrl = argv[++index] ?? null;
    else if (!argument.startsWith('-') && !parsedArguments.file) parsedArguments.file = argument;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return parsedArguments;
}

function readMarkdown(filePath: string | null) {
  if (filePath) return readFileSync(filePath, 'utf8');
  if (process.stdin.isTTY) {
    throw new Error('No --file provided and stdin is a TTY. Pass --file or pipe markdown.');
  }
  return readFileSync(0, 'utf8');
}

function main() {
  const parsedArguments = parseArgs(process.argv.slice(2));
  if (parsedArguments.help) {
    printHelp();
    return;
  }
  if (!parsedArguments.name?.trim()) {
    printHelp();
    throw new Error('--name is required (e.g. --name "Summer 2026")');
  }

  const marathonName = parsedArguments.name.trim();
  const markdown = readMarkdown(parsedArguments.file);
  const { participants, warnings } = parseMarathonTable(markdown);
  const expectedGifFilename = marathonNameToGifFilename(marathonName);

  console.log(`Parsed ${participants.length} participants for "${marathonName}"`);
  if (warnings.length) {
    console.log('\nWarnings:');
    for (const warning of warnings) console.log(`  - ${warning}`);
  }

  if (parsedArguments.dryRun) {
    console.log('\nDry run — sample entries:');
    console.log(JSON.stringify(participants.slice(0, 3), null, 2));
    console.log(`\nWould write marathon to ${PATHS.allStats}`);
    console.log(`Expected GIF: public/${expectedGifFilename}`);
    if (parsedArguments.threadUrl) {
      console.log(`Would set latest marathon thread: ${parsedArguments.threadUrl}`);
    }
    return;
  }

  const syncResult = upsertMarathon(marathonName, participants, {
    bumpLastUpdated: true,
  });

  if (parsedArguments.threadUrl) {
    const latestMarathon = updateLatestMarathon(marathonName, parsedArguments.threadUrl);
    console.log(`\nLatest marathon thread → ${latestMarathon.threadUrl}`);
  }

  console.log(`\nUpdated ${PATHS.allStats}`);
  console.log(`Users: ${syncResult.users.length}`);
  console.log(`GIFs linked: ${syncResult.gifs.length}`);
  if (syncResult.missing.length) {
    console.log('\nMissing GIFs (add under public/ to enable card backgrounds):');
    for (const missingGif of syncResult.missing) {
      console.log(`  - ${missingGif.marathon} → public/${missingGif.gif}`);
    }
  } else {
    console.log(`GIF for this marathon: public/${expectedGifFilename}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`\nError: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
