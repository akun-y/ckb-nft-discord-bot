export interface User {
  wallet: string;
  userId: string;
  guildId: string;
}

export type NFTRule = {
  nftAddress: string;
  tokenIds?: string[];
  quantity: number;
  roleName: string;
};

export type UDTRule = {
  udtAddress: string;
  quantity: number;
  roleName: string;
};

export type SimpleRule = NFTRule | UDTRule;

// GuildRule is designed to accomodate future rule types.
// For now "nativeToken" is never used.
// And nft and token are never both populated in the same rule.
export type GuildRule = {
  version: string;
  nft: {
    [nftAddress: string]: {
      tokenIds?: string[];
      quantity: number;
    };
  };
  udt: {
    [udtAddress: string]: {
      quantity: number;
    };
  };
  nativeToken: {
    [denom: string]: {
      quantity: number;
    };
  };
  roleName: string;
};
export interface GuildConfig {
  rules: GuildRule[];
}
