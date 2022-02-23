import { Get, Router } from "@discordx/koa";
import type { Context } from "koa";
import { client } from "../main.js";
import { getResultFromURL, FlashsignerAction } from '@nervina-labs/flashsigner'
import NodeRsa from 'node-rsa';
import { Buffer } from 'buffer';

@Router()
export class API {
  @Get("/")
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
    `;
  }

  @Get()
  guilds(context: Context) {
    context.body = `${client.guilds.cache.map((g) => `${g.id}: ${g.name}\n`)}`;
  }

  @Get('/sign-success')
  verifySig(context: Context) {
    context.body = context.request;

    const { flashsigner_data } = context.request.query;
    const data = JSON.parse(flashsigner_data as string);
    console.log(data)
    const { lock, message, sig: signature } = data.result;
    const response = {
      message,
      // 如果是从 response url 直接解析 signature 则需要取前 520 个字符
      // 如果从 flashsigner-sdk 得到的参数则可以直接传入验签
      "signature": signature.slice(520),
      "pubkey": signature.slice(0, 520)
    }
    console.log('response: ', response)

    const key = new NodeRsa()
    const buf = Buffer.from(response.pubkey, 'hex')
    const e = buf.slice(0, 4).reverse()
    const n = buf.slice(4).reverse()
    key.importKey({ e, n }, 'components-public')
    key.setOptions({ signingScheme: 'pkcs1-sha256' })
    const result = key.verify(
      Buffer.from(response.message),
      Buffer.from(response.signature, 'hex')
    )

    console.log(result)
  }
}
