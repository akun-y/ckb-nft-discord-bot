import axios from 'axios'
import { NftUserItem, WalletContents } from '../types'

export const getNftTokens = async (
  walletAddress: string
): Promise<WalletContents> => {
  let userTokensRes

  try {
    const nftApi = 'xxx'
    userTokensRes = (await axios.get(`${nftApi}/${walletAddress}`))
      .data as NftUserItem[]
    const userTokens = userTokensRes.reduce(
      (acc: WalletContents, item) => {
        if (acc.nft[item.nftContract]) {
          acc.nft[item.nftContract].tokenIds.push(item.tokenId)
        } else {
          acc.nft[item.nftContract] = { tokenIds: [item.tokenId] }
        }
        return acc
      },
      { nft: {} }
    )

    return userTokens
  } catch (e) {
    console.log(e)
    throw new Error(`Failed to request the NFT api ${walletAddress}`)
  }
}
