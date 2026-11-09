import rawData from '../src/cyberpunk_2077_build_db_v2.json';
import { CyberpunkBuildDatabaseSchema } from './schema';

const result = CyberpunkBuildDatabaseSchema.safeParse(rawData);

if (!result.success) {
  console.error('Invalid build data:', JSON.stringify(result.error.format(), null, 2));
  // Non-zero exit fails the CI run so a broken DB never ships.
  process.exit(1);
}

const validData = result.data;
console.log(
  `OK: ${validData.presets.length} presets, ${validData.skillTracks.length} skill tracks, ` +
    `${validData.chromeCapacity.items.length} chrome items (${validData.meta.version}).`,
);
