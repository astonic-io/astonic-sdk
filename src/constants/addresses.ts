import { ChainId } from './../enums'
import { ContractAddressMap } from '../types'

export const addresses: ContractAddressMap = {
  [ChainId.PLQ]: {
    GovernanceFactory: '',
    Airgrab: '0x85e0e288017249da9d7a5778f945ce2c0f28d4ee',
    Emission: '0xc3b728e2a02d3dc894a221635ecf86b578df0a9c',
    AstonicGovernor: '0x0dC26dB9379BDE55fCC534941FCD11D0acCB0Ff2',
    AstonicToken: '0x8f4d86aba1b47832c46f11e0ffd0f7ada4498345',
    TimelockController: '0x38d7c27a7ff2cd9b096059d427d53e6aec9bbec0',
    Locking: '0xfe0f9a17afe240b0b08ca953fbefa6f6053c6fac',
    AstonicRouter: '',
    Broker: '',
    BiPoolManager: '',
    BreakerBox: '',
    Reserve: '',
    ConstantSumPricingModule: '',
    ConstantProductPricingModule: '',
    MedianDeltaBreaker: '',
    ValueDeltaBreaker: '',
    StableToken: '',
    StableTokenEUR: '',
    StableTokenBRL: '',
    StableTokenXOF: '',
    SortedOracles: '',
  },
  [ChainId.ALFAJORES]: {
    GovernanceFactory: '0x96Fe03DBFEc1EB419885a01d2335bE7c1a45e33b',
    Airgrab: '0x8dC9282F0a74A2a36F41440e009AA0EADFe490c5',
    Emission: '0xe62cc88ca2A5E7Dd3Fe5ce8511C874e610Ddb0b6',
    AstonicGovernor: '0x558e92236f85Bb4e8A63ec0D5Bf9d34087Eab744',
    AstonicToken: '0x3eDd2f7c90e2E931c817a44302Af7112E84be6Cc',
    TimelockController: '0xa0Ad8DD40104556122c21dF50eD14bb1B53A3338',
    Locking: '0x537CaE97C588C6DA64A385817F3D3563DDCf0591',
    AstonicRouter: '0xe6101a457a69b53e298e35a7f6e3dcb0390df02a',
    Broker: '0xD3Dff18E465bCa6241A244144765b4421Ac14D09',
    BiPoolManager: '0x9B64E8EaBD1a035b148cE970d3319c5C3Ad53EC3',
    BreakerBox: '0xC76BDf0AFb654888728003683cf748A8B1b4f5fD',
    Reserve: '0xa7ed835288Aa4524bB6C73DD23c0bF4315D9Fe3e',
    ConstantSumPricingModule: '0x474DBf1eDF845410bdaC6aeE97C3CC403651ba2E',
    ConstantProductPricingModule: '0x99EDce8143FF8AeFA1fBB6C2103B349Add2B9519',
    MedianDeltaBreaker: '0x6B0a2076713fDAef4F9301fe8404a228e3682DE4',
    ValueDeltaBreaker: '0xfa6fFf746a5E74055e432f3bba26138956AEfbFe',
    StableToken: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    StableTokenEUR: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    StableTokenBRL: '0xE4D517785D091D3c54818832dB6094bcc2744545',
    StableTokenXOF: '0xB0FA15e002516d0301884059c0aaC0F0C72b019D',
    SortedOracles: '0xFdd8bD58115FfBf04e47411c1d228eCC45E93075',
  },
  [ChainId.BAKLAVA]: {
    GovernanceFactory: '0xe23A28a92B95c743fC0F09c16a6b2E6D59F234Fa',
    Airgrab: '0xNotDeployed',
    Emission: '0xNotDeployed',
    AstonicGovernor: '0xf1873597aA9757f57BA8Ed84a3EDb2E3217EF09f',
    AstonicToken: '0x8942330eCB5A6c808aac3Aec3C6aab6D8CF436FE',
    TimelockController: '0x8c045769087F9de69B70949ED7fC23c14Db71e20',
    Locking: '0x1E15b108c51a0cAEAFf1a0E6f27A853Bde1AA2e6',
    AstonicRouter: '0xC5449dbB0aF89F5E3C8E0e1611966E1964F891b1',
    Broker: '0x6723749339e320E1EFcd9f1B0D997ecb45587208',
    BiPoolManager: '0xFF9a3da00F42839CD6D33AD7adf50bCc97B41411',
    BreakerBox: '0x5Ea5A5F694F10de979BEeC7b8041E9f931F54bc7',
    Reserve: '0x68Dd816611d3DE196FDeb87438B74A9c29fd649f',
    ConstantSumPricingModule: '0x2901da88dd444a3c41AF51696548DEe3524Cf8Dc',
    ConstantProductPricingModule: '0x7586680Dd2e4F977C33cDbd597fa2490e342CbA2',
    MedianDeltaBreaker: '0x286a8137EE9EE6dE8B5e5be334706fA812400994',
    ValueDeltaBreaker: '0xf631F58b1B51E99dF3Ad1CE18f5C42ab41e4A17a',
    StableToken: '0x62492A644A588FD904270BeD06ad52B9abfEA1aE',
    StableTokenEUR: '0xf9ecE301247aD2CE21894941830A2470f4E774ca',
    StableTokenBRL: '0x6a0EEf2bed4C30Dc2CB42fe6c5f01F80f7EF16d1',
    StableTokenXOF: '0x64c1D812673E93Bc036AdC3D547d9950696DA5Af',
    SortedOracles: '0x88A187a876290E9843175027902B9f7f1B092c88',
  },
}

export type Identifier = keyof ContractAddressMap[keyof ContractAddressMap]

export function getAddress(identifier: Identifier, chainId: number): string {
  const addressesForChain = addresses[chainId]
  if (!addressesForChain) {
    throw new Error(`No addresses found for chain ID ${chainId}`)
  }

  const address = addressesForChain[identifier]
  if (!address) {
    throw new Error(
      `Address not found for identifier ${identifier} on chain ID ${chainId}`
    )
  }

  return address
}
