/*
    Othello Game Rules
    1. Othello Board is 8 X 8 in size which contains 64 slots and 64 items.
    2. Each player starts with two items in center of the board which is placed diagonallly.
    2. Rest of the 60 items will be given to each player with equal splits.
    4. The game supports Horizontal, Vertical, and Diagonal directions.
    5. The black item goes first.
    5. The player must place the item in an empty space which flips the opponent item
    6. The player can flip multiple items in any direction and even multiple directions.
    7. If the player not able to flip the opponent item ? The player is not allowed to play and it will be skipped.
    8. All the items inbetween the current player's item needs to be flipped
    9. If the current player run out of item, the opponent must provide their item to the current player
    10. If there is no possibility of each player to move their items, the game is over
    11. Once the board is fully filled, the winner will be the one who has a highest items on the board
*/

import { aiUserId } from "../ai";
import { msecToSec } from "../daily_rewards";
import { aiPresence, getAISmartMove } from "./ai";
import { Board, BoardInitialState, BoardItem, DoneMessage, GameMode, GamePlayState, MatchLabel, MoveMessage, OpCode, Position, StartMessage, State, UpdateMessage, maxEmptySec, tickRate } from "./game-state";

export const moduleName = "othello_ts";

export const matchInit: nkruntime.MatchInitFunction<State> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}) {
    const mode: GameMode = GameMode.PlayerVsAI;

    // Only AI vs Player gameplay is supported now
    if (mode !== GameMode.PlayerVsAI) {
        throw Error('Unsupported mode, please check the mode selection');
    }

    let label: MatchLabel = {
        open: GamePlayState.OPEN,
        mode: mode,
    }

    let state: State = {
        label: label,
        emptyTicks: 0,
        presences: {},
        joinsInProgress: 0,
        playing: false,
        board: BoardInitialState,
        boardItemToPlay: BoardItem.BLACK,
        playerBoardItem: {},
        deadlineRemainingTicks: 0,
        winner: BoardItem.NONE,
        loserGamePoints: 0,
        winnerGamePoints: 0,
        nextGameRemainingTicks: 0,
        aiMessage: null
    }

    if(mode === GameMode.PlayerVsAI) {
        state.presences[aiUserId] = aiPresence;
    }

    return {
        state,
        tickRate,
        label: JSON.stringify(label),
    }
}

export const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction<State> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, presence: nkruntime.Presence, metadata: {[key: string]: any}) {
    const connectedPlayerUserIds: string[] = getConnectedPlayerUserIds(state);
    const totalPlayers: number = connectedPlayerUserIds.length + state.joinsInProgress;

    const isPlayerAlreadyJoined = connectedPlayerUserIds.some((userId) => {
        return userId === presence.userId;
    });

    // Check if player is already joined
    if (isPlayerAlreadyJoined) {
        return {
            state: state,
            accept: false,
            rejectMessage: 'Player already joined',
        };
    }

    // Check if match is full.
    if (totalPlayers >= 2) {
        return {
            state: state,
            accept: false,
            rejectMessage: 'Match full',
        };
    }

    const isAIParticipated = connectedPlayerUserIds.some((userId) => {
        return userId === aiUserId;
    });

    // If AI is joined and no one is available ? the player can join
    if (isAIParticipated && totalPlayers === 1) {
        // New player attempting to connect.
        state.joinsInProgress++;

        return {
            state,
            accept: true,
        }
    } else {
        // If AI is not joined, there is something wrong happened
        return {
            state: state,
            accept: false,
            rejectMessage: 'Something went wrong',
        };
    }
}

