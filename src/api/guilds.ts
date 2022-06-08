import { Get, Router } from '@discordx/koa'
import type { Context } from 'koa'
import { client } from '../main.js'
import { generateFlashsignerAddress,Config } from '@nervina-labs/flashsigner'
import NodeRsa from 'node-rsa'
import { Buffer } from 'buffer'
import db from '../database'
import { User } from '../shared/firestoreTypes'
import * as dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { GuildConfig, GuildRule } from '../shared/firestoreTypes'
import { getCotaCount } from '../service/cotaQuery'

dotenv.config()

const NERVINA_CHAIN_TYPE = process.env.NERVINA_CHAIN_TYPE=='testnet' ?'testnet':'mainnet'
const DISCORD_VERIFICATION_SECRET =
    process.env.DISCORD_VERIFICATION_SECRET || 'secret'
console.log(
    'DISCORD_VERIFICATION_SECRET: ',
    process.env.DISCORD_VERIFICATION_SECRET
)

@Router()
export class API {
    @Get('/')
    index(context: Context) {
        context.body = `
      <div style="text-align: center">
        <h1>
          <a href="https://discord-ts.js.org">discord.ts</a> rest api server example
        </h1>
        <p>
          powered by <a href="https://koajs.com/">koa</a> and
          <a href="https://www.npmjs.com/package/@discordx/koa">@discordx/koa</a>
        </p>
      </div>
    `
    }

    @Get()
    guilds(context: Context) {
        context.body = `${client.guilds.cache.map((g) => `${g.id}: ${g.name}\n`)}`
    }

    @Get('/sign-success')
    async verifySig(context: Context) {
        const { flashsigner_data } = context.request.query
        const data = JSON.parse(flashsigner_data as string)
        const { message, sig: signature } = data.result
        const response = {
            message,
            signature: signature.slice(520),
            pubkey: signature.slice(0, 520)
        }
        const key = new NodeRsa()
        const buf = Buffer.from(response.pubkey, 'hex')
        const e = buf.slice(0, 4).reverse()
        const n = buf.slice(4).reverse()
        key.importKey({ e, n }, 'components-public')
        key.setOptions({ signingScheme: 'pkcs1-sha256' })
        const isSigValid = key.verify(
            Buffer.from(response.message),
            Buffer.from(response.signature, 'hex')
        )

        context.body = `Signature verified result: ${isSigValid}`

        if (!isSigValid) return
        //Config.setChainType('mainnet' /* or 'testnet' */)
        Config.setChainType(NERVINA_CHAIN_TYPE)
        const address = generateFlashsignerAddress(response.pubkey)
        console.log('address: ',NERVINA_CHAIN_TYPE, address)

        const decoded = jwt.verify(
            message,
            DISCORD_VERIFICATION_SECRET
        ) as jwt.JwtPayload
        const { userId, guildId } = decoded

        const user: User = {
            wallet: address,
            userId,
            guildId
        }

        const docKey = `${guildId}-${userId}`
        const userDoc = await db.collection('users').doc(docKey).get()
        if (userDoc.exists && userDoc.data()!.wallet === address) {
            console.log('User info already exists')
            context.body = `User info already exists: ${address}`
            return
        }
        const guildConfigDoc = await db
        .collection('guildConfigs')
        .doc(guildId)
        .get()

        const guildConfigRules = (guildConfigDoc.data() as GuildConfig)?.rules

        const guild = await client.guilds.fetch(guildId)
        const member = await guild.members.fetch(userId)

        const roleNames: string[] = []
        guildConfigRules.forEach(async (guildRule: GuildRule) => {
            if (Object.keys(guildRule.nft).length === 1) {
                const nftAddresses = Object.keys(guildRule.nft)
                // TODO: check if user's address has nfts
                const address = nftAddresses[0]
                
                const rs = await getCotaCount(user.wallet,address)
                console.log(`getCotaCount: ${rs}-${user.wallet}-${address}`)
                const hasNft = rs > 0 
                if (hasNft && !roleNames.includes(guildRule.roleName)) {
                    roleNames.push(guildRule.roleName)

                    const role = guild.roles.cache.find((el) => el.name == guildRule.roleName)!
                    try {
                        role && member.roles.add(role)
                        console.log('role added: ', guildRule.roleName)
                    } catch (err) {
                        console.error('Error happened for adding role: ', err)
                    }

                }
                if (hasNft) {
                    try {
                        await db.collection('users').doc(docKey).set(user)
                        context.body = "link ckb wallet success!"
                        //return
                    } catch (error) {
                        console.error('Error happened for saving user info: ', error)
                    }
                } 
                context.body = `Current User has no NFT(${user.wallet})`
            }
        })
        // if (roleNames.length > 0) {
        //     roleNames.forEach((name: string) => {
        //         const role = guild.roles.cache.find((el) => el.name == name)!
        //         try {
        //             role && member.roles.add(role)
        //             console.log('role added: ', name)
        //         } catch (err) {
        //             console.error('Error happened for adding role: ', err)
        //         }

        //     })
        // }
    }
}

function ChainType(arg0: string): string | undefined {
    throw new Error('Function not implemented.')
}

