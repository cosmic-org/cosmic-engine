function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = {
      label: 0,
      sent: function sent() {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var validate$1 = {};

var regex = {};

var hasRequiredRegex;
function requireRegex() {
  if (hasRequiredRegex) return regex;
  hasRequiredRegex = 1;
  Object.defineProperty(regex, "__esModule", {
    value: true
  });
  regex["default"] = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;
  return regex;
}

var hasRequiredValidate;
function requireValidate() {
  if (hasRequiredValidate) return validate$1;
  hasRequiredValidate = 1;
  Object.defineProperty(validate$1, "__esModule", {
    value: true
  });
  var regex_js_1 = requireRegex();
  function validate(uuid) {
    return typeof uuid === 'string' && regex_js_1["default"].test(uuid);
  }
  validate$1["default"] = validate;
  return validate$1;
}

var validateExports = requireValidate();
var validate = /*@__PURE__*/getDefaultExportFromCjs(validateExports);

function isEvmAddress(address) {
  return /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
}
var getClientCredentials = function getClientCredentials(environmentalVariables, gameName) {
  var clientId = environmentalVariables["".concat(gameName, "_CLIENT_ID")];
  var clientSecret = environmentalVariables["".concat(gameName, "_CLIENT_SECRET")];
  if (!clientId || !clientSecret || clientId === "" || clientSecret === "") {
    throw new Error("Client credentials invalid");
  }
  return {
    clientId: clientId,
    clientSecret: clientSecret
  };
};
var generateAuthToken = function generateAuthToken(nk, clientId, clientSecret, gameName, playerId, tournamentId) {
  var secret = "".concat(tournamentId, "::").concat(clientId, "::").concat(clientSecret).toLowerCase();
  var authToken = nk.jwtGenerate("HS256", secret, {
    sub: playerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3 * 60,
    iss: 'nakama-server'
  });
  return authToken;
};
function rpcStartArcadiaTournament(ctx, logger, nk, payload) {
  var _this = this;
  try {
    var _a = JSON.parse(payload),
      gameName = _a.gameName,
      playerId = _a.playerId,
      tournamentId = _a.tournamentId,
      token = _a.token,
      walletAddress = _a.walletAddress,
      playerIp = _a.playerIp;
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
    playerIp = ctx.clientIp || "";
    var environmentalVariables = ctx.env;
    var baseUrl = environmentalVariables["TOURNAMENT_API_URL"];
    var _b = getClientCredentials(environmentalVariables, gameName),
      clientId = _b.clientId,
      clientSecret = _b.clientSecret;
    var authToken = generateAuthToken(nk, clientId, clientSecret, gameName, playerId, tournamentId);
    var apiUrl_1 = "".concat(baseUrl, "/tournament-round/").concat(tournamentId, "/start");
    var options_1 = {
      headers: {
        "Content-Type": "application/json",
        "x-arcadia-player-ip": playerIp
      },
      body: JSON.stringify({
        playerId: playerId,
        authToken: authToken,
        clientToken: token,
        clientId: clientId,
        walletAddress: walletAddress
      })
    };
    (function () {
      return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2,, 3]);
              return [4, nk.httpRequest(apiUrl_1, "post", options_1.headers, options_1.body)];
            case 1:
              _a.sent();
              return [3, 3];
            case 2:
              e_1 = _a.sent();
              logger.error(e_1);
              return [3, 3];
            case 3:
              return [2];
          }
        });
      });
    })();
    return JSON.stringify({
      code: 200,
      message: "OK"
    });
  } catch (error) {
    throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong");
  }
}
function rpcEndArcadiaTournament(ctx, logger, nk, payload) {
  var _this = this;
  try {
    var _a = JSON.parse(payload),
      gameName = _a.gameName,
      playerId = _a.playerId,
      tournamentId = _a.tournamentId,
      token = _a.token,
      score = _a.score,
      otherPlayerScores = _a.otherPlayerScores;
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
    otherPlayerScores === null || otherPlayerScores === void 0 ? void 0 : otherPlayerScores.forEach(function (scores) {
      if (typeof scores.score !== "number" || scores.score < 0) {
        throw new Error("Invalid score: " + scores.score);
      }
      if (!isEvmAddress(scores.walletAddress)) {
        throw new Error("Invalid wallet address: " + scores.walletAddress);
      }
    });
    var environmentalVariables = ctx.env;
    var baseUrl = environmentalVariables["TOURNAMENT_API_URL"];
    var _b = getClientCredentials(environmentalVariables, gameName),
      clientId = _b.clientId,
      clientSecret = _b.clientSecret;
    var authToken = generateAuthToken(nk, clientId, clientSecret, gameName, playerId, tournamentId);
    var apiUrl_2 = "".concat(baseUrl, "/tournament-round/").concat(tournamentId, "/end");
    var options_2 = {
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerId: playerId,
        authToken: authToken,
        clientToken: token,
        clientId: clientId,
        score: score,
        otherPlayerScores: otherPlayerScores
      })
    };
    (function () {
      return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              _a.trys.push([0, 2,, 3]);
              return [4, nk.httpRequest(apiUrl_2, "post", options_2.headers, options_2.body)];
            case 1:
              _a.sent();
              return [3, 3];
            case 2:
              e_2 = _a.sent();
              logger.error(e_2);
              return [3, 3];
            case 3:
              return [2];
          }
        });
      });
    })();
    return JSON.stringify({
      code: 200,
      message: "OK"
    });
  } catch (error) {
    throw new Error((error === null || error === void 0 ? void 0 : error.message) || "Something went wrong");
  }
}

