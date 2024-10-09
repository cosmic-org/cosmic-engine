"use client";

import { useEffect, useState } from "react";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Client } from "@heroiclabs/nakama-js";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { v4 as uuidv4 } from "uuid";
import { notification } from "~~/utils/scaffold-eth";

export const DatabaseProfileCard = () => {
  const [claiming, setClaiming] = useState(false);
  const [accountWallet, setAccountWallet] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const nakamaClient = new Client("defaultkey", "127.0.0.1", "7350");
    setClient(nakamaClient);
  }, []);

  const claimTokens = async (burner: string) => {
    if (!client) return;

    setClaiming(true);

    const deviceId = localStorage.getItem("deviceId");

    if (deviceId) {
      const session = await client.authenticateDevice(deviceId, true);
      client.rpc(session, "awardCoins", { data: burner }).then(response => {
        const payload = response.payload as { success?: boolean; tokensClaimed?: number; url: string } | undefined;

        if (payload?.success) {
          notification.success(payload.tokensClaimed + " SOL claimed successfully");
        }

        {
          notification.success(payload?.url);
        }

        setAccountWallet("{}");

        setClaiming(false);
      });
    }
  };

  const authenticate = async () => {
    if (!client) return;

    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }

    const session = await client.authenticateDevice(deviceId, true);

    const account = await client.getAccount(session);
    localStorage.setItem("user_id", session.username || "");

    setAccountWallet(account.wallet || null);
  };

  const { balance, burner } = useGlobalContext();

  useEffect(() => {
    authenticate();
  }, [client]);

  return (
    <>
      <p className="my-2 font-medium">Player Profile</p>
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const connected = mounted && account && chain;

          return (
            <>
              {(() => {
                if (!connected) {
                  return (
                    <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                      Initializing Wallet
                    </button>
                  );
                }

                return (
                  <div className="flex flex-col items-center mr-1">
                    <span className="text-xs">
                      <b>Name:</b>{" "}
                      {localStorage
                        .getItem("user_id")
                        ?.toString()
                        .replace(/^(.{10}).*(.{10})$/, "$1...$2")}
                    </span>

                    <span className="text-xs mt-1">
                      <b>Account:</b> {burner?.publicKey.toString().replace(/^(.{4}).*(.{4})$/, "$1...$2")}
                      <button
                        type="button"
                        className="mt-2 px-2 py-1 text-white rounded"
                        onClick={() => {
                          const defaultKeypair = localStorage.getItem("default_keypair");
                          if (defaultKeypair) {
                            navigator.clipboard.writeText(defaultKeypair);
                            notification.success("PK copied to clipboard");
                          } else {
                            notification.error("No PK found in local storage");
                          }
                        }}
                      >
                        📋
                      </button>
                    </span>
                    <span className="text-xs mt-1">
                      <b>Balance:</b> {balance}
                    </span>

                    {accountWallet != undefined && accountWallet != "{}" && (
                      <>
                        <table className="table-auto text-xs mt-2">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Item</th>
                              <th className="px-4 py-2">Amount</th>
                              <th className="px-4 py-2">Tokens</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(JSON.parse(accountWallet)).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border px-4 py-2">{key}</td>
                                <td className="border px-4 py-2">{String(value)}</td>
                                {key === "wins" && (
                                  <td className="border px-4 py-2">{String(Number(value) * 0.1)} SOL</td>
                                )}
                                {key === "plays" && (
                                  <td className="border px-4 py-2">{String(Number(value) * 0.02)} SOL</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {burner && accountWallet.length > 0 && (
                          <button
                            type="button"
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                            disabled={claiming}
                            onClick={() => claimTokens(burner?.publicKey.toString())}
                          >
                            Claim Tokens
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
                      onClick={() =>
                        // redirect to xoxo
                        (window.location.href = "/xoxo")
                      }
                    >
                      Play Tic-Tac-Monke
                    </button>
                  </div>
                );
              })()}
            </>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
};
