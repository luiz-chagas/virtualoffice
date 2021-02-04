import {
  WebClient,
  ChatPostMessageArguments,
  WebAPICallResult,
} from "@slack/web-api";
import { EventEmitter } from "events";
import { propOr } from "ramda";
import { log } from "./logger";
import express from "express";

export const makeSlackService = (events: EventEmitter) => {
  const token = process.env.SLACK_TOKEN;
  const web = new WebClient(token);
  const router = express.Router();

  router.get("/players", async (req, res) => {
    const { text } = req.body;
    if (text !== "list") {
      return res.json({
        response_type: "ephemeral",
        text: "Command not found. Supported commands: `list`",
      });
    }

    const players = await listPlayers(events);
    res.status(200).json({
      response_type: "ephemeral",
      text:
        Object.entries(players)
          .map(([room, names]) => `${room}: ${names.join(", ")}`)
          .join("\n") || "The office is currentl empty.",
    });
  });

  router.get("/", (req, res) => {
    res.status(200).send("Hello Slack");
  });

  events.on("firstPlayerJoined", postMessageOnChannel(web));

  return { router };
};

const listPlayers = (events: EventEmitter) =>
  new Promise<Record<string, string[]>>((resolve, reject) => {
    events.once("listPlayersRes", (players) => {
      return resolve(players);
    });
    events.emit("listPlayersReq");
  });

const postMessageOnChannel = (web: WebClient) => async (name: string) => {
  try {
    const targetChannel = propOr("virtual_office_test", "CHANNEL")(process.env);

    const channels = await listChannels(web);
    const channel = channels.find((channel) => channel.name === targetChannel);

    if (!channel) {
      throw Error(`Failed to find channel ${targetChannel}`);
    }

    sendMessage(web)({
      channel: channel.id,
      text: "",
      blocks: makeMessage(name),
    });
  } catch (err) {
    log(err.message ?? err);
  }
};

const makeMessage = (name: string) => {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${name} is all alone in the Virtual Office. Come hang with them!`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Join Office",
        },
        url: "https://cremaoffice.fun",
      },
    },
  ];
};

const listChannels = (slack: WebClient) =>
  slack.conversations
    .list({
      limit: 1000,
      exclude_archived: true,
    })
    .then((next) => {
      const response = next as ListChannelResponse;
      if (response.error || !response.ok) {
        throw Error("Failed to list channels");
      }
      return response.channels;
    });

const sendMessage = (slack: WebClient) => (args: ChatPostMessageArguments) =>
  slack.chat.postMessage(args);

interface ListChannelResponse extends WebAPICallResult {
  channels: Channel[];
}

type Channel = {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  created: number;
  creator: string;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_ext_shared: boolean;
  is_org_shared: boolean;
  pending_shared: any[];
  is_pending_ext_shared: boolean;
  is_member: boolean;
  is_private: boolean;
  is_mpim: boolean;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names: any[];
  num_members: number;
};
