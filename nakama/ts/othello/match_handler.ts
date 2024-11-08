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
import { aiPresence } from "./ai";
import { Board, BoardInitialState, BoardItem, DoneMessage, GameMode, GamePlayState, MatchLabel, MoveMessage, OpCode, Position, State, UpdateMessage, maxEmptySec, tickRate } from "./game-state";

export const moduleName = "othello_ts";

export const matchInit: nkruntime.MatchInitFunction<State> = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: any}) {
    const mode: GameMode = params['mode'] as GameMode;

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
    // Check if match is full.
    if (connectedPlayers(state) + state.joinsInProgress >= 2) {
        return {
            state: state,
            accept: false,
            rejectMessage: 'match full',
        };
    }
    
    // Check if it's a user attempting to rejoin after a disconnect.
    if (presence.userId in state.presences) {
        if (!state.presences[presence.userId]) {
            // User rejoining after a disconnect.
            state.joinsInProgress++;
            return {
                state,
                accept: true,
            }
        } else {
            // User attempting to join from 2 different devices at the same time.
            return {
                state,
                accept: false,
                rejectMessage: 'already joined',
            }
        }
    }

    // New player attempting to connect.
    state.joinsInProgress++;
    return {
        state,
        accept: true,
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
        } else if (state.board.length !== 0 && Object.keys(state.playerBoardItem).length !== 0 && state.playerBoardItem[presence.userId]) {
            // There's no game in progress but we still have a completed game that the user was part of.
            // They likely disconnected before the game ended, and have since forfeited because they took too long to return.
            let done: DoneMessage = {
                board: state.board,
                playerBoardItem: state.playerBoardItem,
                winner: state.winner,
                winnerGamePoints: state.winnerGamePoints,
                loserGamePoints: state.loserGamePoints,
                nextGameStart: currentTimeInSec + Math.floor(state.nextGameRemainingTicks/tickRate)
            }
            // Send a message to the user that just joined.
            dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(done))
        }
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

    let humanPlayersRemaining: nkruntime.Presence[] = [];
    Object.keys(state.presences).forEach((userId) => {
        if(userId !== aiUserId && state.presences[userId] !== null) {
            humanPlayersRemaining.push(state.presences[userId]!);
        }
    });

    // Notify remaining player that the opponent has left the game
    if (humanPlayersRemaining.length === 1) {
        dispatcher.broadcastMessage(
            OpCode.OPPONENT_LEFT, null, humanPlayersRemaining, null, true)
    } else if(state.label.mode === GameMode.PlayerVsAI && humanPlayersRemaining.length === 0) {
        state.presences[aiUserId] = null;
    }

    return { state };
}