function rpcReward(context, logger, nk, payload) {
  if (!context.userId) {
    throw Error('No user ID in context');
  }
  var objectId = {
    collection: 'reward',
    key: 'daily',
    userId: context.userId
  };
  var objects;
  try {
    objects = nk.storageRead([objectId]);
  } catch (error) {
    logger.error('storageRead error: %s', error);
    throw error;
  }
  var dailyReward = {
    lastClaimUnix: 0
  };
  objects.forEach(function (object) {
    if (object.key == 'daily') {
      dailyReward = object.value;
    }
  });
  var resp = {
    coinsReceived: 0
  };
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  if (dailyReward.lastClaimUnix < msecToSec(d.getTime())) {
    resp.coinsReceived = 500;
    var changeset = {
      coins: resp.coinsReceived
    };
    try {
      nk.walletUpdate(context.userId, changeset, {}, false);
    } catch (error) {
      logger.error('walletUpdate error: %q', error);
      throw error;
    }
    var notification = {
      code: 1001,
      content: changeset,
      persistent: true,
      subject: "You've received your daily reward!",
      userId: context.userId
    };
    try {
      nk.notificationsSend([notification]);
    } catch (error) {
      logger.error('notificationsSend error: %q', error);
      throw error;
    }
    dailyReward.lastClaimUnix = msecToSec(Date.now());
    var write = {
      collection: 'reward',
      key: 'daily',
      permissionRead: 1,
      permissionWrite: 0,
      value: dailyReward,
      userId: context.userId
    };
    if (objects.length > 0) {
      write.version = objects[0].version;
    }
    try {
      nk.storageWrite([write]);
    } catch (error) {
      logger.error('storageWrite error: %q', error);
      throw error;
    }
  }
  var result = JSON.stringify(resp);
  logger.debug('rpcReward resp: %q', result);
  return result;
}
function msecToSec(n) {
  return Math.floor(n / 1000);
}

function rpcHealthcheck(ctx, logger, nk, payload) {
  logger.info("Healthcheck request received");
  return JSON.stringify({
    success: true
  });
}

var Mark;
(function (Mark) {
  Mark[Mark["UNDEFINED"] = 0] = "UNDEFINED";
  Mark[Mark["X"] = 1] = "X";
  Mark[Mark["O"] = 2] = "O";
})(Mark || (Mark = {}));
var OpCode;
(function (OpCode) {
  OpCode[OpCode["START"] = 1] = "START";
  OpCode[OpCode["UPDATE"] = 2] = "UPDATE";
  OpCode[OpCode["DONE"] = 3] = "DONE";
  OpCode[OpCode["MOVE"] = 4] = "MOVE";
  OpCode[OpCode["REJECTED"] = 5] = "REJECTED";
  OpCode[OpCode["OPPONENT_LEFT"] = 6] = "OPPONENT_LEFT";
  OpCode[OpCode["INVITE_AI"] = 7] = "INVITE_AI";
})(OpCode || (OpCode = {}));

