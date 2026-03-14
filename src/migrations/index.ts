import * as migration_20260303_172001 from './20260303_172001'
import * as migration_20260303_212719 from './20260303_212719'
import * as migration_20260303_214307_add_postgis from './20260303_214307_add_postgis'
import * as migration_20260314_171829_merge_jr_collections_and_simplify_users from './20260314_171829_merge_jr_collections_and_simplify_users'

export const migrations = [
  {
    up: migration_20260303_172001.up,
    down: migration_20260303_172001.down,
    name: '20260303_172001',
  },
  {
    up: migration_20260303_212719.up,
    down: migration_20260303_212719.down,
    name: '20260303_212719',
  },
  {
    up: migration_20260303_214307_add_postgis.up,
    down: migration_20260303_214307_add_postgis.down,
    name: '20260303_214307_add_postgis',
  },
  {
    up: migration_20260314_171829_merge_jr_collections_and_simplify_users.up,
    down: migration_20260314_171829_merge_jr_collections_and_simplify_users.down,
    name: '20260314_171829_merge_jr_collections_and_simplify_users',
  },
]