export const matchLoop: nkruntime.MatchLoopFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, messages: nkruntime.MatchMessage[]) {
    // Match has been empty for too long, close it.
    if (connectedPlayers(state) + state.joinsInProgress === 0) {
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
        state.board = new Array(9);
        state.marks = {};
        let marks = [Mark.X, Mark.O];
        Object.keys(state.presences).forEach(userId => {
            if(state.ai) {
                if(userId === aiUserId) {
                    state.marks[userId] = Mark.O;
                } else {
                    state.marks[userId] = Mark.X;
                }
            } else {
                state.marks[userId] = marks.shift() ?? null;
            }
        });
        state.mark = Mark.X;
        state.winner = Mark.UNDEFINED;
        state.winnerPositions = null;
        state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
        state.nextGameRemainingTicks = 0;

        // Notify the players a new game has started.
        let msg: StartMessage = {
            board: state.board,
            marks: state.marks,
            mark: state.mark,
            deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate),
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
                const sender = message.sender.userId !== aiUserId ? message.sender : null;
                let playerBoardItem = state.playerBoardItem[message.sender.userId];

                if (state.boardItemToPlay != playerBoardItem.boardItem) {
                    // It is not this player's turn.
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [sender]);
                    continue;
                }

                let msg = {} as MoveMessage;
                try {
                    msg = JSON.parse(nk.binaryToString(message.data));
                } catch (error) {
                    // Client sent bad data.
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [sender]);
                    continue;
                }

                // Othello board gameplay mechanis happens here and the board will be updated after validation
                const isValidPlay = playMoveOnBoard(state.board, state.boardItemToPlay, msg.position);

                if (!isValidPlay) {
                    dispatcher.broadcastMessage(OpCode.REJECTED, null, [sender]);
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
                        winnerUserId = playerBoardItem.boardItem === BoardItem.WHITE ? message.sender.userId : aiUserId;
                    } else if (blackCount > whiteCount) {
                        winnerUserId = playerBoardItem.boardItem === BoardItem.BLACK ? message.sender.userId : aiUserId;
                    } else {
                        winnerUserId = 'none';
                    }

                    if (winnerUserId && winnerUserId !== '') {
                        if (winnerUserId === "none") {
                            state.winner = null;
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
                    let msg: UpdateMessage = {
                        board: state.board,
                        playerBoardItem: state.playerBoardItem,
                        boardItemToPlay: state.boardItemToPlay,
                        deadline: currentTimeInSec + Math.floor(state.deadlineRemainingTicks/tickRate),
                    }

                    dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(msg));
                }
            
                break;
            case OpCode.INVITE_AI:
                if(state.label.mode === "player-vs-ai") {
                    logger.error('AI player is already playing');
                    continue
                }

                let activePlayers: nkruntime.Presence[] = [];

                Object.keys(state.presences).forEach((userId) => {
                    let p = state.presences[userId];
                    if(p === null) {
                        delete state.presences[userId];
                    } else {
                        activePlayers.push(p);
                    }
                });

                logger.debug('active users: %d', activePlayers.length);

                if(activePlayers.length != 1) {
                    logger.error('one active player is required to enable AI mode')
                    continue
                }

                state.ai = true;
                state.presences[aiUserId] = aiPresence;

                if(state.marks[activePlayers[0].userId] == Mark.O) {
                    state.marks[aiUserId] = Mark.X
                } else {
                    state.marks[aiUserId] = Mark.O
                }

                logger.info('AI player joined match')
                break;

            default:
                // No other opcodes are expected from the client, so automatically treat it as an error.
                dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
                logger.error('Unexpected opcode received: %d', message.opCode);
        }
    }

    // Keep track of the time remaining for the player to submit their move. Idle players forfeit.
    if (state.playing) {
        state.deadlineRemainingTicks--;
        if (state.deadlineRemainingTicks <= 0 ) {
            // The player has run out of time to submit their move.
            state.playing = false;
            state.winner = state.mark === Mark.O ? Mark.X : Mark.O;
            state.deadlineRemainingTicks = 0;
            state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;

            let msg: DoneMessage = {
                board: state.board,
                winner: state.winner,
                nextGameStart: t + Math.floor(state.nextGameRemainingTicks/tickRate),
                winnerPositions: null,
            }
            dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(msg));
        }
    }

    // The next turn is AI's
    if(state.ai && state.mark === state.marks[aiUserId]) {
        aiTurn(state, logger, nk);
    }

    return { state };
}

export const matchTerminate: nkruntime.MatchTerminateFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State, graceSeconds: number) {
    return { state };
}

export const matchSignal: nkruntime.MatchSignalFunction<State> = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: State) {
    return { state };
}

function connectedPlayers(state: State): number {
    let count = 0;
    for(const userId of Object.keys(state.presences)) {
        if (state.presences[userId]) count++;
    }
    return count;
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

function isValidMove(board: Board, boardItemToPlay: BoardItem, position: Position): boolean {
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

function playMoveOnBoard(board: Board, boardItemToPlay: BoardItem, position: Position) {
    const [row, col] = position;

    if (!isValidMove(board, boardItemToPlay, position)) {
        return false;
    }

    // Place the player item on the board that the user is selected
    board[row][col] =boardItemToPlay;

    for (const { x, y } of directions) {
        // Traversing all the directions
        let r = row + x;
        let c = col + y;
        let slotsToFlip: Position[] = [];

        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
             // if the immidiate nearest slot is none, then there is no possibility of flip, so no valid placement
             if (board[r][c] === BoardItem.NONE) break;

             if (board[r][c] === boardItemToPlay) {
                // if the player's item found after atleast one instance of opponent item ? It is a valid placement
                slotsToFlip.forEach(([posR, posC]) => {
                    board[posR][posC] = boardItemToPlay;
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

function getBoardStats(board: Board): { blackCount: number, whiteCount: number, noneCount: number } {
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