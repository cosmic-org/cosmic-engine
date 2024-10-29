import { isAddress } from "../node_modules/ethers/lib.commonjs/ethers";
import validate from "../node_modules/uuid/dist/cjs/validate";
import { createHmac } from "crypto";

interface PlayerScore {
    walletAddress: string;
    score: number;
}

interface StartTournamentPayload {
    gameName: string;
    playerId: string;
    tournamentId: string;
    token: string;
    walletAddress: string;
    playerIp: string;
};

interface EndTournamentPayload {
    gameName: string;
    playerId: string;
    tournamentId: string;
    token: string;
    score: number;
    otherPlayerScores: PlayerScore[];
}

// TODO: Needs to replace with ENV
const baseUrl = process.env.TOURNAMENT_API_URL;

function getDynamicEnv(key: string): string {
    return process.env[key] || "";
}

const getClientCredentials = (gameName: string): { clientId: string, clientSecret: string } => {
    // TODO: Needs to finalize the game identifier for unique api keys 
    const clientId = getDynamicEnv(`${gameName}_CLIENT_ID`);
    const clientSecret = getDynamicEnv(`${gameName}_CLIENT_SECRET`);

    if (clientId === "" || clientSecret === "") {
        throw new Error("Client credentials invalid");
    }

    return { clientId, clientSecret };
}

const generateRequestParams = (gameName: string, params: Record<string, unknown>): Record<string, unknown> => {
    const { clientId, clientSecret } = getClientCredentials(gameName);

    const nonce = new Date().getTime();

    params.nonce = nonce;
    params.clientId = clientId;

    const paramKeys = Object.keys(params);
    paramKeys.sort((firstEl, secondEl) => firstEl.localeCompare(secondEl));

    let tmpStr = "";
    paramKeys.forEach((paramKey) => {
        if (Object.prototype.hasOwnProperty.call(params, paramKey)) {
            const value =
                typeof params[paramKey] === "object"
                    ? JSON.stringify(params[paramKey])
                    : params[paramKey];
            tmpStr += `${paramKey}=${value}`;
        }
    });

    const hash = createHmac("sha512", clientSecret);
    hash.update(tmpStr);

    params.clientAccessToken = hash.digest("hex");

    return params;
}

function rpcStartTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    try {
        let {
            gameName,
            playerId,
            tournamentId,
            token,
            walletAddress,
            playerIp,
        }: StartTournamentPayload = JSON.parse(payload);


        if (!validate(playerId)) {
            throw new Error("Invalid player ID: " + playerId);
        }

        if (!validate(tournamentId)) {
            throw new Error("Invalid tournament ID: " + tournamentId);
        }

        if (!token) {
            throw new Error("Invalid token: " + token);
        }

        if (walletAddress && walletAddress !== "") {
            if (!isAddress(walletAddress)) {
                throw new Error("Invalid wallet address: " + walletAddress);
            }
        }

        walletAddress = walletAddress || "";
        playerIp = ctx.clientIp as string || "";

        const body = generateRequestParams(gameName, {
            playerId,
            tournamentId,
            token,
            walletAddress,
        });

        const apiUrl = `${baseUrl}/tournament-round/${tournamentId}/start`;

        const options = {
            headers: {
                "Content-Type": "application/json",
                "x-arcadia-player-ip": playerIp,
            },
            body: JSON.stringify(body)
        };

        nk.httpRequest(
            apiUrl,
            "post",
            options.headers,
            options.body
        );

        return JSON.stringify({ code: 200, message: "OK" });
    } catch (error) {
        throw new Error((error as any)?.message || "Something went wrong");
    }
}

function rpcEndTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    try {
        const {
            gameName,
            playerId,
            tournamentId,
            token,
            score,
            otherPlayerScores
        }: EndTournamentPayload = JSON.parse(payload);

        if (!validate(playerId)) {
            throw new Error("Invalid player ID: " + playerId);
        }

        if (!validate(tournamentId)) {
            throw new Error("Invalid t tournament ID: " + tournamentId);
        }

        if (!token) {
            throw new Error("Invalid token: " + token);
        }

        if (typeof score !== "number" || score < 0) {
            throw new Error("Invalid score: " + score);
        }

        otherPlayerScores.forEach((scores) => {
            if (typeof scores.score !== "number" || scores.score < 0) {
                throw new Error("Invalid score: " + scores.score);
            }

            if (!isAddress(scores.walletAddress)) {
                throw new Error("Invalid wallet address: " + scores.walletAddress);
            }
        })

        let data: Record<string, unknown> = {
            playerId,
            tournamentId,
            score,
            token,
        };

        if (otherPlayerScores.length > 0) {
            data["otherPlayerScores"] = otherPlayerScores;
        }

        const body = generateRequestParams(gameName, data);

        const apiUrl = `${baseUrl}/tournament-round/${tournamentId}/end`;

        const options = {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        };

        nk.httpRequest(
            apiUrl,
            "post",
            options.headers,
            options.body
        );

        return JSON.stringify({ code: 200, message: "OK" });
    } catch (error) {
        throw new Error((error as any)?.message || "Something went wrong");
    }
}