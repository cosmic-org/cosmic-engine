import { isAddress } from "../node_modules/ethers/lib.commonjs/ethers";
import validate from "../node_modules/uuid/dist/cjs/validate";
import { createHmac } from "crypto";

interface PlayerScore {
    walletId: string;
    score: number;
}

interface StartTournamentPayload {
    gameName: string;
    playerId: string,
    tournamentId: string,
    token: string,
    walletAddress: string,
    playerIp: string,
};

interface EndTournamentPayload {
    gameName: string;
    playerId: string,
    tournamentId: string,
    token: string,
    score: number,
    otherPlayerScores: PlayerScore[]
}

const baseUrl = "https://backend.dev.outplay.games";

function getDynamicEnv(key: string): string {
    return process.env[key] || "";
}

const getClientCredentials = (gameName: string): { clientId: string, clientSecret: string } => {
    const clientId = getDynamicEnv(`${gameName}_CLIENT_ID`);
    const clientSecret = getDynamicEnv(`${gameName}_CLIENT_SECRET`);

    if (clientId === "" || clientSecret === "") {
        throw new Error("Client credentials invalid");
    }

    return { clientId, clientSecret };
}

const generateRequestParams = (params: Record<string, unknown>): Record<string, unknown> => {
    const { clientId, clientSecret } = getClientCredentials('Game Identifier To Be Decided');

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

function startTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
    try {
        let startTournamentPayload: StartTournamentPayload = JSON.parse(payload);

        if (!validate(startTournamentPayload.playerId)) {
            throw new Error("Invalid player ID: " + startTournamentPayload.playerId);
        }

        if (!validate(startTournamentPayload.tournamentId)) {
            throw new Error("Invalid tournament ID: " + startTournamentPayload.tournamentId);
        }

        if (!startTournamentPayload.token) {
            throw new Error("Invalid token: " + startTournamentPayload.token);
        }

        if (startTournamentPayload.walletAddress && startTournamentPayload.walletAddress !== "") {
            if (!isAddress(startTournamentPayload.walletAddress)) {
                throw new Error("Invalid wallet address: " + startTournamentPayload.walletAddress);
            }
        }

        startTournamentPayload.walletAddress = startTournamentPayload.walletAddress || "";
        startTournamentPayload.playerIp = ctx.clientIp as string || "";

        const authData = generateRequestParams({
            playerId: startTournamentPayload.playerId,
            tournamentI: startTournamentPayload.tournamentId,
            token: startTournamentPayload.token,
            walletAddress: startTournamentPayload.walletAddress,
        });

        const apiUrl = `${baseUrl}/tournament-round/$tournamentId/start`;

        const options = {
            method: 'post',
            headers: {
                "Content-Type": "application/json",
                "x-arcadia-player-ip": startTournamentPayload.playerIp,
            },
            body: JSON.stringify(startTournamentPayload)
        };

        const response = nk.httpRequest(
            apiUrl,
            "post",
            options.headers,
            options.body
        );
    } catch (error) {
        throw new Error((error as any)?.message || "Something went wrong");
    }
}

function endTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
    try {
        const endTournamentPayload: EndTournamentPayload = JSON.parse(payload);

        if (!validate(endTournamentPayload.playerId)) {
            throw new Error("Invalid player ID: " + endTournamentPayload.playerId);
        }

        if (!validate(endTournamentPayload.tournamentId)) {
            throw new Error("Invalid t tournament ID: " + endTournamentPayload.tournamentId);
        }

        if (!endTournamentPayload.token) {
            throw new Error("Invalid token: " + endTournamentPayload.token);
        }

        if (typeof endTournamentPayload.score !== "number") {
            throw new Error("Invalid score: " + endTournamentPayload.score);
        }

        const authData = generateRequestParams({
            playerId: endTournamentPayload.playerId,
            tournamentI: endTournamentPayload.tournamentId,
            token: endTournamentPayload.token,
            score: endTournamentPayload.score
        });

        const apiUrl = `${baseUrl}/tournament-round/$tournamentId/end`;

        const options = {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(endTournamentPayload)
        };

        const response = nk.httpRequest(
            apiUrl,
            "post",
            options.headers,
            options.body
        );
    } catch (error) {
        throw new Error((error as any)?.message || "Something went wrong");
    }
}