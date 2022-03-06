import { ContractAddresses, WalletContents } from '../types'
import { RandomEarthAPIError, TokenFetchingError } from '../types/errors'
import { getNftTokens } from './getNftTokens'

export const getWalletContents = async (
  walletAddress: string,
  contractAddresses: ContractAddresses
): Promise<WalletContents> => {
  const userTokensCache: WalletContents = { nft: {} }

  const unionIntoNftCache = (contractAddress: string, tokenIds: string[]) => {
    if (userTokensCache.nft[contractAddress]) {
      userTokensCache.nft[contractAddress] = {
        tokenIds: Array.from(
          new Set([
            ...tokenIds,
            ...userTokensCache.nft[contractAddress].tokenIds
          ])
        )
      }
    } else {
      userTokensCache.nft[contractAddress] = { tokenIds }
    }
  }

  const pendingRequests = []

  pendingRequests.push(
    getNftTokens(walletAddress)
      .then((knowhereTokens) =>
        Object.entries(knowhereTokens.nft).forEach(
          ([contractAddress, nftHoldingInfo]) =>
            unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
        )
      )
      .catch((err) => {
        throw new RandomEarthAPIError('Failed to request the knowhere api.')
      })
  )

  // Update user tokens cache
  try {
    await Promise.all([...pendingRequests])
  } catch (e) {
    throw new TokenFetchingError(
      'Failed to fetch user tokens for unknown reasons. Please report to Rostra Guild'
    )
  }

  return userTokensCache
}
