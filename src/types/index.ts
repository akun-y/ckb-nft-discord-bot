export interface UpdateUserDiscordRolesResponse {
  activeRoles: { [guildName: string]: string[] }
  removedRoles: { [guildName: string]: string[] }
}

export interface NftUserItem {
  nftContract: string
  tokenId: string
}

export interface ContractAddresses {
  nft: string[]
}

export interface WalletContents {
  nft: {
    [nftAddress: string]: {
      tokenIds: string[]
    }
  }
}
