import { providers } from 'ethers'
import { Astonic } from '../src/astonic'

async function main() {
  const provider = new providers.JsonRpcProvider(
    'https://evm-atlas.planq.network'
  )
  const astonic = await Astonic.create(provider)
  const broker = astonic.getBroker()
  console.log('Broker:\n================')
  console.log(broker.address, '\n')
  const exchangeProviders = await broker.getExchangeProviders()
  console.log('Exchange Providers:\n================')
  console.log(exchangeProviders, '\n')
  const exchanges = await astonic.getExchanges()
  console.log('Exchanges:\n================')
  console.log(exchanges, '\n')
}

main()
  .then(() => console.log('Done'))
  .catch((e) => console.error('Error:', e))