export const matchJoin: nkruntime.MatchJoinFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, presences: nkruntime.Presence[]) {
    const currentTimeInSec = msecToSec(Date.now());

    for (const presence of presences) {
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;
        state.joinsInProgress--;

        // Check if we must send a message to this user to update them on the current game state.
        if (state.playing) {
            // There's a game still currently in progress, the player is re-joining after a disconnect. Give them a state update.
            let update: UpdateMessage = {
                board: state.board,
                playerBoardItem: state.playerBoardItem,
                boardItemToPlay: state.boardItemToPlay,
                deadline: currentTimeInSec + Math.floor(state.deadlineRemainingTicks/tickRate),
            }
            // Send a message to the user that just joined.
            dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(update));
        } 
        // else if (state.board.length !== 0 && Object.keys(state.playerBoardItem).length !== 0 && state.playerBoardItem[presence.userId]) {
        //     // There's no game in progress but we still have a completed game that the user was part of.
        //     // They likely disconnected before the game ended, and have since forfeited because they took too long to return.
        //     let done: DoneMessage = {
        //         board: state.board,
        //         playerBoardItem: state.playerBoardItem,
        //         winner: state.winner,
        //         winnerGamePoints: state.winnerGamePoints,
        //         loserGamePoints: state.loserGamePoints,
        //         nextGameStart: currentTimeInSec + Math.floor(state.nextGameRemainingTicks/tickRate)
        //     }
        //     // Send a message to the user that just joined.
        //     dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(done))
        // }
    }

    // Check if match was open to new players, but should now be closed.
    if (Object.keys(state.presences).length >= 2 && state.label.open != 0) {
        state.label.open = 0;
        const labelJSON = JSON.stringify(state.label);
        dispatcher.matchLabelUpdate(labelJSON);
    }

    return { state };
}

export const matchLeave: nkruntime.MatchLeaveFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, presences: nkruntime.Presence[]) {
    for (let presence of presences) {
        state.presences[presence.userId] = null;
    }

    return { state };
}

