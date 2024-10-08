"use client";

import { useEffect, useState } from "react";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Client } from "@heroiclabs/nakama-js";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { v4 as uuidv4 } from "uuid";

export const DatabaseProfileCard = () => {
  const [accountWallet, setAccountWallet] = useState<string | null>(null);

  // const saveToDB = async (account: string) => {
  //   const client = new Client("defaultkey", "127.0.0.1", "7350");

  //   // Authenticate with the Nakama server using Device Authentication.
  //   const session = await client.authenticateDevice(account, true);
  //   console.info("Successfully authenticated:", session);
  // };

  const authenticate = async () => {
    const client = new Client("defaultkey", "127.0.0.1", "7350");

    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }

    const session = await client.authenticateDevice(deviceId, true);
    localStorage.setItem("user_id", session.user_id || "");

    // save wallet to state
    const account = await client.getAccount(session);
    setAccountWallet(account.wallet || "");
  };

  const { burner } = useGlobalContext(); //, balance, setBalance, cluster, connection, loading } =

  useEffect(() => {
    authenticate();
  }, []);

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
                  <>
                    <div className="flex flex-col items-center mr-1">
                      <span className="text-xs">
                        ID:{" "}
                        {localStorage
                          .getItem("user_id")
                          ?.toString()
                          .replace(/^(.{4}).*(.{4})$/, "$1...$2")}
                      </span>

                      <span className="text-xs">
                        Solana: {burner?.publicKey.toString().replace(/^(.{4}).*(.{4})$/, "$1...$2")}
                      </span>
                      <span className="text-xs">
                        Ethereum: {account.address.replace(/^(.{4}).*(.{4})$/, "$1...$2")}
                      </span>

                      {accountWallet && (
                        <table className="table-auto text-xs mt-2">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Item</th>
                              <th className="px-4 py-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(JSON.parse(accountWallet)).map(([key, value]) => (
                              <tr key={key}>
                                <td className="border px-4 py-2">{key}</td>
                                <td className="border px-4 py-2">{String(value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
};
