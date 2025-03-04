import {
  BiPoolManager__factory,
  IBreakerBox0828__factory,
  IBroker0828__factory,
  IExchangeProvider0828__factory,
} from '@astonic-io/astonic-bindings-ts'
import { Contract, Wallet, constants, ethers, providers, utils } from 'ethers'

import { IAstonicRouter__factory } from '@astonic-io/astonic-router-ts'
import { Astonic, TradablePair } from './astonic'

jest.mock('@astonic-io/astonic-bindings-ts', () => {
  return {
    IBroker__factory: {
      connect: jest.fn(),
    },
    Broker__factory: {
      connect: jest.fn(),
    },
    IExchangeProvider__factory: jest.fn(),
    BiPoolManager__factory: {
      connect: jest.fn(),
    },
    IBreakerBox__factory: {
      connect: jest.fn(),
    },
  }
})
jest.mock('@astonic-io/astonic-router-ts', () => {
  return {
    IAstonicRouter__factory: {
      connect: jest.fn(),
    },
  }
})
jest.mock('ethers', () => {
  return {
    constants: jest.requireActual('ethers').constants,
    providers: jest.requireActual('ethers').providers,
    Signer: jest.requireActual('ethers').Signer,
    utils: jest.requireActual('ethers').utils,
    Wallet: jest.requireActual('ethers').Wallet,
    Contract: jest.fn(),
  }
})

