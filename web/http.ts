import { authorize } from "../core/auth";

const http = require("http");
const https = require("https");
const fs = require("fs");
const ws = require("ws");

import * as Express from "express";
import {
  checkForLynch,
  GamePhase,
  getVotecount,
  Player,
  resetVotes,
  VotecountEntry,
} from "../mafia/game-state";
import {
  beginGame,
  modkill,
  playerIn,
  unvote,
  vote,
  startGame,
} from "../mafia/commands/commands";
import { TextChannel, User } from "discord.js";
import { logger } from "../logger";
import { mafbot } from "../bot/bot";
import { MafiaPlayer, MafiaSetup } from "../mafia/libs/setups.lib";
import { deleteToken } from "../core/db/user-token";
const app = Express();

const dummyChannel = { send: () => {} } as TextChannel;

const certPath = "/etc/letsencrypt/live/mafbot.mafia451.com/";
const cert = fs.readFileSync(`${certPath}fullchain.pem`, "utf8");
const key = fs.readFileSync(`${certPath}privkey.pem`, "utf8");
app.use(Express.static("./web/static", { dotfiles: "allow" }));

app.get("/login", (req, res) => {
  res
    .status(301)
    .header(
      "Location",
      "https://discordapp.com/api/oauth2/authorize?client_id=487077607427276810&redirect_uri=https%3A%2F%2Fmafbot.mafia451.com%2Fauthenticate&response_type=code&scope=identify%20guilds.join&prompt=none"
    )
    .send();
});

app.get("/logout", (req, res) => {
  const userId = req.param("id");
  if (!userId) {
    res.status(400).send();
    return;
  }
  deleteToken(userId).then(() => {
    res.status(301).header("Location", "https://mafbot.mafia451.com/").send();
  });
});

app.post("/api/hosted", (req, res) => {
  const reqbody = req.body as HostedSetup;
  startGame(dummyChannel, null, [reqbody.setup, "hosted"]).then(() => {
    reqbody.players.forEach((p) => {
      mafbot.fetchUser(p.userid, true).then((user) => {
        const guildMember = mafbot.guilds
          .find((g) => !!g.member(user))
          .member(user);
        playerIn(dummyChannel, guildMember, [p.role, p.team]);
      });
    });
  });
  res.status(201).send();
});

app.get("/authenticate", (req, res) => {
  const code = req.url.split("?code=")[1];

  if (code) {
    authorize(code).then((user) => {
      console.log(`saved creds for new user: ${user.username}`);
      beginGame(dummyChannel);
      const userData = `id=${user.id}&username=${user.username}&hash=${user.discriminator}&avatar=${user.avatar}`;
      res
        .status(301)
        .header(
          "Location",
          `https://mafbot.mafia451.com/registration-confirmed?${userData}`
        )
        .send();
    });
  } else {
    console.log(`user denied auth request`);
    res
      .status(200)
      .send(
        `That isn't very helpful, I kinda need you to auth with me to work properly.`
      );
  }
});

app.use(Express.static(`${__dirname}/../../web/client/mafbot/dist/mafbot`));

const httpsServer = https
  .createServer({ key, cert }, app)
  .listen(8443, () => console.log("web server ready!"));

http
  .createServer((req, res) => {
    res.writeHead(301, { Location: `https://mafbot.mafia451.com${req.url}` });
    res.end();
  })
  .listen(8080);

const socketServer = new ws.Server({ server: httpsServer, path: "/ws" });
let gameState: string;
let players = [] as Player[];
let userClientMap = new Map<User, WebSocket>();
let formal: string;
let history = [] as GameHistory[];
let messages = [] as string[];
let phase: GamePhase;
let currentSetup: SimpleSetup;

