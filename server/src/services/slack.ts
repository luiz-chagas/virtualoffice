import {
  WebClient,
  ChatPostMessageArguments,
  WebAPICallResult,
} from "@slack/web-api";
import { EventEmitter } from "events";

export const makeSlackService = (events: EventEmitter) => {
  const token = process.env.SLACK_TOKEN;
  const web = new WebClient(token);

  events.on("firstPlayerJoined", postMessageOnChannel(web));
};

const postMessageOnChannel = (web: WebClient) => async (name: string) => {
  try {
    const targetChannel = process.env.CHANNEL;

    const channels = await listChannels(web);

    if (!channels) return;

    const channel = channels.find((channel) => channel.name === targetChannel);

    if (!channel) return;

    const slackMessage = `${name} is all alone in the Virtual Office. Come hang with them!`;

    sendMessage(web)({
      channel: channel.id,
      text: slackMessage,
    });
  } catch (err) {
    console.error(err);
  }
};

export const listChannels = (slack: WebClient) =>
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
    })
    .catch((err: Error) => {
      console.error(err);
      return null;
    });

export const sendMessage = (slack: WebClient) => (
  args: ChatPostMessageArguments
) =>
  slack.chat
    .postMessage(args)
    .then((res) => res as PostChatResponse)
    .catch((err: Error) => {
      console.error(err);
      return null;
    });

export interface ListChannelResponse extends WebAPICallResult {
  channels: Channel[];
}

type Attachment = {
  text: string;
  id: number;
  fallback: string;
};

type Message = {
  text: string;
  username: string;
  bot_id: string;
  attachments: Attachment[];
  type: "message";
  subtype: "bot_message";
  ts: string;
};

export interface PostChatResponse extends WebAPICallResult {
  message: Message;
  ts: string;
  channel: string;
}

export type Channel = {
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