var aiUserId = "ai-user-id";
var tfServingAddress = "http://tf:8501/v1/models/ttt:predict";
var aiPresence = {
  userId: aiUserId,
  sessionId: "",
  username: aiUserId,
  node: ""
};
function aiMessage(code, data) {
  return {
    sender: aiPresence,
    persistence: true,
    status: "",
    opCode: code,
    data: data,
    reliable: true,
    receiveTimeMs: Date.now()
  };
}
function aiTurn(state, logger, nk) {
  var aiCell = [1, 0];
  var playerCell = [0, 1];
  var undefCell = [0, 0];
  var b = [[undefCell, undefCell, undefCell], [undefCell, undefCell, undefCell], [undefCell, undefCell, undefCell]];
  state.board.forEach(function (mark, idx) {
    var rowIdx = Math.floor(idx / 3);
    var cellIdx = idx % 3;
    if (mark === state.marks[aiUserId]) b[rowIdx][cellIdx] = aiCell;else if (mark === null || mark === Mark.UNDEFINED) b[rowIdx][cellIdx] = undefCell;else b[rowIdx][cellIdx] = playerCell;
  });
  var headers = {
    'Accept': 'application/json'
  };
  var resp = nk.httpRequest(tfServingAddress, 'post', headers, JSON.stringify({
    instances: [b]
  }));
  var body = JSON.parse(resp.body);
  var predictions = [];
  try {
    predictions = body.predictions[0];
  } catch (error) {
    logger.error("received unexpected TF response: %v: %v", error, body);
    return;
  }
  var maxVal = -Infinity;
  var aiMovePos = -1;
  predictions.forEach(function (val, idx) {
    if (val > maxVal) {
      maxVal = val;
      aiMovePos = idx;
    }
  });
  if (aiMovePos > -1) {
    var move = nk.stringToBinary(JSON.stringify({
      position: aiMovePos
    }));
    state.aiMessage = aiMessage(OpCode.MOVE, move);
  }
}

