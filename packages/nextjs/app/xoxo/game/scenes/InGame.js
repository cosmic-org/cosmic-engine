import { notification } from "~~/utils/scaffold-eth";
import Nakama from "../nakama"
import { Scene } from 'phaser';

const CONFIG = {
    WIDTH: 400,
    HEIGHT: 550
}



export default class InGame extends Scene {
    constructor() {
        super("in-game");
        this.INDEX_TO_POS;
        this.headerText;
        this.gameStarted = false;
        this.turn = false;
        this.phaser = this
        this.playerPos;
        this.emitter;
    }

    //ep4
    updateBoard(board) {
        board.forEach((element, index) => {
            let newImage = this.INDEX_TO_POS[index]

            if (element === 1) {
                this.phaser.add.image(newImage.x, newImage.y, "X");
            } else if (element === 2) {
                this.phaser.add.image(newImage.x, newImage.y, "O");
            }
        })
    }

    updatePlayerTurn() {
        this.playerTurn = !this.playerTurn

        if (this.playerTurn) {
            this.headerText.setText("Your turn!")
        } else {
            this.headerText.setText("Opponents turn!")
        }
    }

    setPlayerTurn(data) {
        let userId = localStorage.getItem("user_id");
        if (data.marks[userId] === 1) {
            this.playerTurn = true;
            this.playerPos = 1;
            this.headerText.setText("Your turn!")
        } else {
            this.playerPos = 2;
            this.headerText.setText("Opponents turn!")
        }
    }

    opponentLeft() {
        this.headerText.setText("Opponent has left")
        this.playAIBtn.setVisible(true);
        this.playAIBtnText.setVisible(true);
    }

    endGame(data) {
        this.updateBoard(data.board)

        if (data.winner === this.playerPos) {
            this.headerText.setText("Winner!")
            this.headerText.setColor("#00ff00")
            notification.success("You won the game")
        } else if(data.winner === undefined || data.winner === 0) {
            this.headerText.setText("Tie!")
            notification.info("The game ended in a tie")
        } else {
            this.headerText.setColor("#ff0000")
            this.headerText.setText("You lose :(")
            notification.error("You lost the game")
        }

        this.emitter.explode(48);

        // go to the main menu after 3 seconds
        setTimeout(() => {
            window.location.href = "/"
        }, 3000)
    }

    //ep4
    nakamaListener() {
        Nakama.socket.onmatchdata = (result) => {
            const json_string = new TextDecoder().decode(result.data)
            const json = json_string ? JSON.parse(json_string): ""

            switch (result.op_code) {
                case 1:
                    this.gameStarted = true
                    this.setPlayerTurn(json)
                    break;
                case 2:
                    console.log(result.data)
                    this.updateBoard(json.board)
                    this.updatePlayerTurn()
                    break;
                case 3:
                    this.endGame(json)
                    break;
                case 6:
                    this.opponentLeft()
            }
        };
    }

    preload() {
        this.load.image("X", "assets/X.png");
        this.load.image("O", "assets/O.png");
        this.load.atlas('flares', 'assets/flares.png', 'assets/flares.json');

    }

    create() {
        this.headerText = this.add
            .text(CONFIG.WIDTH / 2, 80, "Waiting for game to start", {
                fontFamily: "Arial",
                fontSize: "24px",
            })
            .setOrigin(0.5);

        const gridWidth = 300;
        const gridCellWidth = gridWidth / 3;

        const grid = this.add.grid(
            CONFIG.WIDTH / 2,
            CONFIG.HEIGHT / 2,
            gridWidth,
            gridWidth,
            gridCellWidth,
            gridCellWidth,
            0xffffff,
            0,
            0xffca27
        ); 

        const gridCenterX = grid.getCenter().x;
        const gridCenterY = grid.getCenter().y;

        const topY = gridCenterY - gridCellWidth;
        const bottomY = gridCenterY + gridCellWidth;

        const gridLeft = gridCenterX - gridCellWidth
        const gridRight = gridCenterX + gridCellWidth

        this.INDEX_TO_POS = {
            0: { 'x': gridLeft, 'y': topY },
            1: { 'x': gridCenterX, 'y': topY },
            2: { 'x': gridRight, 'y': topY },

            3: { 'x': gridLeft, 'y': gridCenterY },
            4: { 'x': gridCenterX, 'y': gridCenterY },
            5: { 'x': gridRight, 'y': gridCenterY },

            6: { 'x': gridLeft, 'y': bottomY },
            7: { 'x': gridCenterX, 'y': bottomY },
            8: { 'x': gridRight, 'y': bottomY }
        }

        this.nakamaListener()

        this.add
            .rectangle(
                gridCenterX - gridCellWidth,
                topY,
                gridCellWidth,
                gridCellWidth
            )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", async () => {
                await Nakama.makeMove(0)
            });

        this.add
            .rectangle(gridCenterX, topY, gridCellWidth, gridCellWidth)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(1)
            });

        this.add
            .rectangle(
                gridCenterX + gridCellWidth,
                topY,
                gridCellWidth,
                gridCellWidth
            )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(2)
            });

        this.add
            .rectangle(
                gridCenterX - gridCellWidth,
                gridCenterY,
                gridCellWidth,
                gridCellWidth
            )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(3)
            });

        this.add
            .rectangle(gridCenterX, gridCenterY, gridCellWidth, gridCellWidth)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(4)
            });

        this.add
            .rectangle(
                gridCenterX + gridCellWidth,
                gridCenterY,
                gridCellWidth,
                gridCellWidth
            )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(5)
            });

        this.add
            .rectangle(
                gridCenterX - gridCellWidth,
                bottomY,
                gridCellWidth,
                gridCellWidth
            )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(6)
            });

        this.add
            .rectangle(gridCenterX, bottomY, gridCellWidth, gridCellWidth)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(7)
            });

        this.add
            .rectangle(
                gridCenterX + gridCellWidth,
                bottomY,
                gridCellWidth,
                gridCellWidth
            )
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                Nakama.makeMove(8)
            });

        this.playAIBtn = this.add
            .rectangle(CONFIG.WIDTH / 2, 680, 270, 70, 0xffca27)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.playAIBtnText = this.add
            .text(CONFIG.WIDTH / 2, 680, "Continue with AI", {
                fontFamily: "Arial",
                fontSize: "36px",
            })
            .setVisible(false)
            .setOrigin(0.5);

        this.playAIBtn.on("pointerdown", async () => {
            await Nakama.inviteAI()
            this.playAIBtn.setVisible(false);
            this.playAIBtnText.setVisible(false);
        });

        this.playAIBtn.on("pointerover", () => {
            this.playAIBtn.setScale(1.1);
            this.playAIBtnText.setScale(1.1);
        });

        this.playAIBtn.on("pointerout", () => {
            this.playAIBtn.setScale(1);
            this.playAIBtnText.setScale(1);
        });

        this.emitter = this.add.particles(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'flares', {
            frame: [ 'red', 'yellow', 'green' ],
            lifespan: 4000,
            speed: { min: 250, max: 400 },
            scale: { start: 0.8, end: 0 },            
            blendMode: 'ADD',
            emitting: false
        });                   
    }
}