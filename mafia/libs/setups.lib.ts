import { Phase } from "../game-state";
import { getRole, MafiaRole } from "./roles.lib";
import { Factions, MafiaTeam } from "./factions.lib";
import { cloneDeep } from "lodash";
import { Core } from "../../core/core";

export class MafiaSetup {
  name: string;
  helptext: string;
  basic: boolean;
  unimplemented: boolean;
  hidden: boolean;
  fixed: boolean;
  start: Phase;
  minplayers?: number;
  maxplayers?: number;
  fixedSetups?: FixedSetupArray;
  nightless?: boolean;
  townpowermult?: number;

  constructor(
    name: string,
    helptext: string,
    basic: boolean,
    unimplemented: boolean,
    hidden: boolean,
    fixed: boolean,
    start: Phase,
    minplayers?: number,
    maxplayers?: number,
    fixedSetups?: FixedSetupArray,
    nightless?: boolean,
    townpowermult?: number
  ) {
    this.name = name;
    this.helptext = helptext;
    this.basic = basic;
    this.unimplemented = unimplemented;
    this.hidden = hidden;
    this.fixed = fixed;
    this.start = start;
    this.minplayers = minplayers;
    this.maxplayers = maxplayers;
    this.fixedSetups = fixedSetups;
    this.nightless = nightless;
    this.townpowermult = townpowermult;
  }
}

export class MafiaPlayer {
  role: MafiaRole;
  team: MafiaTeam;
  alive: boolean;

  constructor(role: MafiaRole, team: MafiaTeam) {
    this.role = role;
    this.team = team;
    this.alive = true;
  }
}

class FixedSetup {
  minPlayers: number;
  setup: MafiaPlayer[];
  fillRole?: MafiaPlayer;

  constructor(minPlayers: number, setup: string[], fillRole?: string) {
    this.minPlayers = minPlayers;
    this.setup = setup.map(FixedSetup.toPlayer);
    this.fillRole = fillRole ? FixedSetup.toPlayer(fillRole) : null;
  }

  private static toPlayer(code: string): MafiaPlayer {
    const roleAndTeam = code.split("/");
    const mafiaRole = getRole(roleAndTeam[0]);
    const mafiaTeam = Factions.get(roleAndTeam[1] || "town");
    return new MafiaPlayer(mafiaRole, mafiaTeam);
  }
}

class FixedSetupArray {
  setups: FixedSetup[];
  constructor(setups: FixedSetup[]) {
    this.setups = setups;
  }

  getForPlayers(numPlayers: number): FixedSetup {
    let lastMatch = this.setups[0];
    for (const setup of this.setups) {
      if (setup.minPlayers <= numPlayers) {
        lastMatch = setup;
      } else {
        break;
      }
    }

    while (lastMatch.setup.length < numPlayers) {
      lastMatch.setup.push(Object.assign({}, lastMatch.fillRole));
    }
    return lastMatch;
  }
}

export function getSetup(key: string): MafiaSetup {
  const setup = Setups.get(key);
  return setup ? cloneDeep(setup) : null;
}

export function fetchAllSetups(
  showHidden: boolean = false,
  showUnimplemented: boolean = false
): MafiaSetup[] {
  return Core.filterMap(
    Setups,
    (value) =>
      (!value.hidden || showHidden) &&
      (!value.unimplemented || showUnimplemented)
  );
}