var moduleName = "tic-tac-toe_js";
var tickRate = 5;
var maxEmptySec = 30;
var delaybetweenGamesSec = 5;
var turnTimeFastSec = 10;
var turnTimeNormalSec = 20;
var winningPositions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
var matchInit = function matchInit(ctx, logger, nk, params) {
  var fast = !!params['fast'];
  var ai = !!params['ai'];
  var label = {
    open: 1,
    fast: 0
  };
  if (fast) {
    label.fast = 1;
  }
  var state = {
    label: label,
    emptyTicks: 0,
    presences: {},
    joinsInProgress: 0,
    playing: false,
    board: [],
    marks: {},
    mark: Mark.UNDEFINED,
    deadlineRemainingTicks: 0,
    winner: null,
    winnerPositions: null,
    nextGameRemainingTicks: 0,
    ai: ai,
    aiMessage: null
  };
  if (ai) {
    state.presences[aiUserId] = aiPresence;
  }
  return {
    state: state,
    tickRate: tickRate,
    label: JSON.stringify(label)
  };
};
var matchJoinAttempt = function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  if (presence.userId in state.presences) {
    if (state.presences[presence.userId] === null) {
      state.joinsInProgress++;
      return {
        state: state,
        accept: false
      };
    } else {
      return {
        state: state,
        accept: false,
        rejectMessage: 'already joined'
      };
    }
  }
  if (connectedPlayers(state) + state.joinsInProgress >= 2) {
    return {
      state: state,
      accept: false,
      rejectMessage: 'match full'
    };
  }
  state.joinsInProgress++;
  return {
    state: state,
    accept: true
  };
};
var matchJoin = function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  var t = msecToSec(Date.now());
  for (var _i = 0, presences_1 = presences; _i < presences_1.length; _i++) {
    var presence = presences_1[_i];
    state.emptyTicks = 0;
    state.presences[presence.userId] = presence;
    state.joinsInProgress--;
    if (state.playing) {
      var update = {
        board: state.board,
        mark: state.mark,
        deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate)
      };
      dispatcher.broadcastMessage(OpCode.UPDATE, JSON.stringify(update));
    } else if (state.board.length !== 0 && Object.keys(state.marks).length !== 0 && state.marks[presence.userId]) {
      logger.debug('player %s rejoined game', presence.userId);
      var done = {
        board: state.board,
        winner: state.winner,
        winnerPositions: state.winnerPositions,
        nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate)
      };
      dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(done));
    }
  }
  if (Object.keys(state.presences).length >= 2 && state.label.open != 0) {
    state.label.open = 0;
    var labelJSON = JSON.stringify(state.label);
    dispatcher.matchLabelUpdate(labelJSON);
  }
  return {
    state: state
  };
};
var matchLeave = function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (var _i = 0, presences_2 = presences; _i < presences_2.length; _i++) {
    var presence = presences_2[_i];
    logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);
    state.presences[presence.userId] = null;
  }
  var humanPlayersRemaining = [];
  Object.keys(state.presences).forEach(function (userId) {
    if (userId !== aiUserId && state.presences[userId] !== null) humanPlayersRemaining.push(state.presences[userId]);
  });
  if (humanPlayersRemaining.length === 1) {
    dispatcher.broadcastMessage(OpCode.OPPONENT_LEFT, null, humanPlayersRemaining, null, true);
  } else if (state.ai && humanPlayersRemaining.length === 0) {
    delete state.presences[aiUserId];
    state.ai = false;
  }
  return {
    state: state
  };
};
var matchLoop = function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  var _a;
  if (connectedPlayers(state) + state.joinsInProgress === 0) {
    state.emptyTicks++;
    if (state.emptyTicks >= maxEmptySec * tickRate) {
      logger.info('closing idle match');
      return null;
    }
  }
  var t = msecToSec(Date.now());
  if (!state.playing) {
    for (var userID in state.presences) {
      if (state.presences[userID] === null) {
        delete state.presences[userID];
      }
    }
    if (Object.keys(state.presences).length < 2 && state.label.open != 1) {
      state.label.open = 1;
      var labelJSON = JSON.stringify(state.label);
      dispatcher.matchLabelUpdate(labelJSON);
    }
    if (Object.keys(state.presences).length < 2) {
      return {
        state: state
      };
    }
    if (state.nextGameRemainingTicks > 0) {
      state.nextGameRemainingTicks--;
      return {
        state: state
      };
    }
    state.playing = true;
    state.board = new Array(9);
    state.marks = {};
    var marks_1 = [Mark.X, Mark.O];
    Object.keys(state.presences).forEach(function (userId) {
      var _a;
      if (state.ai) {
        if (userId === aiUserId) {
          state.marks[userId] = Mark.O;
        } else {
          state.marks[userId] = Mark.X;
        }
      } else {
        state.marks[userId] = (_a = marks_1.shift()) !== null && _a !== void 0 ? _a : null;
      }
    });
    state.mark = Mark.X;
    state.winner = Mark.UNDEFINED;
    state.winnerPositions = null;
    state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
    state.nextGameRemainingTicks = 0;
    var msg = {
      board: state.board,
      marks: state.marks,
      mark: state.mark,
      deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate)
    };
    dispatcher.broadcastMessage(OpCode.START, JSON.stringify(msg));
    return {
      state: state
    };
  }
  if (state.aiMessage !== null) {
    messages.push(state.aiMessage);
    state.aiMessage = null;
  }
  var _loop_1 = function _loop_1(message) {
    switch (message.opCode) {
      case OpCode.MOVE:
        logger.debug('Received move message from user: %v', state.marks);
        var mark = (_a = state.marks[message.sender.userId]) !== null && _a !== void 0 ? _a : null;
        var sender = message.sender.userId == aiUserId ? null : [message.sender];
        if (mark === null || state.mark != mark) {
          dispatcher.broadcastMessage(OpCode.REJECTED, null, sender);
          return "continue";
        }
        var msg = {};
        try {
          msg = JSON.parse(nk.binaryToString(message.data));
        } catch (error) {
          dispatcher.broadcastMessage(OpCode.REJECTED, null, sender);
          logger.debug('Bad data received: %v', error);
          return "continue";
        }
        if (state.board[msg.position]) {
          dispatcher.broadcastMessage(OpCode.REJECTED, null, sender);
          return "continue";
        }
        state.board[msg.position] = mark;
        state.mark = mark === Mark.O ? Mark.X : Mark.O;
        state.deadlineRemainingTicks = calculateDeadlineTicks(state.label);
        var _b = winCheck(state.board, mark),
          winner = _b[0],
          winningPos = _b[1];
        if (winner) {
          state.winner = mark;
          state.winnerPositions = winningPos;
          state.playing = false;
          state.deadlineRemainingTicks = 0;
          state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
        }
        var tie = state.board.every(function (v) {
          return v !== null;
        });
        if (tie) {
          state.playing = false;
          state.deadlineRemainingTicks = 0;
          state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
        }
        var opCode = void 0;
        var outgoingMsg = void 0;
        if (state.playing) {
          opCode = OpCode.UPDATE;
          var msg_1 = {
            board: state.board,
            mark: state.mark,
            deadline: t + Math.floor(state.deadlineRemainingTicks / tickRate)
          };
          outgoingMsg = msg_1;
        } else {
          opCode = OpCode.DONE;
          var msg_2 = {
            board: state.board,
            winner: state.winner,
            winnerPositions: state.winnerPositions,
            nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate)
          };
          outgoingMsg = msg_2;
          var walletUpdates = [];
          for (var userId in state.marks) {
            if (userId === 'ai-user-id') {
              continue;
            }
            if (state.marks[userId] === state.winner) {
              walletUpdates.push({
                userId: userId,
                changeset: {
                  wins: 1,
                  plays: 1
                },
                metadata: {
                  gameid: ctx.matchId
                }
              });
            } else {
              walletUpdates.push({
                userId: userId,
                changeset: {
                  plays: 1
                },
                metadata: {
                  gameid: ctx.matchId
                }
              });
            }
          }
          nk.walletsUpdate(walletUpdates, true);
        }
        dispatcher.broadcastMessage(opCode, JSON.stringify(outgoingMsg));
        break;
      case OpCode.INVITE_AI:
        if (state.ai) {
          logger.error('AI player is already playing');
          return "continue";
        }
        var activePlayers_1 = [];
        Object.keys(state.presences).forEach(function (userId) {
          var p = state.presences[userId];
          if (p === null) {
            delete state.presences[userId];
          } else {
            activePlayers_1.push(p);
          }
        });
        logger.debug('active users: %d', activePlayers_1.length);
        if (activePlayers_1.length != 1) {
          logger.error('one active player is required to enable AI mode');
          return "continue";
        }
        state.ai = true;
        state.presences[aiUserId] = aiPresence;
        if (state.marks[activePlayers_1[0].userId] == Mark.O) {
          state.marks[aiUserId] = Mark.X;
        } else {
          state.marks[aiUserId] = Mark.O;
        }
        logger.info('AI player joined match');
        break;
      default:
        dispatcher.broadcastMessage(OpCode.REJECTED, null, [message.sender]);
        logger.error('Unexpected opcode received: %d', message.opCode);
    }
  };
  for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
    var message = messages_1[_i];
    _loop_1(message);
  }
  if (state.playing) {
    state.deadlineRemainingTicks--;
    if (state.deadlineRemainingTicks <= 0) {
      state.playing = false;
      state.winner = state.mark === Mark.O ? Mark.X : Mark.O;
      state.deadlineRemainingTicks = 0;
      state.nextGameRemainingTicks = delaybetweenGamesSec * tickRate;
      var msg = {
        board: state.board,
        winner: state.winner,
        nextGameStart: t + Math.floor(state.nextGameRemainingTicks / tickRate),
        winnerPositions: null
      };
      dispatcher.broadcastMessage(OpCode.DONE, JSON.stringify(msg));
    }
  }
  if (state.ai && state.mark === state.marks[aiUserId]) {
    aiTurn(state, logger, nk);
  }
  return {
    state: state
  };
};
var matchTerminate = function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  return {
    state: state
  };
};
var matchSignal = function matchSignal(ctx, logger, nk, dispatcher, tick, state) {
  return {
    state: state
  };
};
function calculateDeadlineTicks(l) {
  if (l.fast === 1) {
    return turnTimeFastSec * tickRate;
  } else {
    return turnTimeNormalSec * tickRate;
  }
}
function winCheck(board, mark) {
  for (var _i = 0, winningPositions_1 = winningPositions; _i < winningPositions_1.length; _i++) {
    var wp = winningPositions_1[_i];
    if (board[wp[0]] === mark && board[wp[1]] === mark && board[wp[2]] === mark) {
      return [true, wp];
    }
  }
  return [false, null];
}
function connectedPlayers(s) {
  var count = 0;
  for (var _i = 0, _a = Object.keys(s.presences); _i < _a.length; _i++) {
    var p = _a[_i];
    if (s.presences[p] !== null) {
      count++;
    }
  }
  return count;
}

