
import {
  ButtonInteraction,
  CommandInteraction,
  MessageButton,
  MessageActionRow,
  User,
  GuildMember,
} from "discord.js";
import { ButtonComponent, Discord, Slash, SlashOption } from "discordx";
import jwt from "jsonwebtoken";
import { generateSignMessageURL } from "@nervina-labs/flashsigner"
import * as dotenv from "dotenv";

dotenv.config();

const DISCORD_VERIFICATION_SECRET = process.env.DISCORD_VERIFICATION_SECRET || "";
console.log("DISCORD_VERIFICATION_SECRET: ", process.env.DISCORD_VERIFICATION_SECRET)
@Discord()
export abstract class LinkWallet {
  @Slash("link-wallet-btn")
  async showBtn(
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    const helloBtn = new MessageButton()
      .setLabel("Link wallet")
      .setEmoji("👋")
      .setStyle("PRIMARY")
      .setCustomId("link-wallet-btn");

    const row = new MessageActionRow().addComponents(helloBtn);

    interaction.editReply({
      content: "Click to link with your wallet.",
      components: [row],
    });
  }

  @ButtonComponent("link-wallet-btn")
  mybtn(interaction: ButtonInteraction) {
    // interaction.reply({ content: `👋 ${interaction.member}`, ephemeral: true });
    const token = jwt.sign(
      { userID: interaction.user.id },
      DISCORD_VERIFICATION_SECRET,
      { expiresIn: "1h" }
    );
    const successURL = "http://localhost:3000/"
    const url = generateSignMessageURL(successURL, { message: token });

    interaction.reply({
      content: `Greetings from the Rostra Guild Assistant! Please click [here](${url}) to link your terra wallet with your discord account.`,
      ephemeral: true,
    });

  }
}