export const matchLoop: nkruntime.MatchLoopFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, messages: nkruntime.MatchMessage[]) {
    // Match has been empty for too long, close it.
    if (getConnectedPlayerUserIds(state).length + state.joinsInProgress === 0) {
        state.emptyTicks++;

        if (state.emptyTicks >= maxEmptySec * tickRate) {
            return null;
        }
    }

    let currentTimeInSec = msecToSec(Date.now());

    // If there's no game in progress check if we can (and should) start one!
    if (!state.playing) {
        // Between games any disconnected users are purged, there's no in-progress game for them to return to anyway.
        for (let userID in state.presences) {
            if (state.presences[userID] === null) {
                delete state.presences[userID];
            }
        }

        // Check if we need to update the label so the match now advertises itself as open to join.
        if (Object.keys(state.presences).length < 2 && state.label.open != 1) {
            state.label.open = 1;
            let labelJSON = JSON.stringify(state.label);
            dispatcher.matchLabelUpdate(labelJSON);
        }

        // Check if we have enough players to start a game.
        if (Object.keys(state.presences).length < 2) {
            return { state };
        }

        // Check if enough time has passed since the last game.
        if (state.nextGameRemainingTicks > 0) {
            state.nextGameRemainingTicks--
            return { state };
        }

        // We can start a game! Set up the game state and assign the marks to each player.
        state.playing = true;
        state.board = BoardInitialState;
        state.playerBoardItem = {};
        Object.keys(state.presences).forEach(userId => {
            if(state.label.mode === GameMode.PlayerVsAI) {
                if(userId === aiUserId) {
                    state.playerBoardItem[userId] = {
                        boardItem: BoardItem.WHITE,
                        boardItemLeft: 30
                    };
                } else {
                    state.playerBoardItem[userId] = {
                        boardItem: BoardItem.BLACK,
                        boardItemLeft: 30
                    };
                }
            } else {
                throw Error('Unsupported mode, please check the mode selection');
            }
        });

        state.boardItemToPlay = BoardItem.BLACK;
        state.winner = BoardItem.NONE;

        // TODO: Config a static time for gameplay
        state.deadlineRemainingTicks = 10;
        state.nextGameRemainingTicks = 0;

        // Notify the players a new game has started.
        let msg: StartMessage = {
            board: state.board,
            playerBoardItem: state.playerBoardItem,
            boardItemToPlay: state.boardItemToPlay,
            deadline: currentTimeInSec + Math.floor(state.deadlineRemainingTicks / tickRate),
        }

        dispatcher.broadcastMessage(OpCode.START, JSON.stringify(msg));

        return { state };
    }

    if(state.aiMessage !== null) {
        messages.push(state.aiMessage);
        state.aiMessage = null;
    }

    // There's a game in progres state. Check for input, update match state, and send messages to clientstate.
    for (const message of messages) {
        switch (message.opCode) {
            case OpCode.MOVE:
                const sender = message.sender.userId !== aiUserId ? [message.sender] : null;
                let playerBoardItem = state.playerBoardItem[message.sender.userId];

                logger.info(`${sender === null ? "AI MOVE" : "PLAYER MOVE"}`);

                if (state.boardItemToPlay != playerBoardItem.boardItem) {
                    // It is not this player's turn.
                    dispatcher.broadcastMessage(OpCode.REJECTED, JSON.stringify({ message: "It is not your turn." }), sender);
                    continue;
                }

                let msg = {} as MoveMessage;
                try {
                    msg = JSON.parse(nk.binaryToString(message.data));
                } catch (error) {
                    // Client sent bad data.
                    dispatcher.broadcastMessage(OpCode.REJECTED, JSON.stringify({ message: "Something went wrong" }), sender);
                    continue;
                }

                // If player is attempting to skip, validate if there is no possible move and skip it.
                if (msg.skipTurn) {
                    const isValidSkip = checkIsValidSkip(state.board, state.boardItemToPlay);

                    if (!isValidSkip) {
                        // It is not a valid skip, player must play this turn.
                        dispatcher.broadcastMessage(OpCode.REJECTED, JSON.stringify({ message: "You cannot skip a turn when there is a valid move" }), sender);
                    }

                    const aiBoardItem = state.playerBoardItem[aiUserId].boardItem;
                    const playerBoardItem = aiBoardItem === BoardItem.BLACK ? BoardItem.WHITE : BoardItem.BLACK;
                    state.boardItemToPlay = sender === null ? playerBoardItem : aiBoardItem;

                    let msg: UpdateMessage = {
                        board: state.board,
                        playerBoardItem: state.playerBoardItem,
                        boardItemToPlay: state.boardItemToPlay,
                        deadline: currentTimeInSec + Math.floor(state.deadlineRemainingTicks/tickRate),
                    }

                    dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(msg));
                } else {
                    // Othello board gameplay mechanis happens here and the board will be updated after validation
                    const isValidPlay = playMoveOnBoard(state, state.boardItemToPlay, msg.position);

                    if (!isValidPlay) {
                        dispatcher.broadcastMessage(OpCode.REJECTED, JSON.stringify({ message: "Invalid move" }), sender);
                        continue;
                    }

                    // TODO: Config a static time for gameplay
                    state.deadlineRemainingTicks = 10;

                    const { blackCount, whiteCount, noneCount } = getBoardStats(state.board);

                    // The game is over when the board is filled
                    const isGameOver = noneCount === 0 && (blackCount + whiteCount) === 64;

                    let winnerUserId: string = null;

                    if (isGameOver) {
                        if (whiteCount > blackCount) {
                            winnerUserId = aiUserId;
                        } else if (blackCount > whiteCount) {
                            winnerUserId = message.sender.userId;
                        } else {
                            winnerUserId = 'none';
                        }

                        if (winnerUserId && winnerUserId !== '') {
                            if (winnerUserId === "none") {
                                state.winner = BoardItem.NONE;
                            } else {
                                state.winner = state.playerBoardItem[winnerUserId].boardItem;
                            }
                            
                            state.playing = false;
                            state.deadlineRemainingTicks = 0;
        
                            // TODO: Config a static time for gameplay
                            state.nextGameRemainingTicks = 10;
                        }

                        let msg: DoneMessage = {
                            board: state.board,
                            playerBoardItem: state.playerBoardItem,
                            winner: state.winner,
                            winnerGamePoints: Math.max(blackCount, whiteCount),
                            loserGamePoints: Math.min(blackCount, whiteCount),
                            nextGameStart: currentTimeInSec + Math.floor(state.nextGameRemainingTicks/tickRate),
                        }

                        dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(msg));
                    } else {
                        const aiBoardItem = state.playerBoardItem[aiUserId].boardItem;
                        const playerBoardItem = aiBoardItem === BoardItem.BLACK ? BoardItem.WHITE : BoardItem.BLACK;
                        state.boardItemToPlay = sender === null ? playerBoardItem : aiBoardItem;
                        let msg: UpdateMessage = {
                            board: state.board,
                            playerBoardItem: state.playerBoardItem,
                            boardItemToPlay: state.boardItemToPlay,
                            deadline: currentTimeInSec + Math.floor(state.deadlineRemainingTicks/tickRate),
                        }
                        dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(msg));
                    }
                }
            
                break;
            default:
                // No other opcodes are expected from the client, so automatically treat it as an error.
                dispatcher.broadcastMessage(OpCode.REJECTED, JSON.stringify({ message: "Unexpected action, something went wrong" }), [message.sender]);
                logger.error('Unexpected opcode received: %d', message.opCode);
        }
    }

    // // Keep track of the time remaining for the player to submit their move. Idle players forfeit.
    // if (state.playing) {
    //     state.deadlineRemainingTicks--;
    //     if (state.deadlineRemainingTicks <= 0 ) {
    //         // The player has run out of time to submit their move.
    //         state.playing = false;
    //         state.winner = state.boardItemToPlay === BoardItem.BLACK ? BoardItem.WHITE : BoardItem.BLACK;

    //         // TODO: Config a static time for gameplay
    //         state.deadlineRemainingTicks = 0;
    //         state.nextGameRemainingTicks = 10;

    //         const { blackCount, whiteCount } = getBoardStats(state.board);

    //         let msg: DoneMessage = {
    //             board: state.board,
    //             playerBoardItem: state.playerBoardItem,
    //             winnerGamePoints: Math.max(blackCount, whiteCount),
    //             loserGamePoints: Math.min(blackCount, whiteCount),
    //             winner: state.winner,
    //             nextGameStart: currentTimeInSec + Math.floor(state.nextGameRemainingTicks/tickRate),
    //         }

    //         dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(msg));
    //     }
    // }

    // The next turn is AI's
    if(state.label.mode === GameMode.PlayerVsAI && state.boardItemToPlay === state.playerBoardItem[aiUserId].boardItem) {
        (async () => {
            try {
                const bestMovePosition = await getAISmartMove(ctx, logger, nk, state.board);

                const moveMessage: MoveMessage = {
                    position: bestMovePosition.position,
                    skipTurn: false,
                }

                const data = nk.stringToBinary(JSON.stringify(moveMessage));

                const aiMessage: nkruntime.MatchMessage = {
                    sender: aiPresence,
                    persistence: true,
                    status: "",
                    opCode: OpCode.MOVE,
                    data: data,
                    reliable: true,
                    receiveTimeMs: Date.now(),
                }; 

                state.aiMessage = aiMessage;
            } catch (error) {
                logger.debug(JSON.stringify(error));
                dispatcher.broadcastMessage(OpCode.REJECTED, JSON.stringify({ message: "AI move failed!" }), [null]);
            }
        })();
    }

    let update: UpdateMessage = {
        board: state.board,
        playerBoardItem: state.playerBoardItem,
        boardItemToPlay: state.boardItemToPlay,
        deadline: 1 + Math.floor(state.deadlineRemainingTicks/tickRate),
    }
    // Send a message to the user that just joined.
    dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(update));

    return { state };
}

