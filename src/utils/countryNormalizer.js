import countryMetadata from '../data/country-metadata.json'

// Build lookup map once at module load time: any known string → ISO3
const lookupMap = new Map()

for (const entry of countryMetadata) {
  const add = (val) => {
    if (val != null) lookupMap.set(String(val).toLowerCase().trim(), entry.iso3)
  }
  add(entry.iso3)
  add(entry.iso2)
  add(entry.name)
  entry.nameVariants?.forEach(add)
}

/**
 * Convert any country string a user might put in a CSV to an ISO3 code.
 * Case-insensitive, whitespace-trimmed. Returns null when no match found.
 */
export function normalizeCountry(input) {
  if (input == null) return null
  const key = String(input).toLowerCase().trim()
  return key ? (lookupMap.get(key) ?? null) : null
}

/** Reverse lookup: ISO3 → display name */
export function getCountryName(iso3) {
  const entry = countryMetadata.find(c => c.iso3 === iso3)
  return entry?.name ?? iso3
}

/** ISO3 → region string */
export function getCountryRegion(iso3) {
  const entry = countryMetadata.find(c => c.iso3 === iso3)
  return entry?.region ?? null
}

/**
 * Factory for building a normalizer from arbitrary metadata (useful in tests
 * or when the caller provides custom metadata outside the bundled JSON).
 */
export function buildNormalizer(metadata) {
  const map = new Map()
  for (const entry of metadata) {
    const add = (val) => val != null && map.set(String(val).toLowerCase().trim(), entry.iso3)
    add(entry.iso3)
    add(entry.iso2)
    add(entry.name)
    entry.nameVariants?.forEach(add)
  }
  return (input) => {
    if (input == null) return null
    const key = String(input).toLowerCase().trim()
    return key ? (map.get(key) ?? null) : null
  }
}
