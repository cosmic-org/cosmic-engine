import { Board, BoardItem, Position } from "./game-state";

export const aiUserId = "ai-user-id";

export const aiPresence: nkruntime.Presence = {
	userId: aiUserId,
	sessionId: "",
	username: aiUserId,
	node: "",
}

const convertAIResponseIntoBestMove = (logger: nkruntime.Logger, boardOutput: number[]): { position: Position } => {
	let row: number = -1;
	let col: number = -1;

	let minBestMoveScore: number = 100;

	boardOutput.forEach((bestMoveScore, index) => {
		const score = bestMoveScore < 0 ? bestMoveScore * -1 : bestMoveScore;

		logger.info(`SMARTMOVE SCORE::: ${score} ROW:: ${Math.floor(index / 8)} COL:: ${index % 8}`);

		if (score < minBestMoveScore) {
			minBestMoveScore = score;
			row = Math.floor(index / 8);
			col = index % 8;
		}
	});

	if (minBestMoveScore > 10.0) {
		throw new Error("There are no best moves given by AI");
	}

	if (row < 0 || row >= 8 || col < 0 || col >= 8) {
		throw new Error("AI provided a move outside the board");
	}

	return { position: [row, col] };
}

const createAIApiSession = async (ctx: nkruntime.Context, nk: nkruntime.Nakama): Promise<boolean> => {
	try {
		const environmentalVariables = ctx.env;

		const baseUrl = environmentalVariables["OTHELLO_AI_API_BASE_URL"];
	
		const options = {
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				"model": "othello",
				"version": "v1",
				"option": {
				  "cuda": false
				}
			  })
		};
	
		const apiUrl = `${baseUrl}/api/sessions`;
	
		await nk.httpRequest(
			apiUrl,
			"post",
			options.headers,
			options.body
		);

		return true;
	} catch (error) {
		if (error.error === "session already exists") {
			return true;
		}

		return false;
	}
}

export const getAISmartMove = async (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, board: Board): Promise<{ position: Position }> => {
	try {
		const isAISessionUp = await createAIApiSession(ctx, nk);

		if (!isAISessionUp) {
			throw new Error("AI session not created");
		}
	
		const environmentalVariables = ctx.env;
		const baseUrl = environmentalVariables["OTHELLO_AI_API_BASE_URL"];
	
		const boardIn: number[] = [];

		board.forEach((row) => {
			row.forEach((column) => {
				let item: number = 0.0;
				switch(column) {
					case BoardItem.BLACK:
						item = -1.0;
						break;
					case BoardItem.WHITE:
						item = 1.0;
						break;
					default:
						break;
				}
	
				boardIn.push(item);
			});
		});

		const options = {
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				"board_in": boardIn
			})
		};
	
		const apiUrl = `${baseUrl}/api/sessions/othello/v1`;

		const boardOutput = await nk.httpRequest(
			apiUrl,
			"post",
			options.headers,
			options.body
		);

		let parsedBoardOutput = JSON.parse(boardOutput.body) as { "best_move": number[][] };
		return convertAIResponseIntoBestMove(logger, parsedBoardOutput.best_move[0]);
	} catch(error) {
		logger.error(error);
		return { position: [0,0] };
	}
}