import { BigNumberish, providers } from 'ethers'
import { AstonicGovernor__factory } from '@astonic-io/astonic-bindings-ts'

import { Governance } from './governance'
import { TestChainClient } from './TestChainClient'
import { ProposalState } from './enums'

jest.mock('./utils', () => {
  return {
    validateSignerOrProvider: jest.fn(),
  }
})

jest.mock('@astonic-io/astonic-bindings-ts', () => {
  return {
    AstonicGovernor__factory: jest.fn(),
  }
})

describe('Governance', () => {
  let testee: Governance
  let mockChainClient: TestChainClient

  const mockAstonicGovernor = {
    address: 'fakeAstonicGovernorAddress',
    populateTransaction: {
      'propose(address[],uint256[],bytes[],string)': jest.fn(),
      'queue(uint256)': jest.fn(),
      execute: jest.fn(),
      castVote: jest.fn(),
      cancel: jest.fn(),
      'execute(uint256)': jest.fn(),
    },
    functions: {
      state: jest.fn(),
    },
    signer: {
      populateTransaction: jest.fn(),
    },
  }
  // @ts-ignore
  AstonicGovernor__factory.connect = jest.fn().mockReturnValue(mockAstonicGovernor)

  beforeEach(async () => {
    mockChainClient = new TestChainClient()
    testee = new Governance(mockChainClient)
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should return a Governance instance using a signer or provider', async () => {
      const governance = await new Governance(
        new providers.JsonRpcProvider('http://localhost:8545')
      )
      expect(governance).toBeDefined()
      expect(governance).toBeInstanceOf(Governance)
    })
  })

  describe('createProposal', () => {
    it('should throw an error when targets is zero', async () => {
      const targets: string[] = []
      const values = [0]
      const calldatas = ['0x']
      const description = 'test'

      expect(async () => {
        await testee.createProposal(targets, values, calldatas, description)
      }).rejects.toThrow('Targets must be specified')
    })

    it('should throw an error when values are not specified', async () => {
      const targets = ['0x']
      const values: BigNumberish[] = []
      const calldatas = ['0x']
      const description = 'test'

      expect(async () => {
        await testee.createProposal(targets, values, calldatas, description)
      }).rejects.toThrow('Values must be specified')
    })

    it('should throw an error when calldatas are not specified', async () => {
      const targets = ['0x']
      const values = [0]
      const calldatas: string[] = []
      const description = 'test'

      expect(async () => {
        await testee.createProposal(targets, values, calldatas, description)
      }).rejects.toThrow('Calldatas must be specified')
    })

    it('should throw an error when description is not specified', async () => {
      const targets = ['0x']
      const values = [0]
      const calldatas = ['0x']
      const description = ''

      expect(async () => {
        await testee.createProposal(targets, values, calldatas, description)
      }).rejects.toThrow('Description must be specified')
    })

    it('should return a populated create proposal transaction', async () => {
      const targets = ['0x']
      const values = [0]
      const calldatas = ['0x']
      const description = 'test'

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockAstonicGovernor.populateTransaction[
        'propose(address[],uint256[],bytes[],string)'
      ].mockReturnValue(fakeTxObj)
      const spy = jest
        .spyOn(mockChainClient, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.createProposal(
        targets,
        values,
        calldatas,
        description
      )

      expect(result).toEqual(fakePopulatedTxObj)
      expect(
        mockAstonicGovernor.populateTransaction[
          'propose(address[],uint256[],bytes[],string)'
        ]
      ).toHaveBeenCalledTimes(1)
      expect(
        mockAstonicGovernor.populateTransaction[
          'propose(address[],uint256[],bytes[],string)'
        ]
      ).toHaveBeenCalledWith(targets, values, calldatas, description)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)

      expect(mockChainClient.populateTransaction).toHaveBeenCalledTimes(1)
      expect(mockChainClient.populateTransaction).toHaveBeenCalledWith(
        fakeTxObj
      )
    })
  })

  describe('queueProposal', () => {
    it('should return a populated queue proposal transaction', async () => {
      const proposalId = 1

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockAstonicGovernor.populateTransaction['queue(uint256)'].mockReturnValue(
        fakeTxObj
      )
      const spy = jest
        .spyOn(mockChainClient, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.queueProposal(proposalId)

      expect(result).toEqual(fakePopulatedTxObj)
      expect(
        mockAstonicGovernor.populateTransaction['queue(uint256)']
      ).toHaveBeenCalledTimes(1)
      expect(
        mockAstonicGovernor.populateTransaction['queue(uint256)']
      ).toHaveBeenCalledWith(proposalId)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)

      expect(mockChainClient.populateTransaction).toHaveBeenCalledTimes(1)
      expect(mockChainClient.populateTransaction).toHaveBeenCalledWith(
        fakeTxObj
      )
    })
  })

  describe('executeProposal', () => {
    it('should return a populated execute proposal transaction', async () => {
      const proposalId = 1

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockAstonicGovernor.populateTransaction['execute(uint256)'].mockReturnValue(
        fakeTxObj
      )
      const spy = jest
        .spyOn(mockChainClient, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.executeProposal(proposalId)

      expect(result).toEqual(fakePopulatedTxObj)
      expect(
        mockAstonicGovernor.populateTransaction['execute(uint256)']
      ).toHaveBeenCalledTimes(1)
      expect(
        mockAstonicGovernor.populateTransaction['execute(uint256)']
      ).toHaveBeenCalledWith(proposalId)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)

      expect(mockChainClient.populateTransaction).toHaveBeenCalledTimes(1)
      expect(mockChainClient.populateTransaction).toHaveBeenCalledWith(
        fakeTxObj
      )
    })
  })

  describe('castVote', () => {
    it('should return a populated cast vote transaction', async () => {
      const proposalId = 1
      const support = 1

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockAstonicGovernor.populateTransaction.castVote.mockReturnValue(fakeTxObj)
      const spy = jest
        .spyOn(mockChainClient, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.castVote(proposalId, support)

      expect(result).toEqual(fakePopulatedTxObj)
      expect(
        mockAstonicGovernor.populateTransaction.castVote
      ).toHaveBeenCalledTimes(1)
      expect(
        mockAstonicGovernor.populateTransaction.castVote
      ).toHaveBeenCalledWith(proposalId, support)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)

      expect(mockChainClient.populateTransaction).toHaveBeenCalledTimes(1)
      expect(mockChainClient.populateTransaction).toHaveBeenCalledWith(
        fakeTxObj
      )
    })
  })

  describe('cancelProposal', () => {
    it('should return a populated cancel proposal transaction', async () => {
      const proposalId = 1

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockAstonicGovernor.populateTransaction.cancel.mockReturnValue(fakeTxObj)
      const spy = jest
        .spyOn(mockChainClient, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.cancelProposal(proposalId)

      expect(result).toEqual(fakePopulatedTxObj)
      expect(
        mockAstonicGovernor.populateTransaction.cancel
      ).toHaveBeenCalledTimes(1)
      expect(mockAstonicGovernor.populateTransaction.cancel).toHaveBeenCalledWith(
        proposalId
      )
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)

      expect(mockChainClient.populateTransaction).toHaveBeenCalledTimes(1)
      expect(mockChainClient.populateTransaction).toHaveBeenCalledWith(
        fakeTxObj
      )
    })
  })

  describe('getProposalState', () => {
    it('should return the state of the proposal', async () => {
      const proposalId = 1
      const fakeProposalState = [1]

      mockAstonicGovernor.functions.state.mockReturnValue(fakeProposalState)

      const result = await testee.getProposalState(proposalId)

      expect(result).toEqual(ProposalState[fakeProposalState[0]])
      expect(mockAstonicGovernor.functions.state).toHaveBeenCalledTimes(1)
      expect(mockAstonicGovernor.functions.state).toHaveBeenCalledWith(proposalId)
    })
  })
})