export const matchTerminate: nkruntime.MatchTerminateFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, graceSeconds: number) {
    return { state };
}

export const matchSignal: nkruntime.MatchSignalFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State) {
    return { state };
}

function getConnectedPlayerUserIds(state: State): string[] {
    const userIds: string[] = [];
    for(const userId of Object.keys(state.presences)) {
        userIds.push(userId);
    }
    return userIds;
}

const directions = [
    { x: 1, y: 0 },   // right
    { x: -1, y: 0 },  // left
    { x: 0, y: 1 },   // down
    { x: 0, y: -1 },  // up
    { x: 1, y: 1 },   // down-right
    { x: -1, y: -1 }, // up-left
    { x: 1, y: -1 },  // down-left
    { x: -1, y: 1 },  // up-right
];

const isValidMove = (board: Board, boardItemToPlay: BoardItem, position: Position): boolean => {
    const [row, col] = position;

    // Client sent a position outside the board, so it is not a valid move
    if (row < 0 || row > 7 || col < 0 || col > 7) {
        return false;
    }

    // The selected slot is not empty, it is not a valid move
    if (board[row][col] !== BoardItem.NONE) {
        return false;
    }

    for (const { x, y } of directions) {
        // Traversing all the directions
        let r = row + x;
        let c = col + y;
        let opponentBoardItemFound = false; 

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            // if the immidiate nearest slot is none, then there is no possibility of flip, so no valid moves
            if (board[r][c] === BoardItem.NONE) break;


            if (board[r][c] === boardItemToPlay) {
                // if the player's item found after atleast one instance of opponent item ? It is a valid move
                if (opponentBoardItemFound) return true;
                // if the immidiate nearest slot is player's item, then there is no possibility of flip, so no valid moves
                break;
            }

            // if there is no None and Player's item found ? It is a opponent's item for sure
            opponentBoardItemFound = true;
            r += x;
            c += y;
        }
    }

    return false;
}

