import db from '../database'
import { coldUpdateRolesForUser } from './coldUpdateRolesForUser'
import { User } from '../shared/firestoreTypes'
import { Client } from 'discord.js'

export async function updateUserRoles(client: Client) {
  console.log('Running updateUserRoles cronjob!')

  // loop over every user
  const usersSnapshot = await db.collection('users').get()
  const guildConfigsSnapshot = await db.collection('guildConfigs').get()

  const numUsers = usersSnapshot.docs.length

  await usersSnapshot.docs.reduce(
    (p, userDoc, index) =>
      p
        .then(() => {
          console.log(`Cronjob status: ${index} / ${numUsers}`)
          // update the user's discord roles
          return coldUpdateRolesForUser(
            client,
            (userDoc.data() as User).userId,
            userDoc,
            guildConfigsSnapshot
          ).catch((error) => {
            console.log(
              `Failed to update roles for ${(userDoc.data() as User).wallet}`
            )
            console.error(error)
          })
        })
        .then(
          // delay for one second between processing each user
          () => new Promise((resolve) => setTimeout(() => resolve(null), 1500))
        ),
    new Promise((resolve, reject) => resolve(null))
  )

  console.log('Finished cronjob!')
}
