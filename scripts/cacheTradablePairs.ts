const rpcUrls = {
  7070: 'https://evm-rpc.planq.network',
  7077: 'https://evm-atlas.planq.network',
  44787: 'https://alfajores-forno.planq-testnet.org',
}

import { providers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { Astonic } from '../src/astonic'

async function getTradablePairsForNetwork(rpcUrl: string) {
  const provider = new providers.JsonRpcProvider(rpcUrl)
  const astonic = await Astonic.create(provider)

  // We want to fetch the pairs from the network, not from the cache.
  return await astonic.getTradablePairsWithPath({ cached: false })
}

async function main() {
  const results: Record<number, any> = {}

  // Get pairs for each network
  for (const [chainId, rpcUrl] of Object.entries(rpcUrls)) {
    console.log(`Fetching pairs for chain ${chainId}...`)
    try {
      results[Number(chainId)] = await getTradablePairsForNetwork(rpcUrl)
    } catch (e) {
      console.error(`Error fetching pairs for chain ${chainId}:`, e)
    }
  }

  // Generate TypeScript file content
  const fileContent = `// THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY.
import { TradablePair } from '../astonic'

export const TRADABLE_PAIRS: Record<number, TradablePair[]> = ${JSON.stringify(
    results,
    null,
    2
  )};

export function getCachedTradablePairs(chainId: number): TradablePair[] | undefined {
  return TRADABLE_PAIRS[chainId]
}
`

  // Ensure constants directory exists
  const constantsDir = path.join(__dirname, '../src/constants')
  if (!fs.existsSync(constantsDir)) {
    fs.mkdirSync(constantsDir, { recursive: true })
  }

  // Write the file
  const filePath = path.join(constantsDir, 'tradablePairs.ts')
  fs.writeFileSync(filePath, fileContent)
  console.log(`Generated ${filePath}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