socketServer.on("connection", (socket, req) => {
  const ip = req.connection.remoteAddress as string;

  socket.send(JSON.stringify({ path: "states", state: gameState }));
  socket.send(
    JSON.stringify({ path: "players", players: players.map(mapToSimplePlayer) })
  );
  socket.send(JSON.stringify({ path: "histories", histories: history }));
  if (currentSetup) {
    socket.send(JSON.stringify({ path: "currentsetups", setup: currentSetup }));
  }
  if (formal) {
    socket.send(JSON.stringify({ path: "formals", username: formal }));
  }
  if (phase) {
    socket.send(JSON.stringify({ path: "phases", phase: phase }));
  }

  socket.on("message", (message) => {
    logger.silly(`websocket message received: ${message}`);
    const json = JSON.parse(message);
    switch (json.path) {
      case "auth":
        mafbot.fetchUser(json.from.id, true).then((user) => {
          userClientMap.set(user, socket);
          updateActive();

          const player = players.find((p) => p.id === user.id);
          if (player && player.mafia && player.mafia.role) {
            socket.send(
              JSON.stringify({
                path: "roles",
                role: mapToSimpleRole(player.mafia),
              })
            );
          }
        });
        break;
      case "vote":
        const voter = players.find((p) => p.id === json.from.id);
        vote({} as TextChannel, voter, [formal]);
        break;
      case "unvote":
        const unvoter = players.find((p) => p.id === json.from.id);
        unvote({} as TextChannel, unvoter);
        break;
      case "in":
        if (!json.from.id) {
          return;
        }
        mafbot.fetchUser(json.from.id, true).then((user) => {
          const channel = { send: (msg) => webSendMessage(msg) } as TextChannel;
          const guildMember = mafbot.guilds
            .find((g) => !!g.member(user))
            .member(user);
          playerIn(channel, guildMember);
        });
        break;
      case "formal":
        if (!isAdmin(json.from.id) || formal) {
          return;
        }
        resetVotes();
        formal = json.username;
        socketServer.clients.forEach((client) =>
          client.send(JSON.stringify({ path: "formals", username: formal }))
        );
        break;
      case "reveal":
        if (!isAdmin(json.from.id) || !formal) {
          return;
        }
        const votecount = getVotecount();
        const votecountEntry = votecount.entries.find(
          (e) => e.votee === formal
        );
        const voters = votecountEntry
          ? votecountEntry.voters.map((v) => v.displayName)
          : [];
        checkForLynch(formal);
        formal = null;
        socketServer.clients.forEach((client) =>
          client.send(JSON.stringify({ path: "reveals", votes: voters }))
        );
        break;
      case "clear":
        if (!isAdmin(json.from.id)) {
          return;
        }
        formal = null;
        resetVotes();
        socketServer.clients.forEach((client) =>
          client.send(JSON.stringify({ path: "clears" }))
        );
        break;
      case "modkill":
        if (!isAdmin(json.from.id)) {
          return;
        }
        modkill({} as User, [json.username]);
        break;
    }
  });

  socket.on("error", (err) => {
    logger.error(err);
  });

  logger.debug(`Opened ws connection at ${ip}`);
  socket.on("close", () => {
    userClientMap.delete(socket);
    updateActive();
    logger.debug(`Closed ws connection at ${ip}`);
  });

  function updateActive() {
    socket.send(
      JSON.stringify({
        path: "actives",
        users: Array.from(userClientMap.keys()).map(
          (u) =>
            ({
              id: u.id,
              username: u.username,
              avatar: u.avatar,
              hash: u.discriminator,
            } as DiscordUser)
        ),
      })
    );
  }
});

socketServer.on("error", (err) => {
  logger.error(err);
});

export function webUpdateLivingPlayers(
  playersUpate: Player[],
  deadPlayer?: Player,
  killedString?: string
): void {
  logger.debug(
    `http-update for living players : ${playersUpate.map((p) => p.displayName)}`
  );
  players = playersUpate;
  const simplePlayers = playersUpate.map(mapToSimplePlayer);
  if (deadPlayer) {
    sendDeathMessage(deadPlayer, killedString);
  }
  socketServer.clients.forEach((client) =>
    client.send(JSON.stringify({ path: "players", players: simplePlayers }))
  );

  if (players.every((p) => p.mafia && !p.mafia.alive)) {
    players = [];
    history = [];
    messages = [];
    formal = null;
    phase = null;
  }
}

export function webSendRoles(): void {
  logger.debug(`web sending roles`);
  players.forEach((p) => {
    const userClient = userClientMap.get(p.user);
    if (userClient) {
      userClient.send(
        JSON.stringify({ path: "roles", role: mapToSimpleRole(p.mafia) })
      );
    } else {
      logger.warn(`Could not find socket connection for ${p.user.username}`);
    }
  });
}

