import { BigNumberish, Signer, providers } from 'ethers'
import {
  AstonicGovernor,
  AstonicGovernor__factory,
} from '@astonic-io/astonic-bindings-ts'
import { ChainClient } from './ChainClient'
import { TestChainClient } from './TestChainClient'
import { ProposalState } from './enums'
import { IChainClient } from './interfaces'
import { addresses } from './constants'

export class Governance {
  private chainClient: IChainClient

  constructor(chainClient: IChainClient)
  constructor(signerOrProvider: Signer | providers.Provider)
  constructor(arg: Signer | providers.Provider | IChainClient) {
    // TODO: Remove use of TestChainClient in future this is only meant for testing
    if (arg instanceof ChainClient || arg instanceof TestChainClient) {
      this.chainClient = arg
    } else if (Signer.isSigner(arg) || providers.Provider.isProvider(arg)) {
      this.chainClient = new ChainClient(arg)
    } else {
      throw new Error('Invalid constructor argument')
    }
  }

  /**
   * This function retrieves the AstonicGovernor contract.
   * @returns The AstonicGovernor contract.
   */
  public async getGovernorContract(): Promise<AstonicGovernor> {
    const chainId = await this.chainClient.getChainId()

    const contracts = addresses[chainId]
    if (!contracts) {
      throw new Error(
        `Contracts not deployed on network with chain id ${chainId}`
      )
    }

    const astonicGovernorAddress = contracts.AstonicGovernor

    return AstonicGovernor__factory.connect(
      astonicGovernorAddress,
      await this.chainClient.getSigner()
    )
  }

  /**
   * Generates a transaction that submits a proposal to be created to the Astonic Governor contract using the specified values.
   * @param targets The addresses of the contracts to be called during proposal execution.
   * @param values The values to be passed to the calls to the target contracts.
   * @param calldatas The calldata to be passed to the calls to the target contracts.
   * @param description A human readable description of the proposal.
   * @returns The transaction request.
   */
  public async createProposal(
    targets: string[],
    values: BigNumberish[],
    calldatas: string[],
    description: string
  ): Promise<providers.TransactionRequest> {
    this.validateProposalArgs(targets, values, calldatas, description)
    const governor = await this.getGovernorContract()

    const tx = await governor.populateTransaction[
      'propose(address[],uint256[],bytes[],string)'
    ](targets, values, calldatas, description)

    return await this.chainClient.populateTransaction(tx)
  }

  /**
   * Generates a transaction that will queue the proposal with the specified id to be executed.
   * @param proposalId The id of the proposal to queue.
   * @returns The transaction request.
   */
  public async queueProposal(
    proposalId: BigNumberish
  ): Promise<providers.TransactionRequest> {
    const governor = await this.getGovernorContract()
    const tx = await governor.populateTransaction['queue(uint256)'](proposalId)

    return await this.chainClient.populateTransaction(tx)
  }

  /**
   * Executes the proposal with the specified id.
   * @param proposalId The id of the proposal to execute.
   * @returns The transaction request.
   */
  public async executeProposal(
    proposalId: BigNumberish
  ): Promise<providers.TransactionRequest> {
    const governor = await this.getGovernorContract()
    const tx = await governor.populateTransaction['execute(uint256)'](
      proposalId
    )

    return await this.chainClient.populateTransaction(tx)
  }

  /**
   * Submits a vote to the Astonic Governor contract for the specified proposal.
   * @param proposalId The id of the proposal to vote on.
   * @param support Whether or not to support the proposal.
   * @returns The transaction request.
   */
  public async castVote(proposalId: BigNumberish, support: BigNumberish) {
    const governor = await this.getGovernorContract()
    const tx = await governor.populateTransaction.castVote(proposalId, support)

    return await this.chainClient.populateTransaction(tx)
  }

  /**
   * Cancels the proposal with the specified id.
   * @param proposalId The id of the proposal to vote on.
   * @param support Whether or not to support the proposal.
   * @returns The transaction request.
   */
  public async cancelProposal(
    proposalId: BigNumberish
  ): Promise<providers.TransactionRequest> {
    const governor = await this.getGovernorContract()
    const tx = await governor.populateTransaction.cancel(proposalId)

    return await this.chainClient.populateTransaction(tx)
  }

  /**
   * Returns the state of the proposal with the specified id.
   * @param proposalId The id of the proposal to get the state of.
   * @returns The state of the proposal.
   */
  public async getProposalState(proposalId: BigNumberish): Promise<string> {
    const governor = await this.getGovernorContract()
    const state = (await governor.functions.state(proposalId))[0]

    return ProposalState[state]
  }

  /**
   * This function validates the args that are to be used in the createProposal function.
   * @param targets The addresses of the contracts to be called during proposal execution.
   * @param values  The values to be passed to the calls to the target contracts.
   * @param calldatas The calldata to be passed to the calls to the target contracts.
   * @param description A human readable description of the proposal.
   */
  private validateProposalArgs(
    targets: string[],
    values: BigNumberish[],
    calldatas: string[],
    description: string
  ): void {
    if (!targets || targets.length === 0) {
      throw new Error('Targets must be specified')
    }
    if (!values || values.length === 0) {
      throw new Error('Values must be specified')
    }
    if (!calldatas || calldatas.length === 0) {
      throw new Error('Calldatas must be specified')
    }
    if (!description) {
      throw new Error('Description must be specified')
    }
    if (
      targets.length !== values.length ||
      targets.length !== calldatas.length
    ) {
      throw new Error(
        'Targets, values, and calldatas must all have the same length'
      )
    }
  }
}
