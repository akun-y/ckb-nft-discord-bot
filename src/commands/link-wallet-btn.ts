
import {
  ButtonInteraction,
  CommandInteraction,
  MessageButton,
  MessageActionRow,
} from "discord.js";
import { ButtonComponent, Discord, Slash } from "discordx";
import jwt from "jsonwebtoken";
import { generateSignMessageURL } from "@nervina-labs/flashsigner"
import * as dotenv from "dotenv";

dotenv.config();

const DISCORD_VERIFICATION_SECRET = process.env.DISCORD_VERIFICATION_SECRET || "";
console.log("DISCORD_VERIFICATION_SECRET: ", process.env.DISCORD_VERIFICATION_SECRET)
const WALLET_SIGN_REDIRECT_URL = process.env.WALLET_SIGN_REDIRECT_URL || "http://localhost:3000/sign-success";
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
      { userId: interaction.user.id, guildId: interaction.guildId },
      DISCORD_VERIFICATION_SECRET,
      { expiresIn: "1h" }
    );

    const url = generateSignMessageURL(WALLET_SIGN_REDIRECT_URL, { message: token, isRaw: true });

    interaction.reply({
      content: `Greetings from the Rostra Guild Assistant! Please click [here](${url}) to link your terra wallet with your discord account.`,
      ephemeral: true,
    });

  }
}