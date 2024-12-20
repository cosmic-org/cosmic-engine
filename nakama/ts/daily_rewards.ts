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

export function rpcReward(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!context.userId) {
        throw Error('No user ID in context');
    }

    // if (payload){
    //     throw Error('no input allowed');
    // }

    let objectId: nkruntime.StorageReadRequest = {
        collection: 'reward',
        key: 'daily',
        userId: context.userId,
    }
    let objects: nkruntime.StorageObject[];
    try {
        objects = nk.storageRead([ objectId ]);
    } catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }

    let dailyReward: any = {
        lastClaimUnix: 0,
    }
    objects.forEach(object => {
        if (object.key == 'daily') {
            dailyReward = object.value;
        }
    });

    let resp = {
        coinsReceived: 0,
    }

    let d = new Date();
    d.setHours(0,0,0,0);

    // If last claimed is before the new day grant a new reward!
    if (dailyReward.lastClaimUnix < msecToSec(d.getTime())) {
        resp.coinsReceived = 500;

        // Update player wallet.
        let changeset = {
            coins: resp.coinsReceived,
        }
        try {
            nk.walletUpdate(context.userId, changeset, {}, false);
        } catch (error) {
            logger.error('walletUpdate error: %q', error);
            throw error;
        }

        let notification: nkruntime.NotificationRequest = {
            code: 1001,
            content: changeset,
            persistent: true,
            subject: "You've received your daily reward!",
            userId: context.userId,
        }
        try {
            nk.notificationsSend([notification]);
        } catch (error) {
            logger.error('notificationsSend error: %q', error);
            throw error;
        }

        dailyReward.lastClaimUnix = msecToSec(Date.now());

        let write: nkruntime.StorageWriteRequest = {
            collection: 'reward',
            key: 'daily',
            permissionRead: 1,
            permissionWrite: 0,
            value: dailyReward,
            userId: context.userId,
        }
        if (objects.length > 0) {
            write.version = objects[0].version
        }

        try {
            nk.storageWrite([ write ])
        } catch (error) {
            logger.error('storageWrite error: %q', error);
            throw error;
        }
    }

    let result = JSON.stringify(resp);
    logger.debug('rpcReward resp: %q', result)

    return result;
}

export function msecToSec(n: number): number {
    return Math.floor(n / 1000);
}
