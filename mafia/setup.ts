import state = require('./game-state');
import actions = require('./commands/actions');
import {filterRoles, getRole, MafiaRole} from "./libs/roles.lib";
import {MafiaSetup, MafiaPlayer, getSetup} from "./libs/setups.lib";
import {Factions} from "./libs/factions.lib";
import {Core} from "../core/core";
import {logger} from "../logger";
import {RichEmbed} from "discord.js";
import {players} from "./game-state";
import {createGuildForPlayers} from "./private-chat";

export let currentSetup: MafiaSetup;
export let video: boolean;
export let testGame: boolean;

export function setSetup (setupName: string) : void {
    currentSetup = getSetup(setupName);
}

// currently only supports moderated games, will hopefully be enhanced to support spoilers too
export function getSetupAsEmbed () : RichEmbed {
    const size = players.length;
    const embed = new RichEmbed().setTitle(`${size}p ${currentSetup.name}`)
        .setDescription('Use `addrole [town|mafia|sk] "[rolename]" "[roletext]"` and `removerole "[rolename]"` to configure your setup.' +
            '\nIf there are more players than roles, the rest will be townies.');
    if (currentSetup.fixed) {
        const fixedSetupRoleList = currentSetup.fixedSetups.setups[0].setup.sort((a, b) => a.team.name > b.team.name ? 1 : -1);
        let lastTeam = '';
        let teamMembers = [] as MafiaPlayer[];
        for (const player of fixedSetupRoleList) {
            if (!lastTeam) {
                lastTeam = player.team.name;
            } else if (lastTeam !== player.team.name) {
                embed.addField(lastTeam, teamMembers.map(member => `**${member.role.truename || member.role.name}** - ${member.role.roletext}`).join('\n'));
                teamMembers = [];
                lastTeam = player.team.name;
            }
            teamMembers.push(player);
        }
        embed.addField(lastTeam, teamMembers.map(member => `**${member.role.truename || member.role.name} (${member.team.name})**\n${member.role.roletext}`).join('\n'));
    }
    return embed;
}

export async function initializeSetup () : Promise<void> {
    if (currentSetup.fixed) {
        await initializeFixedSetup();
    } else {
        await initializeRandomSetup();
    }
    logger.debug(state.players.map(player => `${player.displayName} - ${player.mafia.role.name} (${player.mafia.team.name})`));
}

async function initializeFixedSetup () : Promise<void> {
    await initSetup(getFixedSetupRoleList());
}

async function initializeRandomSetup () : Promise<void> {
    const numPlayers = state.players.length;
    const maxScum = [1,1,1,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4,4,4,4,5];
    const minScum = [1,1,1,1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4];
    const numScum = Math.random() >= 0.5 ? maxScum[numPlayers - 3] : minScum[numPlayers - 3];

    let possibleTownRoles = getPossibleRoles('town');
    possibleTownRoles.splice(possibleTownRoles.indexOf(getRole('t')));
    let possibleMafiaRoles = getPossibleRoles('mafia');
    possibleMafiaRoles.splice(possibleMafiaRoles.indexOf(getRole('m')));

    const selectedRoles = selectRoles(numPlayers, numScum, possibleTownRoles, possibleMafiaRoles);

    await initSetup(selectedRoles);
}

function getPossibleRoles (team: string) : MafiaRole[] {
    return filterRoles(role => {
        if (role.teams.length) {
            const roleTeam = role.teams.find(str => str.startsWith(team));
            return roleTeam && currentSetup.basic ? role.basic : true;
        }
    });
}

