// Copyright 2020 The Nakama Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const rpcIdRewards = 'rewards_js';
const rpcIdFindMatch = 'find_match_js';
const LEADERBOARD_ID = "radar";

function createLeaderboard(nk: nkruntime.Nakama, id: string) {
    // let id = '4ec4f126-3f9d-11e7-84ef-b7c182b36521';
    let authoritative = false;
    let sort = nkruntime.SortOrder.DESCENDING;
    let operator = nkruntime.Operator.BEST;
    let reset = '*/1 * * * *'; // Every minute
    let metadata = {
      weatherConditions: 'rain',
    };
    try {
        nk.leaderboardCreate(id, authoritative, sort, operator, reset, metadata);
    } catch(error) {
        // Handle error
    }
}

let leaderboardReset: nkruntime.LeaderboardResetFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, leaderboard: nkruntime.Leaderboard, reset: number) {
    if (leaderboard.id != LEADERBOARD_ID) {    
        return;
    }

    // Get top 3
    let result = nk.leaderboardRecordsList(leaderboard.id, [], 3, undefined, reset);

    let walletUpdates : nkruntime.WalletUpdate[] = [];
  
    if (result && result.records) {
        result.records.forEach(function (r) {
        let reward = 100;
        
        walletUpdates.push({
            userId: r.ownerId,
            changeset: { coins: reward},
            metadata: {}
        })
        });
    }
  
    nk.walletsUpdate(walletUpdates, true);
  }


function rpcCreateTournament(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, id: string): string {
    createLeaderboard(nk, id);    

    logger.info("leaderboard " + id + " created");
    return JSON.stringify({ success: true });

}  

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerRpc(rpcIdRewards, rpcReward);

    initializer.registerRpc(rpcIdFindMatch, rpcFindMatch);

    initializer.registerMatch(moduleName, {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal,
    });

    createLeaderboard(nk, LEADERBOARD_ID);

    initializer.registerRpc("healthcheck", rpcHealthcheck);
    initializer.registerRpc("createTournament", rpcCreateTournament);
    initializer.registerLeaderboardReset(leaderboardReset);


    logger.info('JavaScript logic loaded.');
}