const Setups: Map<string, MafiaSetup> = new Map([
  [
    "moderated",
    new MafiaSetup(
      "moderated",
      "moderated (3+ players): A special type of setup where the person who starts the game is a host who subjects the players to his cruel designs.",
      false,
      true,
      false,
      true,
      Phase.DAY,
      3,
      40,
      new FixedSetupArray([new FixedSetup(3, [], "t")])
    ),
  ],
  [
    "mountainous",
    new MafiaSetup(
      "mountainous",
      "mountainous (11 players): Only townies and mafia. For purists.",
      true,
      false,
      false,
      true,
      Phase.DAY,
      5,
      20,
      new FixedSetupArray([
        new FixedSetup(5, ["m/mafia"], "t"),
        new FixedSetup(11, ["m/mafia", "m/mafia"], "t"),
      ])
    ),
  ],
  [
    "straight",
    new MafiaSetup(
      "straight",
      "straight (3+ players): Only Townies, Cops, Doctors, Vigilantes, Roleblockers, Mafiosi, and Godfathers appear.",
      true,
      true,
      false,
      false,
      Phase.DAY,
      3
    ),
  ],
  [
    "test",
    new MafiaSetup(
      "test",
      "test (x players): Test setup, not designed for actual use.",
      false,
      false,
      true,
      false,
      Phase.DAY
    ),
  ],
  [
    "ss3",
    new MafiaSetup(
      "ss3",
      "ss3 (3 players): A fixed setup with one super-saint, one townie, and one mafioso. If the super-saint is hammered, he kills his hammerer.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      3,
      3,
      new FixedSetupArray([new FixedSetup(3, ["ss", "t", "m/mafia"])])
    ),
  ],
  [
    "assassin",
    new MafiaSetup(
      "assassin",
      "assassin (4 - 12 players): One player is the King, some are Assassins, and the remainder are Guards. The Guards know who the King is, but the Assassins don't. The Assassins win if the King dies. There are no night kills, but if an Assassin is lynched they can kill one player before dying.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      4,
      12,
      new FixedSetupArray([
        new FixedSetup(4, ["ass_king", "ass_assassin/assassin"], "ass_guard"),
        new FixedSetup(
          8,
          ["ass_king", "ass_assassin/assassin", "ass_assassin/assassin"],
          "ass_guard"
        ),
        new FixedSetup(
          12,
          [
            "ass_king",
            "ass_assassin/assassin",
            "ass_assassin/assassin",
            "ass_assassin/assassin",
          ],
          "ass_guard"
        ),
      ]),
      true
    ),
  ],
  [
    "lyncher",
    new MafiaSetup(
      "lyncher",
      "lyncher (4 - 20 players): A fixed setup with one lyncher, one mafioso (5p+), and a bunch of townies. The game ends if the lyncher wins.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      4,
      20,
      new FixedSetupArray([
        new FixedSetup(4, ["tly", "ly/lyncher"], "t"),
        new FixedSetup(5, ["tly", "ly/lyncher", "m/mafia"], "t"),
      ])
    ),
  ],
  [
    "vengeful",
    new MafiaSetup(
      "vengeful",
      "vengeful (5 players): A fixed setup with one mafia godfather, one mafia goon, and three vengeful townies. If a vengeful townie is banished day one, they get to kill someone. If the godfather is banished day one, town wins.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      5,
      5,
      new FixedSetupArray([
        new FixedSetup(5, ["venge_m/mafia", "venge_gf/mafia"], "venge_t"),
      ]),
      true
    ),
  ],
  [
    "maflovers",
    new MafiaSetup(
      "maflovers",
      "maflovers (6 players): A fixed setup with two mafia lovers and four townies.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      6,
      6,
      new FixedSetupArray([
        new FixedSetup(6, ["lover/mafia", "lover/mafia"], "t"),
      ]),
      true
    ),
  ],
  [
    "masons",
    new MafiaSetup(
      "masons",
      "masons (5 - 24 players): A fixed setup with a few mafia, a few masons, and the rest townies.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      5,
      24,
      new FixedSetupArray([
        new FixedSetup(
          5,
          ["m/mafia", "m/mafia", "mason/town", "mason/town"],
          "t"
        ),
        new FixedSetup(
          12,
          [
            "m/mafia",
            "m/mafia",
            "m/mafia",
            "mason/town",
            "mason/town",
            "mason/town",
          ],
          "t"
        ),
        new FixedSetup(
          18,
          [
            "m/mafia",
            "m/mafia",
            "m/mafia",
            "m/mafia",
            "mason/town",
            "mason/town",
            "mason/town",
            "mason/town",
          ],
          "t"
        ),
      ])
    ),
  ],
  [
    "kidswithguns",
    new MafiaSetup(
      "kidswithguns",
      "kidswithguns (8 players): A fixed setup with a couple of killing roles. Don't get shot!",
      false,
      true,
      false,
      true,
      Phase.DAY,
      8,
      8,
      new FixedSetupArray([
        new FixedSetup(
          8,
          ["suibomb/mafia", "suibomb/mafia", "inno/town", "v1/town"],
          "t"
        ),
      ])
    ),
  ],
  [
    "paritycop",
    new MafiaSetup(
      "paritycop",
      "paritycop (9 players): A fixed setup that has two mafia and one parity cop.",
      false,
      true,
      false,
      true,
      Phase.DAY,
      9,
      9,
      new FixedSetupArray([
        new FixedSetup(9, ["m/mafia", "m/mafia", "parity/town"], "t"),
      ])
    ),
  ],
  [
    "fogofwar",
    new MafiaSetup(
      "fogofwar",
      "fogofwar (8 players): A fixed setup with two mafia bombs and a combat medic. Only one person gets a power role!",
      false,
      true,
      false,
      true,
      Phase.DAY,
      8,
      8,
      new FixedSetupArray([
        new FixedSetup(8, ["fog_m/mafia", "fog_m/mafia", "fog_cm/town"], "t"),
      ])
    ),
  ],
  [
    "451",
    new MafiaSetup(
      "451",
      "451 (10 players): Someone has a gun and isn't afraid to use it.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      10,
      10,
      new FixedSetupArray([
        new FixedSetup(
          10,
          ["m/mafia", "m/mafia", "m/mafia", "m/mafia", "dayvig/town"],
          "t"
        ),
      ])
    ),
  ],
  [
    "vig",
    new MafiaSetup(
      "vig",
      "vig (6 - 18 players): One vigilante and an appropriate number of mafia.",
      false,
      false,
      false,
      true,
      Phase.DAY,
      6,
      18,
      new FixedSetupArray([
        new FixedSetup(6, ["m/mafia", "m/mafia", "v/town"], "t"),
        new FixedSetup(12, ["m/mafia", "m/mafia", "m/mafia", "v/town"], "t"),
      ])
    ),
  ],
  [
    "bird7p",
    new MafiaSetup(
      "bird7p",
      "bird7p (7 players): A cop who's too cool to be protected and a doctor who won't claim, what will this wacky couple get themselves into next?",
      false,
      true,
      false,
      true,
      Phase.DAY,
      7,
      7,
      new FixedSetupArray([
        new FixedSetup(
          7,
          ["m/mafia", "m/mafia", "macho_cop/town", "scared_doc/town"],
          "t"
        ),
      ])
    ),
  ],
  [
    "nypd",
    new MafiaSetup(
      "nypd",
      "nypd (9 players): Three cops, three goons, three VT. You'll think you're really living in nyc!",
      false,
      false,
      false,
      true,
      Phase.DAY,
      9,
      9,
      new FixedSetupArray([
        new FixedSetup(
          9,
          ["m/mafia", "m/mafia", "m/mafia", "c/town", "c/town", "c/town"],
          "t"
        ),
      ])
    ),
  ],
  [
    "circus",
    new MafiaSetup(
      "circus",
      "circus (12 players): Tracker + doctor vs strongman + ninja",
      false,
      true,
      false,
      true,
      Phase.DAY,
      12,
      12,
      new FixedSetupArray([
        new FixedSetup(
          12,
          [
            "m/mafia",
            "ninja/mafia",
            "strongman/mafia",
            "tracker/town",
            "d/town",
          ],
          "t"
        ),
      ])
    ),
  ],
]);
