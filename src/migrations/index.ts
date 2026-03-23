import * as migration_20260301_000000_initial_schema from './20260301_000000_initial_schema';
import * as migration_20260303_214307_add_postgis from './20260303_214307_add_postgis';

export const migrations = [
  {
    up: migration_20260301_000000_initial_schema.up,
    down: migration_20260301_000000_initial_schema.down,
    name: '20260301_000000_initial_schema',
  },
  {
    up: migration_20260303_214307_add_postgis.up,
    down: migration_20260303_214307_add_postgis.down,
    name: '20260303_214307_add_postgis',
  },
];