function selectRoles (numPlayers: number, numScum: number, possibleTownRoles: MafiaRole[], possibleMafiaRoles: MafiaRole[]) : MafiaPlayer[] {
    const roleList: MafiaPlayer[] = [];
    const targetTownPower = calculateTownPower(numPlayers, numScum);
    const targetMafiaPower = calculateMafiaPower(numPlayers, numScum, targetTownPower);

    let townPower: number = 0;
    const townFaction = Factions.get('town');
    while (roleList.length < numPlayers - numScum) {
        if (Math.random() < targetTownPower - townPower) {
            const randomRole = Core.getRandomArrayValue(possibleTownRoles);
            townPower += randomRole.power;

            roleList.push(new MafiaPlayer(randomRole, townFaction));
        } else {
            roleList.push(new MafiaPlayer(getRole('t'), townFaction));
        }
    }

    let mafiaPower = townPower - targetTownPower;
    const mafiaFaction = Factions.get('mafia');
    while (roleList.length < numPlayers) {
        if (Math.random() < targetMafiaPower - mafiaPower) {
            const randomRole = Core.getRandomArrayValue(possibleMafiaRoles);
            mafiaPower += randomRole.power;
            roleList.push(new MafiaPlayer(randomRole, mafiaFaction));
        } else {
            roleList.push(new MafiaPlayer(getRole('m'), mafiaFaction));
        }
    }

    return roleList;
}

function calculateTownPower (numPlayers: number, numScum: number) : number {
    if (numPlayers === 3) {
        return 0.6;
    }
    const numTown = numPlayers - numScum;
    let power = numScum * 3 - numTown * 0.9 + 2;
    power *= currentSetup.townpowermult || 1;

    power /= numTown;
    power += Math.random() * 0.4 - 0.2;

    return (power > 0.8 ? 0.8 : power < 0.1 ? 0.1 : power) * numTown;
}

function calculateMafiaPower (numPlayers: number, numScum: number, townPower: number) : number {
    return 0.05 * (numPlayers - numScum) + 0.20 * townPower;
}

async function initSetup (roleList: MafiaPlayer[]) : Promise<void> {
    Core.shuffleArray(roleList);
    const actionQueue: (() => Promise<void>)[] = [];

    for (const player of state.players) {
        player.mafia = roleList.pop();
    }
    // make sure all the roles are assigned before trying any funny business
    for (const player of state.players) {
        if (player.mafia.team.abilities) {
            player.mafia.role.abilities = player.mafia.role.abilities.concat(player.mafia.team.abilities);
        }
        if (player.mafia.role.status.onstart) {
            actionQueue.push(await actions.deduceActionFromRole(player.mafia.role.status.onstart, player));
        }
    }

    for (const action of actionQueue) {
        await action();
    }

    for (const player of state.players) {
        const actionString = player.mafia.role.abilities.length > 0
            ? player.mafia.role.abilities.map(ability => `${ability.day ? 'day' : ''}${ability.name}${ability.shots === 1 ? ' (1-shot)' : ''}`).join(', ')
            : `none`;
        if (player.mafia.role.roletext.includes('BUDDY1')) {
            player.mafia.role.roletext = player.mafia.role.roletext.replace('BUDDY1', player.mafia.role.buddy.displayName);
        }
        player.send(`You are a ${player.mafia.role.name} (${player.mafia.team.name}). ${player.mafia.role.roletext} ${player.mafia.team.wintext}`);
        player.send(`Actions: ${actionString}`);

        let teammates = [];
        if (player.mafia.team.openteam) {
            teammates = state.players.filter(p => p.mafia.team.name === player.mafia.team.name && p.user.id !== player.user.id);
        } else if (player.mafia.role.name === 'Mason') {
            teammates = state.players.filter(p => p.mafia.role.name === 'Mason' && p.user.id !== player.user.id);
        }
        if (teammates.length > 0) {
            player.send(`Your ${player.mafia.team.name} budd${teammates.length > 1 ? 'ies' : 'y'}: ${teammates.map(mate => mate.displayName).join(', ')}`);
        }
    }

    const mafia = state.players.filter(player => player.mafia.team.name === 'mafia');
    if (mafia.length >= 2) {
        createGuildForPlayers(mafia, 'Mafia');
    }
    const masons = state.players.filter(player => player.mafia.role.name === 'Mason');
    if (masons.length >= 2) {
        createGuildForPlayers(masons, 'Mason');
    }
}

function getFixedSetupRoleList () : MafiaPlayer[] {
    const fixedSetup = currentSetup.fixedSetups.getForPlayers(state.players.length);

    return fixedSetup.setup;
}
