# Astonic SDK

The official Astonic Protocol SDK for interacting with Multi-Collateral Astonic smart contracts on the Planq network.

## Installation

```sh
# Install with npm
npm install @astonic-io/astonic-sdk

# Or install with yarn
yarn add @astonic-io/astonic-sdk
```

## Tradable Pairs Cache

Anytime we launch a new stable token, we need to update the tradable pairs cache.

The `yarn cacheTradablePairs` script generates a TypeScript file containing a list of all tradable pairs on the Astonic protocol. This file is used to cache the tradable pairs in the SDK and avoid costly re-fetching from the network.

```sh
yarn cacheTradablePairs
```
