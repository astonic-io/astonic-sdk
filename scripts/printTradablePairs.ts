import { providers } from 'ethers'
import { Astonic } from '../src/astonic'

const rpcUrls: Record<number, string> = {
  7070: 'https://evm-rpc.planq.network',
  7077: 'https://evm-atlas.planq.network',
  44787: 'https://alfajores-forno.planq-testnet.org',
}

async function main() {
  // Expect the chain id as the first command-line argument.
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error('Usage: ts-node printTradablePairs.ts <chainId>')
    process.exit(1)
  }

  const chainId = Number(args[0])
  if (!rpcUrls[chainId]) {
    console.error(
      `Chain id ${chainId} not supported. Supported chain ids: ${Object.keys(
        rpcUrls
      ).join(', ')}`
    )
    process.exit(1)
  }

  const rpcUrl = rpcUrls[chainId]
  const provider = new providers.JsonRpcProvider(rpcUrl)

  // Create a Astonic instance using the provider
  const astonic = await Astonic.create(provider)

  // Optional: verify that the provider's network matches the requested chain id.
  const network = await provider.getNetwork()
  if (network.chainId !== chainId) {
    console.warn(
      `Warning: provider network chain id (${network.chainId}) does not match requested chain id (${chainId})`
    )
  }

  // Fetch cached tradable pairs
  const pairs = await astonic.getTradablePairsWithPath()

  console.log(`Tradable pairs for chain ${chainId}:\n`)
  for (const pair of pairs) {
    const [asset1, asset2] = pair.assets
    console.log(`${pair.id}:`)
    console.log(`  Assets:`)
    console.log(`    ${asset1.symbol}: ${asset1.address}`)
    console.log(`    ${asset2.symbol}: ${asset2.address}`)
    console.log(`  Exchange Path:`)
    for (const hop of pair.path) {
      console.log(`    Provider: ${hop.providerAddr}`)
      console.log(`    Exchange ID: ${hop.id}`)
      console.log(`    Assets: ${hop.assets[0]} -> ${hop.assets[1]}`)
      console.log()
    }
    console.log('---')
  }
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
