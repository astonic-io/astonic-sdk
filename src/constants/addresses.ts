import { ChainId } from './../enums'
import { ContractAddressMap } from '../types'

export const addresses: ContractAddressMap = {
  [ChainId.CELO]: {
    GovernanceFactory: '',
    Airgrab: '',
    Emission: '',
    MentoGovernor: '',
    MentoToken: '',
    TimelockController: '',
    Locking: '',
  },
  [ChainId.ALFAJORES]: {
    GovernanceFactory: '0xD4079B322c392D6b196f90AA4c439fC2C16d6770',
    Airgrab: '0x281fA47f59456fA04DF699539fA4b1F25e7769A3',
    Emission: '0x8D1267bFf3f8166AEB2B58217b74188d1fe326f3',
    MentoGovernor: '0x84382a356c1Dc6ada21997E64dc72e5a7AcF5826',
    MentoToken: '0x53De3F938c64baB8C621c8A3C5000b385afE2404',
    TimelockController: '0x2AFC4a1e7928Fb3bfC81076740d3142FF8B1DE05',
    Locking: '0x65a1271ce7B2ec8D564A4Bc752E13A36a46e81B8',
  },
  [ChainId.BAKLAVA]: {
    GovernanceFactory: '0x77645271665AdDF195202dEf1ad3cA678B442411',
    Airgrab: '0x349aa8910577A6fE16cA7b98b5A135d14CE4dF9f',
    Emission: '0xcd427DDB27D835E5353312e7897bb9ad35F0E214',
    MentoGovernor: '0x5dFE8CC7743C636a86bED8F8d0de982d502E22fC',
    MentoToken: '0xD2f4f160BAF7D88a7A9189b03D0B3AA6A5D9775B',
    TimelockController: '0xb5977b1d208ef35FAf97A9534Dd849c356F362C5',
    Locking: '0x831DAfC0912e1c2aBa2Da90668c0856d48a8C06b',
  },
}