const checkIsValidSkip = (board: Board, boardItemToPlay: BoardItem): boolean => {
    for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
        for (let colIndex = 0; colIndex < board[0]?.length; colIndex++) {
            if (board[rowIndex][colIndex] === BoardItem.NONE) {
                const isValid = isValidMove(board, boardItemToPlay, [rowIndex, colIndex]);

                if (isValid) {
                    return true;
                }
            }
        }
    }

    return false;
}

const playMoveOnBoard = (state: State, boardItemToPlay: BoardItem, position: Position) => {
    const [row, col] = position;

    if (!isValidMove(state.board, boardItemToPlay, position)) {
        return false;
    }

    // Place the player item on the board that the user is selected
    state.board[row][col] = boardItemToPlay;

    for (const { x, y } of directions) {
        // Traversing all the directions
        let r = row + x;
        let c = col + y;
        let slotsToFlip: Position[] = [];

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
             // if the immidiate nearest slot is none, then there is no possibility of flip, so no valid placement
             if (state.board[r][c] === BoardItem.NONE) break;

             if (state.board[r][c] === boardItemToPlay) {
                // if the player's item found after atleast one instance of opponent item ? It is a valid placement
                slotsToFlip.forEach(([posR, posC]) => {
                    state.board[posR][posC] = boardItemToPlay;
                });
                break;
            }

            slotsToFlip.push([r, c]);
            r += x;
            c += y;
        }
    }

    return true;
}

const getBoardStats = (board: Board): { blackCount: number, whiteCount: number, noneCount: number } => {
    let blackN = 0;
    let whiteN = 0;
    let noneN = 0;

    board.forEach((row) => {
        row.forEach((column) => {
            switch(column) {
                case BoardItem.BLACK:
                    blackN++;
                    break;
                case BoardItem.WHITE:
                    whiteN++;
                    break;
                case BoardItem.NONE:
                    noneN++;
                    break;
                default:
                    break;
            }
        });
    });

    return { blackCount: blackN, whiteCount: whiteN, noneCount: noneN };
}