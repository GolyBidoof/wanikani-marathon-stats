#!/usr/bin/env node
import { rewriteDerivedData, PATHS } from './lib/marathonData.ts';

function main() {
  const shouldBumpLastUpdated = process.argv.includes('--bump-date');
  const syncResult = rewriteDerivedData({ bumpLastUpdated: shouldBumpLastUpdated });

  console.log(`Synced derived data from ${PATHS.allStats}`);
  console.log(`Marathons: ${syncResult.marathonCount}`);
  console.log(`Users: ${syncResult.users.length}`);
  console.log(`GIFs: ${syncResult.gifs.length}`);
  console.log(
    `README link: ${syncResult.readmeLinks.threadLabel} → ${syncResult.readmeLinks.threadUrl}`,
  );
  if (syncResult.missing.length) {
    console.log('\nMissing GIFs:');
    for (const missingGif of syncResult.missing) {
      console.log(`  - ${missingGif.marathon} → public/${missingGif.gif}`);
    }
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