var rpcFindMatch = function rpcFindMatch(ctx, logger, nk, payload) {
  if (!ctx.userId) {
    throw Error('No user ID in context');
  }
  if (!payload) {
    throw Error('Expects payload.');
  }
  var request = {};
  try {
    request = JSON.parse(payload);
  } catch (error) {
    logger.error('Error parsing json message: %q', error);
    throw error;
  }
  if (request.ai) {
    var matchId = nk.matchCreate(moduleName, {
      fast: request.fast,
      ai: true
    });
    var res_1 = {
      matchIds: [matchId]
    };
    return JSON.stringify(res_1);
  }
  var matches;
  try {
    var query = "+label.open:1 +label.fast:".concat(request.fast ? 1 : 0);
    matches = nk.matchList(10, true, null, null, 1, query);
  } catch (error) {
    logger.error('Error listing matches: %v', error);
    throw error;
  }
  var matchIds = [];
  if (matches.length > 0) {
    matchIds = matches.map(function (m) {
      return m.matchId;
    });
  } else {
    try {
      matchIds.push(nk.matchCreate(moduleName, {
        fast: request.fast
      }));
    } catch (error) {
      logger.error('Error creating match: %v', error);
      throw error;
    }
  }
  var res = {
    matchIds: matchIds
  };
  return JSON.stringify(res);
};

