import { Astonic } from '../src/astonic'
import { providers } from 'ethers'

async function main() {
  const provider = new providers.JsonRpcProvider(
    'https://evm-atlas.planq.network'
  )
  const astonic = await Astonic.create(provider)

  const aUSDPlanqExchange =
    '0x3135b662c38265d0655177091f1b647b4fef511103d06c016efdf18b46930d2c'

  const cfgs = await astonic.getTradingLimitConfig(aUSDPlanqExchange)
  const state = await astonic.getTradingLimitState(aUSDPlanqExchange)
  const limits = await astonic.getTradingLimits(aUSDPlanqExchange)

  console.log('cfgs', cfgs)
  console.log('state', state)
  console.log('======')
  console.log('limits', limits)
}

main()
  .then(() => console.log('Done'))
  .catch((e) => console.error('Error:', e))
