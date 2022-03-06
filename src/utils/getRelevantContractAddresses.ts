import { GuildConfig, NFTRule } from '../shared/firestoreTypes'
import { ContractAddresses } from '../types'
import { guildRuleToSimpleRule, isNFTRule } from './guildRuleHelpers'

export const getContractAddressesRelevantToGuildConfig = (
  guildConfig: GuildConfig
): ContractAddresses =>
  guildConfig.rules.reduce(
    (acc: ContractAddresses, guildRule) => {
      try {
        const simpleRule = guildRuleToSimpleRule(guildRule)
        if (isNFTRule(simpleRule)) {
          let nftRule = simpleRule as NFTRule
          acc.nft.push(nftRule.nftAddress)
        }
        return acc
      } catch (err) {
        return acc
      }
    },
    { nft: [] }
  )

// compute the relevant contract addresses across all guilds
export const getRelevantContractAddresses = (
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): ContractAddresses => {
  const contractAddressesSets = guildConfigsSnapshot.docs.reduce(
    (acc, guildConfigDoc) => {
      const guildConfigContractAddresses =
        getContractAddressesRelevantToGuildConfig(
          guildConfigDoc.data() as GuildConfig
        )

      // add to the set of nft addresses
      guildConfigContractAddresses.nft.forEach((address) =>
        acc.nft.add(address)
      )

      return acc
    },
    { nft: new Set<string>() }
  )
  const contractAddresses: ContractAddresses = {
    nft: Array.from(contractAddressesSets.nft)
  }
  return contractAddresses
}
