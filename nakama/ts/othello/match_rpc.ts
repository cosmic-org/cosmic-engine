import { GameMode } from "./game-state";
import { moduleName } from "./match_handler";

// Payload for an RPC request to find a match.
export interface RpcFindMatchRequest {
    // User can choose whether to play with AI or Another player
    mode: GameMode;
}

// Payload for an RPC response containing match IDs the user can join.
export interface RpcFindMatchResponse {
    // One or more matches that fit the user's request.
    matchIds: string[];
}

export const rpcFindMatch: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    try {
        if (!ctx.userId) {
            throw Error('User Id not found');
        }
    
        if (!payload) {
            throw Error('Invalid payload');
        }

        let request = JSON.parse(payload) as RpcFindMatchRequest;
        
        let matches: nkruntime.Match[];

        const query = `+label.open:1 +label.mode:${request.mode === GameMode.PlayerVsAI ? 1 : 0}`;
        matches = nk.matchList(10, true, null, 1, 1, query);

        let matchIds: string[] = [];
        if (matches.length > 0) {
            // There are one or more ongoing matches the user could join.
            matchIds = matches.map(m => m.matchId);
        } else {
            // No available matches found, create a new one.
            if(request.mode === GameMode.PlayerVsAI) {
                let matchId = nk.matchCreate(moduleName, { ai: true });
                let res: RpcFindMatchResponse = { matchIds: [matchId] };

                return JSON.stringify(res);
            } else if (request.mode === GameMode.PlayerVsPlayer) {
                throw Error('Player vs Player mode is not supported now');
            } else {
                throw Error('Unsupported mode, please check the mode selection');
            }
        }

        let res: RpcFindMatchResponse = { matchIds };
        return JSON.stringify(res);
    } catch (e) {
        logger.error(JSON.stringify({
            file: "nakama/ts/othello/match_rpc.ts",
            methodName: "rpcFindMatch",
            message: e.message || JSON.stringify(e.message)
        }));
        throw e;
    }
}
