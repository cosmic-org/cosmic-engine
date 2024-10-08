"use client";

import { useEffect, useState } from "react";
import { Client, Session } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";

const ROOM_NAME = "global";

export const ChatComponent = () => {
  interface Message {
    message_id: string;
    username: string;
    create_time: string;
    content: {
      data: string;
    };
  }

  const [messages, setMessages] = useState<Message[]>([]);

  const authenticate = async () => {
    const client = new Client("defaultkey", "127.0.0.1", "7350");

    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }

    const session = await client.authenticateDevice(deviceId, true);
    localStorage.setItem("user_id", session.user_id || "");

    sessionHandler(client, session);
  };

  const sessionHandler = (client: Client, session: Session) => {
    const socket = client.createSocket(false);

    socket.onchannelmessage = message => {
      const newMessage = {
        message_id: message.message_id,
        username: message.username,
        create_time: message.create_time,
        content: message.content,
      };

      setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    socket.connect(session, true).then(() => {
      // join default room
      socket.joinChat(ROOM_NAME, 1, true, false).then(chatInfo => {
        const data = {
          data: session.username + " has joined the chat",
        };

        // send message
        socket.writeChatMessage(chatInfo.id, data);
      });
    });
  };

  useEffect(() => {
    authenticate();
  }, []);

  return (
    <>
      <p className="my-2 font-medium">Community Chat</p>

      {messages.length > 0 && (
        <div style={{ height: "180px", marginBottom: "1em", overflowY: "scroll" }}>
          {messages.map(message => (
            <div key={message.message_id} className="mb-4 p-2 border rounded shadow-sm">
              <div className="font-bold">{message.username}</div>
              <div className="text-xs text-gray-500">
                <span>{new Date(message.create_time).toLocaleTimeString()}</span>
              </div>
              <div className="mt-0">
                <p>{message.content.data}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
