import 'reflect-metadata'
import { GuildMember, Intents, Interaction, Message } from 'discord.js'
import { Client } from 'discordx'
import { dirname, importx } from '@discordx/importer'
import { Koa } from '@discordx/koa'
import setupPermissions from './utils/setupPermissions'
import * as dotenv from 'dotenv'

dotenv.config()

export const client = new Client({
  simpleCommand: {
    prefix: '!'
  },
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES
  ],
  // If you only want to use global commands only, comment this line
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)]
})

client.once('ready', async () => {
  // make sure all guilds are in cache
  await client.guilds.fetch()

  // init all application commands
  await client.initApplicationCommands({
    guild: { log: true },
    global: { log: true }
  })

  // init permissions; enabled log to see changes
  await client.initApplicationPermissions(true)

  // uncomment this line to clear all guild commands,
  // useful when moving to global commands from guild commands
  //  await client.clearApplicationCommands(
  //    ...client.guilds.cache.map((g) => g.id)
  //  );
  client.guilds.cache.forEach((guild) => {
    console.log(`Registering commands for ${guild.name}`)
    setupPermissions(guild)
  })

  console.log('Bot started')
})

// When the bot is added to a server, configure the slash commands
client.on('guildCreate', setupPermissions)

client.on('interactionCreate', (interaction: Interaction) => {
  client.executeInteraction(interaction)
})

client.on('messageCreate', (message: Message) => {
  client.executeCommand(message)
})

client.on('guildMemberAdd', (guildMember: GuildMember) => {
  // here I should check if the member is qualified to get this role
  const roleName = 'Rostra guild contributor'
  let role = guildMember.guild.roles.cache.find(
    (role: any) => role.name === roleName
  )
  if (role) {
    guildMember.roles.add(role)
    // bot-test-2 channel
    const channelId = '942799610324320347'
    const channel = guildMember.guild.channels.cache.get(channelId)
    if (channel?.isText()) {
      channel.send(`Welcome <@${guildMember.user.id}> to our Rostra Guild!`)
    }
  }
})

async function run() {
  // with cjs
  // await importx(__dirname + "/{events,commands}/**/*.{ts,js}");
  // with ems
  await importx(
    dirname(import.meta.url) + '/{events,commands,api}/**/*.{ts,js}'
  )

  // let's start the bot
  if (!process.env.BOT_TOKEN) {
    throw Error('Could not find BOT_TOKEN in your environment')
  }
  await client.login(process.env.BOT_TOKEN) // provide your bot token

  // ************* rest api section: start **********

  // api: preare server
  const server = new Koa()

  // api: need to build the api server first
  await server.build()

  // api: let's start the server now
  const port = process.env.PORT ?? 3000
  server.listen(port, () => {
    console.log(`discord api server started on ${port}`)
    console.log(`visit localhost:${port}/guilds`)
  })

  // ************* rest api section: end **********
}

run()
