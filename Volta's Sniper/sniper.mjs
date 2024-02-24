"use strict";

import fetch from "node-fetch";
import WebSocket from "ws";
import { SNIPER_GUILD_ID, SNIPER_SELF_TOKEN, URL_SNIPER_SELF_TOKEN, WEBHOOKS } from "./constructions.mjs";
import guilds from "./guilds.mjs";

class Sniper {
    constructor() {
        this.opcodes = {
            DISPATCH: 0,
            HEARTBEAT: 1,
            IDENTIFY: 2,
            RECONNECT: 7,
            HELLO: 10,
            HEARTBEAT_ACK: 11,
        };
        this.interval = null;
        this.createPayload = (data) => JSON.stringify(data);
        this.heartbeat = () => {
            return this.socket.send(this.createPayload({
                op: 1,
                d: {},
                s: null,
                t: "heartbeat",
            }));
        };
        this.connect = () => {
            this.socket = new WebSocket("wss://gateway.discord.gg");
            this.socket.on("open", () => {
                console.log("Discord WebSocket Açıldı");
                this.socket.on("message", async (message) => {
                    const data = JSON.parse(message);
                    if (data.op === this.opcodes.DISPATCH) {
                        if (data.t === "GUILD_UPDATE") {
                            const find = guilds[data.d.guild_id];
                            console.log(data.d);
                            if (typeof find?.vanity_url_code === 'string' && find.vanity_url_code !== data.d.vanity_url_code) {
                                const startTime = Date.now();
                                fetch(`https://canary.discord.com/api/v9/guilds/${SNIPER_GUILD_ID}/vanity-url`, {
                                    method: "PATCH",
                                    body: this.createPayload({
                                        code: find.vanity_url_code,
                                    }),
                                    headers: {
                                        Authorization: URL_SNIPER_SELF_TOKEN,
                                        "Content-Type": "application/json",
                                    },
                                }).then(async (res) => {
                                    try {
                                        if (res.ok) {
                                            const endTime = Date.now();
                                            const snipeTime = endTime - startTime;

                                            await WEBHOOKS.SUCCESS(`https://discord.gg/invite/${find.vanity_url_code} Oopsie! ||@everyone|| ${snipeTime}ms`);
                                            console.log("Vanity URL Başarıyla Claimlendi");
                                        } else {
                                            const error = await res.json();
                                            await WEBHOOKS.FAIL(`Fail **\`${find.vanity_url_code}\`**.
                                            \`\`\`JSON
                                            ${JSON.stringify(error, null, 4)}
                                            \`\`\`
                                            `);
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    } finally {
                                        delete guilds[data.d.guild_id];
                                    }
                                }).catch((err) => {
                                    console.error(err);
                                    delete guilds[data.d.guild_id];
                                });
                            }
                        } else {
                            if (data.t === "READY") {
                                console.log("VoltaXSniper Aktif");
                                data.d.guilds
                                    .filter((e) => typeof e.vanity_url_code === "string")
                                    .forEach((e) => (guilds[e.id] = { vanity_url_code: e.vanity_url_code }));
                                await WEBHOOKS.INFO(
                                    `${Object.keys(guilds).length} \n ${Object.entries(guilds)
                                        .map(([key, value]) => `\`${value.vanity_url_code}\``)
                                        .join(", ")}`
                                );
                            } else if (data.t === "GUILD_CREATE") {
                                guilds[data.d.id] = { vanity_url_code: data.d.vanity_url_code };
                            } else if (data.t === "GUILD_DELETE") {
                                const find = guilds[data.d.id];
                                setTimeout(() => {
                                    if (typeof find?.vanity_url_code === "string") {
                                        fetch(`https://canary.discord.com/api/v9/guilds/${SNIPER_GUILD_ID}/vanity-url`, {
                                            method: "PATCH",
                                            body: this.createPayload({
                                                code: find.vanity_url_code,
                                            }),
                                            headers: {
                                                Authorization: URL_SNIPER_SELF_TOKEN,
                                                "Content-Type": "application/json",
                                            },
                                        }).then(async (res) => {
                                            if (res.ok) {
                                                await WEBHOOKS.SUCCESS(`https://discord.gg/invite/${find.vanity_url_code}\ Oopsie! ||@everyone|| ${snipeTime}ms`);
                                                console.log("Vanity URL Başarıyla Claimlendi");
                                            } else {
                                                const error = await res.json();
                                                await WEBHOOKS.FAIL(`Fail **\`${find.vanity_url_code}\`**.
                                                \`\`\`JSON
                                                ${JSON.stringify(error, null, 4)}
                                                \`\`\`
                                                `);
                                            }
                                            delete guilds[data.d.guild_id];
                                        }).catch(err => {
                                            console.log(err);
                                            delete guilds[data.d.guild_id];
                                        });
                                    }
                                }, 25);
                            }
                        }
                    } else if (data.op === this.opcodes.RECONNECT)
                        return this.reconnect();
                    else if (data.op === this.opcodes.HELLO) {
                        clearInterval(this.interval);
                        this.interval = setInterval(() => this.heartbeat(), data.d.heartbeat_interval);
                        this.socket.send(this.createPayload({
                            op: this.opcodes.IDENTIFY,
                            d: {
                                token: SNIPER_SELF_TOKEN,
                                intents: 1,
                                properties: {
                                    os: "Linux",
                                    browser: "Maxthon",
                                    device: "Computer",
                                },
                            },
                        }));
                    }
                });
                this.socket.on("close", (reason) => {
                    console.log('Discord Websocket Kapatıldı', reason);
                    return this.reconnect();
                });
                this.socket.on("error", (error) => {
                    console.log(error);
                    this.reconnect();
                });
            });
        }

        this.reconnect = () => {
            console.log('Yeniden bağlanılıyor...');
            setTimeout(() => {
                this.connect();
            }, 5000);
        }

        this.connect();
    }
}

export default Sniper;