describe('Astonic', () => {
  const oneInWei = utils.parseUnits('1', 18)
  const twoInWei = utils.parseUnits('2', 18)

  // fake tokens and symbols
  const fakeaUSDTokenAddr = 'aUSDTokenAddr'
  const fakeaEURTokenAddr = 'aEURTokenAddr'
  const fakeaBRLTokenAddr = 'aBRLTokenAddr'
  const fakePlanqTokenAddr = 'planqTokenAddr'
  const fakeSymbolsByTokenAddr: Record<string, string> = {
    [fakeaUSDTokenAddr]: 'aUSD',
    [fakeaEURTokenAddr]: 'aEUR',
    [fakeaBRLTokenAddr]: 'aBRL',
    [fakePlanqTokenAddr]: 'PLQ',
  }

  // fake exchange providers and exchanges
  const fakeUsdAndEurExchangeProvider = 'ExchangeProvider0'
  const fakeBrlExchangeProvider = 'ExchangeProvider1'
  const fakePlanqUSDExchange = {
    exchangeId: 'ExchangePlanqAUSDAddr',
    assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
  }
  const fakePlanqEURExchange = {
    exchangeId: 'ExchangePlanqAEURAddr',
    assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
  }
  const fakePlanqBRLExchange = {
    exchangeId: 'ExchangePlanqABRLAddr',
    assets: [fakeaBRLTokenAddr, fakePlanqTokenAddr],
  }
  const fakeExchangesByProviders = {
    [fakeUsdAndEurExchangeProvider]: [fakePlanqUSDExchange, fakePlanqEURExchange],
    [fakeBrlExchangeProvider]: [fakePlanqBRLExchange],
    ExchangeProvider2: [],
  }
  const nOfFakeDirectExchanges = Object.values(fakeExchangesByProviders).reduce(
    (acc, curr) => acc + curr.length,
    0
  )

  // ========== Mock contract factories ==========
  const fakeBrokerAddr = 'fakeBrokerAddr'
  const fakeRouterAddr = 'fakeRouterAddr'
  const mockBroker = {
    address: fakeBrokerAddr,
    getExchangeProviders: jest.fn(() => Object.keys(fakeExchangesByProviders)),
    getAmountIn: jest.fn(),
    getAmountOut: jest.fn(),
    populateTransaction: {
      swapOut: jest.fn(),
      swapIn: jest.fn(),
    },
    signer: {
      populateTransaction: jest.fn(),
    },
  }
  const mockRouter = {
    address: fakeRouterAddr,
    getAmountIn: jest.fn(),
    getAmountOut: jest.fn(),
    populateTransaction: {
      swapTokensForExactTokens: jest.fn(),
      swapExactTokensForTokens: jest.fn(),
    },
    signer: {
      populateTransaction: jest.fn(),
    },
  }
  const mockBiPoolManager = {
    breakerBox: jest.fn(() => 'fakeBreakerBoxAddr'),
    getPoolExchange: jest.fn(() => {
      return {
        config: {
          referenceRateFeedID: 'fakeReferenceRateId',
        },
      }
    }),
  }
  const mockBreakerBox = {
    getRateFeedTradingMode: jest.fn(),
  }

  // @ts-ignore
  IBroker__factory.connect.mockReturnValue(mockBroker)
  // @ts-ignore
  IAstonicRouter__factory.connect.mockReturnValue(mockRouter)
  // @ts-ignore
  IExchangeProvider__factory.connect = jest.fn((exchangeProvider: string) => {
    return {
      getExchanges: () =>
        fakeExchangesByProviders[
          exchangeProvider as keyof typeof fakeExchangesByProviders
        ],
    }
  })
  // @ts-ignore
  BiPoolManager__factory.connect.mockReturnValue(mockBiPoolManager)
  // @ts-ignore
  IBreakerBox__factory.connect.mockReturnValue(mockBreakerBox)

  // ========== Mock ethers contracts ==========
  const planqRegistryAddress = '0x9DabFe01de024C681320eb80FBc64EccEaa58ca2'
  const fakeRegistryContract = {
    getAddressForString: jest.fn(() => fakeBrokerAddr),
  }
  const increaseAllowanceFn = jest.fn()
  const mockContractModule = jest.fn((contractAddr: string) => {
    const isRegistryContract = contractAddr === planqRegistryAddress
    const isErc20Contract = Object.keys(fakeSymbolsByTokenAddr).includes(
      contractAddr
    )

    if (isRegistryContract) {
      return fakeRegistryContract
    } else if (isErc20Contract) {
      return {
        symbol: jest.fn(
          () =>
            fakeSymbolsByTokenAddr[
              contractAddr as keyof typeof fakeSymbolsByTokenAddr
            ]
        ),
        populateTransaction: {
          increaseAllowance: increaseAllowanceFn,
        },
      }
    } else {
      throw new Error('Unknown contract address with no mock implementation')
    }
  })
  // @ts-ignore
  Contract.mockImplementation(mockContractModule)

  let provider: providers.JsonRpcProvider
  let signer: ethers.Wallet
  let signerWithoutProvider: ethers.Wallet
  const pk = Wallet.createRandom().privateKey

  beforeAll(async () => {
    provider = new providers.JsonRpcProvider()
    provider.getNetwork = jest
      .fn()
      .mockResolvedValue({ chainId: 7070, name: 'planq' })
    signer = new Wallet(pk, provider)
    signerWithoutProvider = new Wallet(pk)
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should return a Astonic instance with the registry broker address and a router object', async () => {
      const testee = await Astonic.create(provider)
      expect(testee).toBeDefined()
      expect(fakeRegistryContract.getAddressForString).toHaveBeenCalledTimes(1)
      expect(mockContractModule).toHaveBeenCalledTimes(1)
      expect(mockContractModule.mock.lastCall![0]).toBe(planqRegistryAddress)

      const testee2 = await Astonic.create(signer)
      expect(testee2).toBeDefined()
      expect(fakeRegistryContract.getAddressForString).toHaveBeenCalledTimes(2)
      expect(mockContractModule).toHaveBeenCalledTimes(2)
      expect(mockContractModule.mock.lastCall![0]).toBe(planqRegistryAddress)
    })
    it('should throw if the signer has no provider', async () => {
      await expect(Astonic.create(signerWithoutProvider)).rejects.toThrow(
        'Signer must be connected to a provider'
      )
    })

    it('should throw if no signer or provider is provided', async () => {
      // @ts-ignore
      await expect(Astonic.create()).rejects.toThrow(
        'A valid signer or provider must be provided'
      )
    })
  })

  describe('createWithParams', () => {
    it('should return a Astonic instance without querying the registry and include a router object', () => {
      const testee = Astonic.createWithParams(
        provider,
        fakeBrokerAddr,
        fakeRouterAddr
      )
      expect(testee).toBeDefined()
      expect(mockContractModule).toHaveBeenCalledTimes(0)
      expect(fakeRegistryContract.getAddressForString).toHaveBeenCalledTimes(0)

      const testee2 = Astonic.createWithParams(
        signer,
        fakeBrokerAddr,
        fakeRouterAddr
      )
      expect(testee2).toBeDefined()
      expect(mockContractModule).toHaveBeenCalledTimes(0)
      expect(fakeRegistryContract.getAddressForString).toHaveBeenCalledTimes(0)
    })

    it('should throw if the signer has no provider', () => {
      expect(() =>
        Astonic.createWithParams(
          signerWithoutProvider,
          fakeBrokerAddr,
          fakeRouterAddr
        )
      ).toThrow('Signer must be connected to a provider')
    })

    it('should throw if no signer or provider is provided', () => {
      //@ts-ignore
      expect(() => Astonic.createWithParams(fakeBrokerAddr)).toThrow(
        'A valid signer or provider must be provided'
      )
    })
  })

  describe('getTradeablePairsWithPath', () => {
    it('should return an array of pairs including direct and routed (one-hop) pairs', async () => {
      const testee = await Astonic.create(provider)

      const pairs = await testee.getTradablePairsWithPath({ cached: false })
      // Check direct pairs (length 2)
      const directPairs = pairs.filter((p: TradablePair) => p.path.length === 1)
      expect(directPairs.length).toBe(nOfFakeDirectExchanges)

      // Verify each direct exchange pair is included
      for (const [provider, exchanges] of Object.entries(
        fakeExchangesByProviders
      )) {
        for (const exchange of exchanges) {
          const symbol0 = fakeSymbolsByTokenAddr[exchange.assets[0]]
          const symbol1 = fakeSymbolsByTokenAddr[exchange.assets[1]]
          const [firstSymbol, secondSymbol] = [symbol0, symbol1].sort()
          const directPair: TradablePair = {
            id: `${firstSymbol}-${secondSymbol}`,
            assets: [
              {
                address:
                  firstSymbol === symbol0
                    ? exchange.assets[0]
                    : exchange.assets[1],
                symbol: firstSymbol,
              },
              {
                address:
                  secondSymbol === symbol1
                    ? exchange.assets[1]
                    : exchange.assets[0],
                symbol: secondSymbol,
              },
            ],
            path: [
              {
                providerAddr: provider,
                id: exchange.exchangeId,
                assets: [exchange.assets[0], exchange.assets[1]],
              },
            ],
          }
          expect(pairs).toContainEqual(directPair)
        }
      }

      // Check that at least one routed (one-hop) pair is included (length > 2)
      const routedPairs = pairs.filter((p: TradablePair) => p.path.length == 2)
      expect(routedPairs.length).toBeGreaterThan(0)
      // For example, expect aUSD -> aEUR via PLQ to be present
      expect(pairs).toContainEqual({
        id: 'aEUR-aUSD',
        assets: [
          {
            address: fakeaEURTokenAddr,
            symbol: 'aEUR',
          },
          {
            address: fakeaUSDTokenAddr,
            symbol: 'aUSD',
          },
        ],
        path: [
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqUSDExchange.exchangeId,
            assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
          },
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqEURExchange.exchangeId,
            assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
          },
        ],
      })
    })
  })

  describe('getAmountIn', () => {
    it('should call broker.getAmountIn with the right parameters for a direct swap', async () => {
      const testee = await Astonic.create(provider)

      for (const [mockedProvider, mockedExchanges] of Object.entries(
        fakeExchangesByProviders
      )) {
        for (const exchange of mockedExchanges) {
          const tokenIn = exchange.assets[0]
          const tokenOut = exchange.assets[1]
          const symbol0 = fakeSymbolsByTokenAddr[tokenIn]
          const symbol1 = fakeSymbolsByTokenAddr[tokenOut]
          const [firstSymbol, secondSymbol] = [symbol0, symbol1].sort()
          const directPair: TradablePair = {
            id: `${firstSymbol}-${secondSymbol}`,
            assets: [
              {
                address: firstSymbol === symbol0 ? tokenIn : tokenOut,
                symbol: firstSymbol,
              },
              {
                address: secondSymbol === symbol1 ? tokenOut : tokenIn,
                symbol: secondSymbol,
              },
            ],
            path: [
              {
                providerAddr: mockedProvider,
                id: exchange.exchangeId,
                assets: [tokenIn, tokenOut],
              },
            ],
          }
          await testee.getAmountIn(tokenIn, tokenOut, oneInWei, directPair)
          expect(mockBroker.getAmountIn).toHaveBeenCalledWith(
            mockedProvider,
            exchange.exchangeId,
            tokenIn,
            tokenOut,
            oneInWei
          )
        }
      }
    })

    it('should call router.getAmountIn with the right parameters for a routed swap', async () => {
      const testee = await Astonic.create(provider)
      const routedPair: TradablePair = {
        id: 'aEUR-aUSD',
        assets: [
          {
            address: fakeaEURTokenAddr,
            symbol: 'aEUR',
          },
          {
            address: fakeaUSDTokenAddr,
            symbol: 'aUSD',
          },
        ],
        path: [
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqUSDExchange.exchangeId,
            assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
          },
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqEURExchange.exchangeId,
            assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
          },
        ],
      }

      mockRouter.getAmountIn.mockResolvedValue('routedAmountIn')

      const result = await testee.getAmountIn(
        fakeaUSDTokenAddr,
        fakeaEURTokenAddr,
        oneInWei,
        routedPair
      )

      expect(mockRouter.getAmountIn).toHaveBeenCalledWith(oneInWei, [
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqUSDExchange.exchangeId,
          assetIn: fakeaUSDTokenAddr,
          assetOut: fakePlanqTokenAddr,
        },
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqEURExchange.exchangeId,
          assetIn: fakePlanqTokenAddr,
          assetOut: fakeaEURTokenAddr,
        },
      ])
      expect(result).toBe('routedAmountIn')
    })
  })

  describe('getAmountOut', () => {
    it('should call broker.getAmountOut with the right parameters for a direct swap', async () => {
      const testee = await Astonic.create(provider)

      for (const [mockedProvider, mockedExchanges] of Object.entries(
        fakeExchangesByProviders
      )) {
        for (const exchange of mockedExchanges) {
          const tokenIn = exchange.assets[1]
          const tokenOut = exchange.assets[0]
          const symbol0 = fakeSymbolsByTokenAddr[tokenIn]
          const symbol1 = fakeSymbolsByTokenAddr[tokenOut]
          const [firstSymbol, secondSymbol] = [symbol0, symbol1].sort()
          const directPair: TradablePair = {
            id: `${firstSymbol}-${secondSymbol}`,
            assets: [
              {
                address: firstSymbol === symbol0 ? tokenIn : tokenOut,
                symbol: firstSymbol,
              },
              {
                address: secondSymbol === symbol1 ? tokenOut : tokenIn,
                symbol: secondSymbol,
              },
            ],
            path: [
              {
                providerAddr: mockedProvider,
                id: exchange.exchangeId,
                assets: [tokenIn, tokenOut],
              },
            ],
          }

          await testee.getAmountOut(tokenIn, tokenOut, oneInWei, directPair)
          expect(mockBroker.getAmountOut).toHaveBeenCalledWith(
            mockedProvider,
            exchange.exchangeId,
            tokenIn,
            tokenOut,
            oneInWei
          )
        }
      }
    })

    it('should call router.getAmountOut with the right parameters for a routed swap', async () => {
      const testee = await Astonic.create(provider)
      const routedPair: TradablePair = {
        id: 'aEUR-aUSD',
        assets: [
          {
            address: fakeaEURTokenAddr,
            symbol: 'aEUR',
          },
          {
            address: fakeaUSDTokenAddr,
            symbol: 'aUSD',
          },
        ],
        path: [
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqEURExchange.exchangeId,
            assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
          },
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqUSDExchange.exchangeId,
            assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
          },
        ],
      }

      mockRouter.getAmountOut.mockResolvedValue('routedAmountOut')

      const result = await testee.getAmountOut(
        fakeaEURTokenAddr,
        fakeaUSDTokenAddr,
        oneInWei,
        routedPair
      )

      expect(mockRouter.getAmountOut).toHaveBeenCalledWith(oneInWei, [
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqEURExchange.exchangeId,
          assetIn: fakeaEURTokenAddr,
          assetOut: fakePlanqTokenAddr,
        },
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqUSDExchange.exchangeId,
          assetIn: fakePlanqTokenAddr,
          assetOut: fakeaUSDTokenAddr,
        },
      ])
      expect(result).toBe('routedAmountOut')
    })
  })

  describe('increaseTradingAllowance', () => {
    it('should return a populated increaseAllowance tx object for a direct pair', async () => {
      const testee = await Astonic.create(signer)
      const token = fakePlanqBRLExchange.assets[0]
      const amount = twoInWei
      const directPair: TradablePair = {
        id: 'PLQ-aBRL',
        assets: [
          {
            address: fakePlanqTokenAddr,
            symbol: 'PLQ',
          },
          {
            address: fakeaBRLTokenAddr,
            symbol: 'aBRL',
          },
        ],
        path: [
          {
            providerAddr: fakeBrlExchangeProvider,
            id: fakePlanqBRLExchange.exchangeId,
            assets: [fakePlanqTokenAddr, fakeaBRLTokenAddr],
          },
        ],
      }

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x1337',
        data: '0x345',
        from: '0xad3',
        gasLimit: 2200,
      }

      increaseAllowanceFn.mockReturnValueOnce(fakeTxObj)
      const spy = jest
        .spyOn(signer, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const tx = await testee.increaseTradingAllowance(
        token,
        amount,
        directPair
      )
      expect(tx).toBe(fakePopulatedTxObj)
      expect(increaseAllowanceFn).toHaveBeenCalledTimes(1)
      expect(increaseAllowanceFn).toHaveBeenCalledWith(fakeBrokerAddr, amount)
      expect(mockContractModule.mock.lastCall![0]).toEqual(token)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)
    })

    it('should return a populated increaseAllowance tx object for a routed pair', async () => {
      const testee = await Astonic.create(signer)
      const token = fakeaUSDTokenAddr
      const amount = twoInWei
      const routedPair: TradablePair = {
        id: 'aEUR-aUSD',
        assets: [
          {
            address: fakeaEURTokenAddr,
            symbol: 'aEUR',
          },
          {
            address: fakeaUSDTokenAddr,
            symbol: 'aUSD',
          },
        ],
        path: [
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqUSDExchange.exchangeId,
            assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
          },
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqEURExchange.exchangeId,
            assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
          },
        ],
      }

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x1337',
        data: '0x345',
        from: '0xad3',
        gasLimit: 2200,
      }

      increaseAllowanceFn.mockReturnValueOnce(fakeTxObj)
      const spy = jest
        .spyOn(signer, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const tx = await testee.increaseTradingAllowance(
        token,
        amount,
        routedPair
      )
      expect(tx).toBe(fakePopulatedTxObj)
      expect(increaseAllowanceFn).toHaveBeenCalledTimes(1)
      expect(increaseAllowanceFn).toHaveBeenCalledWith(fakeRouterAddr, amount)
      expect(mockContractModule.mock.lastCall![0]).toEqual(token)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(fakeTxObj)
    })
  })

  describe('swapIn', () => {
    it('should call broker.swapIn with the right parameters for a direct swap', async () => {
      const testee = await Astonic.create(signer)

      for (const [mockedProvider, mockedExchanges] of Object.entries(
        fakeExchangesByProviders
      )) {
        for (const exchange of mockedExchanges) {
          const tokenIn = exchange.assets[0]
          const tokenOut = exchange.assets[1]
          const symbol0 = fakeSymbolsByTokenAddr[tokenIn]
          const symbol1 = fakeSymbolsByTokenAddr[tokenOut]
          const [firstSymbol, secondSymbol] = [symbol0, symbol1].sort()
          const directPair: TradablePair = {
            id: `${firstSymbol}-${secondSymbol}`,
            assets: [
              {
                address: firstSymbol === symbol0 ? tokenIn : tokenOut,
                symbol: firstSymbol,
              },
              {
                address: secondSymbol === symbol1 ? tokenOut : tokenIn,
                symbol: secondSymbol,
              },
            ],
            path: [
              {
                providerAddr: mockedProvider,
                id: exchange.exchangeId,
                assets: [tokenIn, tokenOut],
              },
            ],
          }

          const fakeTxObj = { to: '0x1337', data: '0x345' }
          const fakePopulatedTxObj = {
            to: '0x123',
            data: '0x00456',
            from: '0xad3',
            gasLimit: 2200,
          }

          mockBroker.populateTransaction.swapIn.mockReturnValueOnce(fakeTxObj)
          const spy = jest
            .spyOn(signer, 'populateTransaction')
            // @ts-ignore
            .mockReturnValueOnce(fakePopulatedTxObj)

          const result = await testee.swapIn(
            tokenIn,
            tokenOut,
            oneInWei,
            twoInWei,
            directPair
          )
          expect(result).toBe(fakePopulatedTxObj)

          expect(mockBroker.populateTransaction.swapIn).toHaveBeenCalledWith(
            mockedProvider,
            exchange.exchangeId,
            tokenIn,
            tokenOut,
            oneInWei,
            twoInWei
          )

          expect(spy).toHaveBeenCalledWith(fakeTxObj)
        }
      }
    })

    it('should call router.swapIn with the right parameters for a routed swap', async () => {
      const testee = await Astonic.create(signer)
      const routedPair: TradablePair = {
        id: 'aEUR-aUSD',
        assets: [
          {
            address: fakeaEURTokenAddr,
            symbol: 'aEUR',
          },
          {
            address: fakeaUSDTokenAddr,
            symbol: 'aUSD',
          },
        ],
        path: [
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqUSDExchange.exchangeId,
            assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
          },
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqEURExchange.exchangeId,
            assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
          },
        ],
      }

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockRouter.populateTransaction.swapExactTokensForTokens.mockReturnValueOnce(
        fakeTxObj
      )
      const spy = jest
        .spyOn(signer, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.swapIn(
        fakeaUSDTokenAddr,
        fakeaEURTokenAddr,
        oneInWei,
        twoInWei,
        routedPair
      )

      expect(
        mockRouter.populateTransaction.swapExactTokensForTokens
      ).toHaveBeenCalledWith(oneInWei, twoInWei, [
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqUSDExchange.exchangeId,
          assetIn: fakeaUSDTokenAddr,
          assetOut: fakePlanqTokenAddr,
        },
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqEURExchange.exchangeId,
          assetIn: fakePlanqTokenAddr,
          assetOut: fakeaEURTokenAddr,
        },
      ])
      expect(result).toBe(fakePopulatedTxObj)
    })
  })

  describe('swapOut', () => {
    it('should call broker.swapOut with the right parameters for a direct swap', async () => {
      const testee = await Astonic.create(signer)

      for (const [mockedProvider, mockedExchanges] of Object.entries(
        fakeExchangesByProviders
      )) {
        for (const exchange of mockedExchanges) {
          const tokenIn = exchange.assets[0]
          const tokenOut = exchange.assets[1]
          const directPair: TradablePair = {
            id: `${fakeSymbolsByTokenAddr[tokenIn]}-${fakeSymbolsByTokenAddr[tokenOut]}`,
            assets: [
              {
                address: tokenIn,
                symbol: fakeSymbolsByTokenAddr[tokenIn],
              },
              {
                address: tokenOut,
                symbol: fakeSymbolsByTokenAddr[tokenOut],
              },
            ],
            path: [
              {
                providerAddr: mockedProvider,
                id: exchange.exchangeId,
                assets: [tokenIn, tokenOut],
              },
            ],
          }

          const fakeTxObj = { to: '0x1337', data: '0x345' }
          const fakePopulatedTxObj = {
            to: '0x123',
            data: '0x00456',
            from: '0xad3',
            gasLimit: 2200,
          }

          mockBroker.populateTransaction.swapOut.mockReturnValueOnce(fakeTxObj)
          const spy = jest
            .spyOn(signer, 'populateTransaction')
            // @ts-ignore
            .mockReturnValueOnce(fakePopulatedTxObj)

          const result = await testee.swapOut(
            tokenIn,
            tokenOut,
            oneInWei,
            twoInWei,
            directPair
          )
          expect(result).toBe(fakePopulatedTxObj)

          expect(mockBroker.populateTransaction.swapOut).toHaveBeenCalledWith(
            mockedProvider,
            exchange.exchangeId,
            tokenIn,
            tokenOut,
            oneInWei,
            twoInWei
          )

          expect(spy).toHaveBeenCalledWith(fakeTxObj)
        }
      }
    })

    it('should call router.swapOut with the right parameters for a routed swap', async () => {
      const testee = await Astonic.create(signer)
      const routedPair: TradablePair = {
        id: 'aUSD-aEUR',
        assets: [
          {
            address: fakeaUSDTokenAddr,
            symbol: fakeSymbolsByTokenAddr[fakeaUSDTokenAddr],
          },
          {
            address: fakeaEURTokenAddr,
            symbol: fakeSymbolsByTokenAddr[fakeaEURTokenAddr],
          },
        ],
        path: [
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqUSDExchange.exchangeId,
            assets: [fakeaUSDTokenAddr, fakePlanqTokenAddr],
          },
          {
            providerAddr: fakeUsdAndEurExchangeProvider,
            id: fakePlanqEURExchange.exchangeId,
            assets: [fakeaEURTokenAddr, fakePlanqTokenAddr],
          },
        ],
      }

      const fakeTxObj = { to: '0x1337', data: '0x345' }
      const fakePopulatedTxObj = {
        to: '0x123',
        data: '0x00456',
        from: '0xad3',
        gasLimit: 2200,
      }

      mockRouter.populateTransaction.swapTokensForExactTokens.mockReturnValueOnce(
        fakeTxObj
      )
      jest
        .spyOn(signer, 'populateTransaction')
        // @ts-ignore
        .mockReturnValueOnce(fakePopulatedTxObj)

      const result = await testee.swapOut(
        fakeaUSDTokenAddr,
        fakeaEURTokenAddr,
        oneInWei,
        twoInWei,
        routedPair
      )

      expect(
        mockRouter.populateTransaction.swapTokensForExactTokens
      ).toHaveBeenCalledWith(oneInWei, twoInWei, [
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqUSDExchange.exchangeId,
          assetIn: fakeaUSDTokenAddr,
          assetOut: fakePlanqTokenAddr,
        },
        {
          exchangeProvider: fakeUsdAndEurExchangeProvider,
          exchangeId: fakePlanqEURExchange.exchangeId,
          assetIn: fakePlanqTokenAddr,
          assetOut: fakeaEURTokenAddr,
        },
      ])
      expect(result).toBe(fakePopulatedTxObj)
    })
  })

  describe('getExchangeById', () => {
    it('should return the exchange with the given id', async () => {
      const testee = await Astonic.create(provider)
      const planqUSDExchange = await testee.getExchangeById(
        fakePlanqUSDExchange.exchangeId
      )
      const planqEURExchange = await testee.getExchangeById(
        fakePlanqEURExchange.exchangeId
      )

      expect(planqUSDExchange.id).toEqual(fakePlanqUSDExchange.exchangeId)
      expect(planqEURExchange.id).toEqual(fakePlanqEURExchange.exchangeId)
    })

    it('should throw if no exchange is found for the given id', async () => {
      const testee = await Astonic.create(provider)
      await expect(
        testee.getExchangeById('nonExistentExchangeId')
      ).rejects.toThrow()
    })
  })

  describe('isTradingEnabled', () => {
    it('should return true if the trading mode is 0', async () => {
      const testee = await Astonic.create(provider)

      mockBreakerBox.getRateFeedTradingMode.mockReturnValueOnce(constants.Zero)
      expect(
        await testee.isTradingEnabled(fakePlanqUSDExchange.exchangeId)
      ).toBe(true)
    })
    it('should return false if the trading mode is not 0', async () => {
      const testee = await Astonic.create(provider)

      mockBreakerBox.getRateFeedTradingMode.mockReturnValueOnce(constants.One)
      expect(
        await testee.isTradingEnabled(fakePlanqUSDExchange.exchangeId)
      ).toBe(false)
    })
  })
})