var rpcIdRewards = 'rewards_js';
var rpcIdFindMatch = 'find_match_js';
var rpcIdAwardCoins = 'awardCoins';
var LEADERBOARD_ID = "radar";
var startArcadiaTournament = "start_arcadia_tournament";
var endArcadiaTournament = "end_arcadia_tournament";
function createLeaderboard(nk, id) {
  var authoritative = false;
  var sort = "descending";
  var operator = "best";
  var reset = '*/1 * * * *';
  var metadata = {
    weatherConditions: 'rain'
  };
  try {
    nk.leaderboardCreate(id, authoritative, sort, operator, reset, metadata);
  } catch (error) {}
}
var leaderboardReset = function leaderboardReset(ctx, logger, nk, leaderboard, reset) {
  if (leaderboard.id != LEADERBOARD_ID) {
    return;
  }
  var result = nk.leaderboardRecordsList(leaderboard.id, [], 3, undefined, reset);
  var walletUpdates = [];
  if (result && result.records) {
    result.records.forEach(function (r) {
      var reward = 100;
      walletUpdates.push({
        userId: r.ownerId,
        changeset: {
          coins: reward
        },
        metadata: {}
      });
    });
  }
  nk.walletsUpdate(walletUpdates, true);
};
function rpcCreateTournament(ctx, logger, nk, id) {
  createLeaderboard(nk, id);
  logger.info("leaderboard " + id + " created");
  return JSON.stringify({
    success: true
  });
}
function sendTokens(receivingWallet, tokensClaimed, nk, logger) {
  var data = {
    "walletAddresses": [receivingWallet],
    "amounts": [tokensClaimed]
  };
  var apiUrl = 'http://demo.cosmiclabs.org:3000/api/tokens/distribute';
  var apiKey = "f3d37ce6-3766-4027-a388-1090f512f601";
  var options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(data)
  };
  var response = nk.httpRequest(apiUrl, "post", options.headers, options.body);
  if (response.code > 299) {
    logger.error('Error distributing tokens: ' + response.body);
    return null;
  } else {
    logger.info('Tokens distributed successfully: ' + response.body);
    var body = JSON.parse(response.body);
    var transactionUrl = body.transactionUrl;
    return transactionUrl;
  }
}
function rpcAwardCoins(ctx, logger, nk, data) {
  if (ctx.userId) {
    var account = nk.accountGetId(ctx.userId);
    var wallet = account.wallet;
    if (wallet.wins || wallet.plays) {
      var wins = Number(wallet.wins);
      var plays = Number(wallet.plays);
      var tokensClaimed = wins * 0.1 + plays * 0.02;
      var receivingWallet = JSON.parse(data).data;
      var url = sendTokens(receivingWallet, tokensClaimed, nk, logger);
      return JSON.stringify({
        success: true,
        tokensClaimed: tokensClaimed,
        url: url
      });
    }
  }
  return JSON.stringify({
    success: false
  });
}
function InitModule(ctx, logger, nk, initializer) {
  initializer.registerRpc(rpcIdRewards, rpcReward);
  initializer.registerRpc(rpcIdFindMatch, rpcFindMatch);
  initializer.registerMatch(moduleName, {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal
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
!InitModule && InitModule.bind(null);
