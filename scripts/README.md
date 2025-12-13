# Scripts

Utility scripts for managing Keno Stats data.

## migrate-data.js

Migrates old Keno history data format to the new format required by the extension.

### Data Formats

**Old format** (before pattern analysis update):

```json
{
  "hits": [5, 12, 20],
  "misses": [3, 8, 15, 22, 30],
  "time": 1765306547633
}
```

**New format** (current):

```json
{
  "hits": [5, 12, 20],
  "misses": [3, 8, 15, 22, 30],
  "drawn": [3, 5, 8, 12, 15, 20, 22, 30],
  "selected": [5, 10, 12, 17, 20],
  "time": 1765306547633
}
```

### Usage

```bash
# View help
node scripts/migrate-data.js --help

# Migrate and overwrite (creates backup automatically)
node scripts/migrate-data.js data/old-history.json

# Migrate to new file
node scripts/migrate-data.js data/old-history.json data/new-history.json

# Migrate all JSON files in data folder
for file in data/*.json; do node scripts/migrate-data.js "$file"; done
```

### Important Notes

⚠️ **Data Loss Warning**: The migration script can only partially reconstruct the `selected` array from old format data:

- `drawn` array is reconstructed as `hits + misses` (accurate)
- `selected` array is reconstructed as `hits` only (incomplete - we don't know which numbers were selected but didn't hit)

This means:

- ✅ Pattern analysis will work (uses `drawn` numbers)
- ✅ Heatmap will work (uses `hits` and `misses`)
- ⚠️ Stats multiplier bar accuracy may be reduced (uses `selected` vs `drawn` comparison)

If you have the original full bet data, it's recommended to re-export from the extension rather than using migration.

### Backup

The script automatically creates a timestamped backup when overwriting:

```
data/history.json              → original migrated
data/history.json.backup-1765396076660  → automatic backup
```
