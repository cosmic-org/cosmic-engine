export enum GamePlayState {
    CLOSE = 0,
    OPEN = 1
};

export enum GameMode {
    PlayerVsPlayer = 0,
    PlayerVsAI = 1
}

export interface MatchLabel {
    open: GamePlayState;
    mode: GameMode;
}

export type Board = BoardItem[][];

export enum BoardItem {
    WHITE = 0,
    BLACK = 1,
    NONE = 2,
}

export type Position = [row: number, col: number];

// The complete set of opcodes used for communication between clients and server.
export enum OpCode {
	// New game round starting.
	START = 1,
	// Update to the state of an ongoing round.
	UPDATE = 2,
	// A game round has just completed.
	DONE = 3,
	// A move the player wishes to make and sends to the server.
	MOVE = 4,
	// Move was rejected.
	REJECTED = 5,
 	// Opponent has left the game.
    OPPONENT_LEFT = 6,
    // Invite AI player to join instead of the opponent who left the game.
    INVITE_AI = 7,
}

export interface State {
    // Match label
    label: MatchLabel;
    // Ticks where no actions have occurred.
    emptyTicks: number;
    // Currently connected users, or reserved spaces.
    presences: { [userId: string]: nkruntime.Presence };
    // Number of users currently in the process of connecting to the match.
    joinsInProgress: number;
    // True if there's a game currently in progress.
    playing: boolean;
    // Current state of the board.
    board: Board;
    // assignments to player user IDs.
    playerBoardItem: { [userId: string]: { boardItem: BoardItem, boardItemLeft: number } };
    // Whose turn it currently is.
    boardItemToPlay: BoardItem;
    // Ticks until they must submit their move.
    deadlineRemainingTicks: number;
    // The winner of the current game.
    winner: BoardItem;
    // Total points in the game for winner
    winnerGamePoints: number;
    // Total points in the game for loser
    loserGamePoints: number;
    // Ticks until the next game starts, if applicable.
    nextGameRemainingTicks: number;
    // A move message from AI player
    aiMessage: nkruntime.MatchMessage | null
}

// Message data sent by server to clients representing a new game round starting.
export interface StartMessage {
    // The current state of the board.
    board: Board;
    // assignments to player user IDs.
    playerBoardItem: { [userId: string]: { boardItem: BoardItem, boardItemLeft: number } };
    // Whose turn it is to play.
    boardItemToPlay: BoardItem;
    // The deadline time by which the player must submit their move, or forfeit.
    deadline: number;
}

// A player intends to make a move.
export interface MoveMessage {
    // The position the player wants to place their board item.
    position: Position;
    // If there is no possible move, player should skip the move.
    skipTurn: boolean;
}

// A game state update sent by the server to clients.
export interface UpdateMessage {
    // The current state of the board.
    board: Board;
    // assignments to player user IDs.
    playerBoardItem: { [userId: string]: { boardItem: BoardItem, boardItemLeft: number } };
    // Whose turn it is to play.
    boardItemToPlay: BoardItem;
    // The deadline time by which the player must submit their move, or forfeit.
    deadline: number;
}

// Complete game round with winner announcement.
export interface DoneMessage {
    // The final state of the board.
    board: Board;
    // assignments to player user IDs.
    playerBoardItem: { [userId: string]: { boardItem: BoardItem, boardItemLeft: number } };
    // The winner of the game, if any. Unspecified if it's a draw.
    winner: BoardItem;
    // Total points in the game for winner
    winnerGamePoints: number;
    // Total points in the game for loser
    loserGamePoints;
    // Next round start time.
    nextGameStart: number;
}

export const boardItemCount = 8 * 8;
export const maxEmptySec = 30;
export const delaybetweenGamesSec = 5;
export const tickRate = 5;

export const BoardInitialState: BoardItem[][] = [
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.WHITE, BoardItem.BLACK, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.BLACK, BoardItem.WHITE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
    [BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE, BoardItem.NONE],
];