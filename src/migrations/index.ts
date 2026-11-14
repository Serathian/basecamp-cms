import * as migration_20261005_091006_clean_slate_initial_schema from './20261005_091006_clean_slate_initial_schema';
import * as migration_20261011_110908_add_nitf_collections from './20261011_110908_add_nitf_collections';
import * as migration_20261025_090908_fix_dispatches from './20261025_090908_fix_dispatches';
import * as migration_20261025_173500_add_location_capacity_fields from './20261025_173500_add_location_capacity_fields';
import * as migration_20261025_175000_add_location_parking_amenity from './20261025_175000_add_location_parking_amenity';
import * as migration_20261025_181200_add_dispatch_date_range from './20261025_181200_add_dispatch_date_range';
import * as migration_20261025_190500_add_dispatch_loadout from './20261025_190500_add_dispatch_loadout';
import * as migration_20261025_193200_add_dispatch_gpx_and_trail_geometry from './20261025_193200_add_dispatch_gpx_and_trail_geometry';

export const migrations = [
  {
    up: migration_20261005_091006_clean_slate_initial_schema.up,
    down: migration_20261005_091006_clean_slate_initial_schema.down,
    name: '20261005_091006_clean_slate_initial_schema',
  },
  {
    up: migration_20261011_110908_add_nitf_collections.up,
    down: migration_20261011_110908_add_nitf_collections.down,
    name: '20261011_110908_add_nitf_collections',
  },
  {
    up: migration_20261025_090908_fix_dispatches.up,
    down: migration_20261025_090908_fix_dispatches.down,
    name: '20261025_090908_fix_dispatches',
  },
  {
    up: migration_20261025_173500_add_location_capacity_fields.up,
    down: migration_20261025_173500_add_location_capacity_fields.down,
    name: '20261025_173500_add_location_capacity_fields',
  },
  {
    up: migration_20261025_175000_add_location_parking_amenity.up,
    down: migration_20261025_175000_add_location_parking_amenity.down,
    name: '20261025_175000_add_location_parking_amenity',
  },
  {
    up: migration_20261025_181200_add_dispatch_date_range.up,
    down: migration_20261025_181200_add_dispatch_date_range.down,
    name: '20261025_181200_add_dispatch_date_range',
  },
  {
    up: migration_20261025_190500_add_dispatch_loadout.up,
    down: migration_20261025_190500_add_dispatch_loadout.down,
    name: '20261025_190500_add_dispatch_loadout',
  },
  {
    up: migration_20261025_193200_add_dispatch_gpx_and_trail_geometry.up,
    down: migration_20261025_193200_add_dispatch_gpx_and_trail_geometry.down,
    name: '20261025_193200_add_dispatch_gpx_and_trail_geometry'
  },
];