export function webRecordVoteHistory(votecountEntry: VotecountEntry): void {
  logger.debug(`recording formal on player : ${votecountEntry.votee}`);
  history.push(mapToSimpleFormal(votecountEntry));
}

export function webSendMessage(message: string): void {
  logger.debug(`Sending message to web clients : ${message}`);
  messages.unshift(message);
}

export function webUpdatePhase(newPhase: GamePhase): void {
  logger.debug(`Updating web game phase : ${newPhase.toString()}`);
  if (phase) {
    history.push({ type: "phase", phase: { ...phase } });
  }
  phase = newPhase;
  socketServer.clients.forEach((client) =>
    client.send(JSON.stringify({ path: "phases", phase: phase }))
  );
}

export function webUpdateGameState(newState: string): void {
  logger.debug(`Updating web game state : ${newState}`);
  gameState = newState;
  socketServer.clients.forEach((client) =>
    client.send(JSON.stringify({ path: "states", state: newState }))
  );
}

export function webUpdateGameSetup(newSetup: MafiaSetup): void {
  logger.debug(`Updating web current setup : ${newSetup}`);
  currentSetup = newSetup ? mapToSimpleSetup(newSetup) : null;
  socketServer.clients.forEach((client) =>
    client.send(JSON.stringify({ path: "currentsetups", setup: currentSetup }))
  );
}

function sendDeathMessage(player: Player, killedString: string): void {
  const method = killedString.includes("lynch") ? "vote" : "kill";
  const message = {
    username: player.displayName,
    team: player.mafia.team.name,
    method: method,
  };
  socketServer.clients.forEach((client) =>
    client.send(JSON.stringify({ path: "deaths", death: message }))
  );
  if (method === "kill") {
    history.push({ type: "kill", subject: mapToSimplePlayer(player) });
  }
}

function mapToSimplePlayer(player: Player): SimplePlayer {
  return {
    id: player.id,
    username: player.displayName,
    alive: player.mafia && player.mafia.alive,
    team: !player.mafia || player.mafia.alive ? null : player.mafia.team.name,
  };
}

function mapToSimpleFormal(votecountEntry: VotecountEntry): GameHistory {
  return {
    type: "vote",
    subject: mapToSimplePlayer(
      players.find((p) => p.displayName === votecountEntry.votee)
    ),
    voters: votecountEntry.voters.map((v) =>
      mapToSimplePlayer(players.find((p) => v.id === p.id))
    ),
  };
}

function mapToSimpleSetup(setup: MafiaSetup): SimpleSetup {
  return {
    name: setup.name,
    helptext: setup.helptext,
    roles: setup.fixed
      ? setup.fixedSetups
          .getForPlayers(players.length)
          .setup.map(mapToSimpleRole)
      : [],
  };
}

function mapToSimpleRole(role: MafiaPlayer): SimpleRole {
  return {
    name: role.role.name,
    team: role.team.name,
    helptext: role.role.roletext,
    actions: role.role.abilities.map((a) => a.name),
    buddies:
      gameState === "in progress" && role.team.name === "mafia"
        ? players
            .filter((p) => p.mafia.team.name === "mafia")
            .map((p) => p.displayName)
        : [],
  };
}

function isAdmin(userId: string): boolean {
  const adminIds = [
    "135782754267693056",
    "127862334893850624",
    "343523759610789908",
    "339494032331767809",
    "356163154067193856",
  ];
  return adminIds.includes(userId);
}

class HostedSetup {
  setup: string;
  players: { userid: string; role: string; team: string }[];
}

class DiscordUser {
  id: string;
  username: string;
  hash: string;
  avatar: string;
}

class SimplePlayer {
  id: string;
  username: string;
  alive: boolean;
  team: string;
}

class SimpleSetup {
  name: string;
  helptext: string;
  roles: SimpleRole[];
}

class SimpleRole {
  name: string;
  team: string;
  helptext: string;
  actions: string[];
  buddies: string[];
}

class GameHistory {
  type: "phase" | "vote" | "kill";
  subject?: SimplePlayer;
  voters?: SimplePlayer[];
  phase?: GamePhase;
}
