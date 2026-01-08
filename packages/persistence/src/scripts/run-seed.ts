import { seed, type SeedSource } from '../seed'

const validSources: SeedSource[] = ['default', 'full']
const arg = process.argv[2] as SeedSource | undefined
const source: SeedSource = arg && validSources.includes(arg) ? arg : 'default'

if (arg && !validSources.includes(arg)) {
  console.warn(`Unknown seed source "${arg}", falling back to "default". Valid: ${validSources.join(', ')}`)
}

await seed(source)
