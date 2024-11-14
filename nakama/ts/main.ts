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

import { rpcEndArcadiaTournament, rpcStartArcadiaTournament } from "./arcadia_tournaments";
import { rpcReward } from "./daily_rewards";
import { rpcHealthcheck } from "./healthcheck";
import { matchInit, matchJoin, matchJoinAttempt, matchLeave, matchLoop, matchSignal, matchTerminate, moduleName } from "./match_handler";
import { 
    matchInit as othelloMatchInit, 
    matchJoin as othelloMatchJoin, 
    matchJoinAttempt as othelloMatchJoinAttempt, 
    matchLoop as othelloMatchLoop,
    matchLeave as othelloMatchLeave,  
    matchSignal as othelloMatchSignal , 
    matchTerminate as othelloMatchTerminate } from "./othello/match_handler";
import { rpcFindMatch } from "./match_rpc";
import { rpcFindMatch as othelloRpcFindMatch } from "./othello/match_rpc";
import { moduleName as OthelloModuleName } from "./othello/match_handler"

const rpcIdRewards = 'rewards_js';
const rpcIdFindMatch = 'find_match_js';
const othelloRpcIdFindMatch = 'othello_find_match_js';
const rpcIdAwardCoins = 'awardCoins';
const LEADERBOARD_ID = "radar";
const startArcadiaTournament = "start_arcadia_tournament";
const endArcadiaTournament = "end_arcadia_tournament";

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

function sendTokens(receivingWallet: string, tokensClaimed: number, nk: nkruntime.Nakama, logger: nkruntime.Logger) {
    // create data format
    const data = {
        "walletAddresses": [receivingWallet],
        "amounts": [tokensClaimed]
    };

    const apiUrl = 'http://demo.cosmiclabs.org:3000/api/tokens/distribute';
    const apiKey = "f3d37ce6-3766-4027-a388-1090f512f601";

    const options = {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
        },
        body: JSON.stringify(data)
    };

    const response = nk.httpRequest(
        apiUrl, 
        "post",
        options.headers,
        options.body);

    if (response.code > 299) {
        logger.error('Error distributing tokens: ' + response.body);
        return null;
    }
    else {
        logger.info('Tokens distributed successfully: ' + response.body);
        const body = JSON.parse(response.body);
        const transactionUrl = body.transactionUrl;
        return transactionUrl;
    }
}

function rpcAwardCoins(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, data: string): string {
    if (ctx.userId) {
        // get user wallet info
        const account: nkruntime.Account = nk.accountGetId(ctx.userId);
        const wallet: nkruntime.Wallet = account.wallet;

        if (wallet.wins || wallet.plays) {
            const wins = Number(wallet.wins);
            const plays = Number(wallet.plays);

            let tokensClaimed = wins * 0.1 + plays * 0.02;

            // get wallet to send tokens to
            const receivingWallet = JSON.parse(data).data;

            // initiate local fetch request to tokens/distribute
            const url = sendTokens(receivingWallet, tokensClaimed, nk, logger);

            return JSON.stringify({ success: true, tokensClaimed: tokensClaimed, url: url });
        }

    }
    
    return JSON.stringify({ success: false });

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

    initializer.registerRpc(othelloRpcIdFindMatch, othelloRpcFindMatch);

    initializer.registerMatch(OthelloModuleName, {
        matchInit: othelloMatchInit,
        matchJoinAttempt: othelloMatchJoinAttempt,
        matchJoin: othelloMatchJoin,
        matchLeave: othelloMatchLeave,
        matchLoop: othelloMatchLoop,
        matchTerminate: othelloMatchTerminate,
        matchSignal: othelloMatchSignal,
    });

    createLeaderboard(nk, LEADERBOARD_ID);

    initializer.registerRpc("healthcheck", rpcHealthcheck);
    initializer.registerRpc("createTournament", rpcCreateTournament);
    initializer.registerLeaderboardReset(leaderboardReset);
    initializer.registerRpc(rpcIdAwardCoins, rpcAwardCoins);

    initializer.registerRpc(startArcadiaTournament, rpcStartArcadiaTournament);
    initializer.registerRpc(endArcadiaTournament, rpcEndArcadiaTournament);


    logger.info('JavaScript logic loaded.');
}

// Reference InitModule to avoid it getting removed on build
!InitModule && InitModule.bind(null);