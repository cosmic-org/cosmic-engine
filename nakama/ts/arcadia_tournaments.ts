import validate from "../node_modules/uuid/dist/cjs/validate";

function isEvmAddress(address) {
    return (/^(0x){1}[0-9a-fA-F]{40}$/i.test(address));
}

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

const getClientCredentials = (environmentalVariables: {[key: string]: string}, gameName: string): { clientId: string, clientSecret: string } => {
    const clientId = environmentalVariables[`${gameName}_CLIENT_ID`];
    const clientSecret = environmentalVariables[`${gameName}_CLIENT_SECRET`];

    if (!clientId || !clientSecret || clientId === "" || clientSecret === "") {
        throw new Error("Client credentials invalid");
    }

    return { clientId, clientSecret };
}

const generateAuthToken = (nk: nkruntime.Nakama, clientId: string, clientSecret: string, gameName: string, playerId: string, tournamentId: string): string => {
    const secret = `${tournamentId}::${clientId}::${clientSecret}`.toLowerCase();

    const authToken = nk.jwtGenerate("HS256", secret, {
        sub: playerId, // Subject (usually a user ID)
        iat: Math.floor(Date.now() / 1000), // Issued at time
        exp: Math.floor(Date.now() / 1000) + (3 * 60), // Expiration time (2 mins from now)
        iss: 'nakama-server', // Issuer (optional)
    });

    return authToken;
}

export function rpcStartArcadiaTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
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

        if (!token || token === "") {
            throw new Error("Invalid token: " + token);
        }

        if (walletAddress && walletAddress !== "") {
            if (!isEvmAddress(walletAddress)) {
                throw new Error("Invalid wallet address: " + walletAddress);
            }
        }

        walletAddress = walletAddress || "";
        playerIp = ctx.clientIp as string || "";

        const environmentalVariables = ctx.env;

        const baseUrl = environmentalVariables["TOURNAMENT_API_URL"];

        const { clientId, clientSecret } = getClientCredentials(environmentalVariables, gameName);

        const authToken = generateAuthToken(nk, clientId, clientSecret, gameName, playerId, tournamentId);

        const apiUrl = `${baseUrl}/tournament-round/${tournamentId}/start`;

        const options = {
            headers: {
                "Content-Type": "application/json",
                "x-arcadia-player-ip": playerIp,
            },
            body: JSON.stringify({
                playerId,
                authToken,
                clientToken: token,
                clientId,
                walletAddress
            })
        };

        (async () => {
            try {
                await nk.httpRequest(
                    apiUrl,
                    "post",
                    options.headers,
                    options.body
                );
            } catch (e) {
                logger.error(e);
            }
        })();

        return JSON.stringify({ code: 200, message: "OK" });
    } catch (error) {
        throw new Error((error as any)?.message || "Something went wrong");
    }
}

export function rpcEndArcadiaTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
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

        if (!token || token === "") {
            throw new Error("Invalid token: " + token);
        }

        if (typeof score !== "number" || score < 0) {
            throw new Error("Invalid score: " + score);
        }

        otherPlayerScores?.forEach((scores) => {
            if (typeof scores.score !== "number" || scores.score < 0) {
                throw new Error("Invalid score: " + scores.score);
            }

            if (!isEvmAddress(scores.walletAddress)) {
                throw new Error("Invalid wallet address: " + scores.walletAddress);
            }
        })

        const environmentalVariables = ctx.env;

        const baseUrl = environmentalVariables["TOURNAMENT_API_URL"];

        const { clientId, clientSecret } = getClientCredentials(environmentalVariables, gameName);

        const authToken = generateAuthToken(nk, clientId, clientSecret, gameName, playerId, tournamentId);

        const apiUrl = `${baseUrl}/tournament-round/${tournamentId}/end`;

        const options = {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId,
                authToken,
                clientToken: token,
                clientId,
                score,
                otherPlayerScores
            })
        };

        (async () => {
            try {
                await nk.httpRequest(
                    apiUrl,
                    "post",
                    options.headers,
                    options.body
                );
            } catch (e) {
                logger.error(e);
            }
        })();

        return JSON.stringify({ code: 200, message: "OK" });
    } catch (error) {
        throw new Error((error as any)?.message || "Something went wrong");
    }
}