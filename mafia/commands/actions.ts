import state = require('../game-state');
import {Player} from "../game-state";
import {User} from "discord.js";
import {getAbility, MafiaAbility} from "../libs/abilities.lib";
import {getRole} from "../libs/roles.lib";
import {Factions} from "../libs/factions.lib";
import {Core} from "../../core/core";

export class Action extends MafiaAbility {
    victims: Player[];
    actioner?: Player;
    status?: string;
    templates?: string[];
}

let actionQueue: Action[] = [];

const actionFnList = new Map<string, (action: Action) => Promise<void>>([
    [none.name, none],
    [kill.name, kill],
    [protect.name, protect],
    [inspect.name, inspect],
    [block.name, block],
    [giveability.name, giveability],
    [suicidebomb.name, suicidebomb],
    [suicide.name, suicide],
    [setbuddy.name, setbuddy],
    [transform.name, transform],
    [decreasestatus.name, decreasestatus],
    [increasestatus.name, increasestatus]
]);

export async function resolveActions () : Promise<void> {
    actionQueue.sort((a, b) => a.priority - b.priority);
    for (const actn of actionQueue) {
        await actionFnList.get(actn.alias || actn.name)(actn);
    }
    actionQueue.length = 0;
}

export async function doAction (user: User, args: string[], cmd: string) : Promise<void> {
    console.log('doing action: ' + cmd);
    const actioner = state.players.find(player => player.user.id === user.id);
    if (!state.isGameInProgress()) {
        user.send(`This is not a valid thing to be doing at this time sir and/or madam.`);
    } else if (!actioner || !actioner.mafia.alive) {
        user.send(`You are not a living player in the current game.`);
    } else if (actioner.mafia.role.abilities.length === 0) {
        user.send(`Your role cannot perform any actions.`);
    } else if (!actioner.mafia.role.abilities.find(ability => ability.name === cmd) && cmd !== 'none') {
        user.send(`Your role can only perform the following action${actioner.mafia.role.abilities.length !== 1 ? 's' : ''}: ${actioner.mafia.role.abilities.map(ability => ability.name).join(', ')}`);
    } else if (cmd !== 'none' && actioner.mafia.role.abilities.find(ability => ability.name === cmd).shots <= 0) {
        user.send(`You've already used all your shots of ${cmd}.`);
    } else if (cmd === 'mafiakill' && actionQueue.find(actn => actn.name === 'mafiakill')) {
        user.send(`Your team has already submitted a mafiakill for this phase.`);
    } else if (actionQueue.find(actn => actn.actioner === actioner)) {
        user.send(`You have already submitted an action for this phase.`);
    } else if (state.isDay() && !cmd.startsWith('day')) {
        user.send(`You may not perform that action during the day.`);
    } else if (!state.isDay() && cmd.startsWith('day')) {
        user.send(`You may only perform that action during the day.`);
    } else {
        if (state.isDay()) {
            cmd = cmd.split('day')[1];
        }
        const action = getAction(actioner, args, cmd);
        if (!action) {
            return;
        }
    
        if (state.isNight()) {
            actionQueue.push(action);
            await checkForFullActionQueue();
        } else if (state.isDusk()) {
            console.log('processing dusk action..');
            if (!state.isDuskAwaitingPlayer(user)) {
                user.send(`You cannot submit an action at this time.`);
                return;
            } else {
                await actionFnList.get(action.alias || action.name)(action);
                if (state.isGameInProgress()) {
                    console.log('advancing to night phase from dusk..');
                    await state.advancePhase();
                }
            }
        } else {
            await actionFnList.get(action.alias || action.name)(action);
        }
        user.send(`Action confirmed: ${cmd}${action.victims.length > 0 ? ' on ' + action.victims.map(victim => victim.displayName).join(' & ') : null}.`);
    }
}

function getAction (actioner: Player, args: string[], cmd: string) : Action {
    console.log('getting action: ' + cmd);
    const action = getAbility(cmd) as Action;
    if (args.length !== action.targets.length) {
        actioner.send(`You gave ${args.length} target${args.length !== 1 ? 's' : null} but this action requires ${action.targets.length}.`);
        return;
    }

    const victims = [];
    args.every((arg, i) => {
        // alive, nonself, unique, dead
        const allowableTargets = action.targets[i];
        if (arg === 'self') {
            if (!allowableTargets.includes('nonself')) {
                victims.push(actioner);
                return true;
            } else {
                actioner.send(`You cannot target yourself with this ability.`);
            }
        } else {
            const victim = state.players.find(user => user.displayName.toLowerCase() === arg.toLowerCase())
                || state.players.find(user => user.displayName.toLowerCase().startsWith(arg.toLowerCase()));
            if (victim) {
                if (allowableTargets.includes('unique') && victims.includes(victim)) {
                    actioner.send(`You cannot target the same player twice with this ability.`);
                } else if (allowableTargets.includes('alive') && !victim.mafia.alive) {
                    actioner.send(`You may only target living players with this ability. ${arg} is dead.`);
                } else if (allowableTargets.includes('dead') && victim.mafia.alive) {
                    actioner.send(`You may only target dead players with this ability. ${arg} is alive.`);
                } else {
                    victims.push(victim);
                    return true;
                }
            } else {
                actioner.send(`'${arg}' is not a valid target.`);
            }
        }
        return false;
    });
    if (args.length !== victims.length) {
        return;
    }

    action.actioner = actioner;
    action.victims = victims;
    return action;
}

export async function checkForFullActionQueue () : Promise<void> {
    if (state.isNight() && state.players.every(playerHasSubmittedAction)) {
        await state.advancePhase();
    }

    function playerHasSubmittedAction(player: Player) {
        return !player.mafia.alive
            || player.mafia.role.abilities.length === 0
            || actionQueue.some(action => action.actioner.id === player.id)
            || (player.mafia.role.abilities.every(ability => ability.name === 'mafiakill') && actionQueue.some(action => action.name === 'mafiakill'));
    }
}

export async function deduceActionFromRole (status: string, player: Player) : Promise<() => Promise<void>> {
    const fullAction = status.split('action:')[1];
    if (fullAction) {
        const actionAndTargets = fullAction.split(' #');
        const actionName = actionAndTargets.shift();
        let victims: Player[] = [];
        actionAndTargets.forEach(target => {
            switch (target) {
                case '@':
                    victims.push(player);
                    break;
                case '*':
                    victims = victims.concat(state.players);
                    break;
                default:
                    const targetedRole = getRole(target);
                    const targetedPlayers = state.players.filter(
                        i => (i.mafia.role.truename || i.mafia.role.name) === targetedRole.name && i.id !== player.id
                    );
                    victims = victims.concat(targetedPlayers);
                    break;
            }
        });

        const splitAction = actionName.split('+');
        const mafiaAbility = getAbility(splitAction.shift()) as Action;
        mafiaAbility.victims = victims;
        mafiaAbility.actioner = player;
        if (splitAction.length > 0) {
            mafiaAbility.templates = splitAction;
        }
        return async () : Promise<void> => await actionFnList.get(actionName)(mafiaAbility);
    }
    return async () : Promise<void> => {};
}

export async function none (action: Action) : Promise<void> {}

export async function kill (action: Action) : Promise<void> {
    for (const victim of action.victims) {
        if (victim.mafia.alive) {
            if (!hasStatus(victim, 'immunekill')) {
                await state.killPlayer(victim);
            } else {
                await _decreaseStatus(victim, 'immunekill');
            }
        }
    }
}

export async function protect (action: Action) : Promise<void> {
    for (const victim of action.victims) {
        await tempIncreaseStatus(victim, 'immunekill');
    }
}

export async function inspect (action: Action) : Promise<void> {
    action.victims.forEach(victim => {
        const inspectStatus = victim.mafia.role.status.inspect || victim.mafia.team.name;
        action.actioner.send(`${victim.displayName} is ${inspectStatus}.`);
    });
}

export async function block (action: Action) : Promise<void> {
    action.victims.forEach(victim => {
        const victimAction = actionQueue.find(actn => actn.actioner === victim);
        if (victimAction) {
            victimAction.victims.length = 0;
        }
    });
}

export async function giveability (action: Action) : Promise<void> {
    action.victims.forEach(victim => {
        const gifts = action.actioner.mafia.role.status.gifts;
        const randomGift = gifts[Core.randomNumber(gifts.length)];
        const mafiaAbility = getAbility(randomGift);
        victim.mafia.role.abilities.push(mafiaAbility);
        victim.send(`You have gained a new ability: ${mafiaAbility.name}`);
    });
}

export async function suicidebomb (action: Action) : Promise<void> {
    await suicide(action);
    await kill(action);
}

export async function suicide (action: Action) : Promise<void> {
    await state.killPlayer(action.actioner, 'committed suicide');
}

export async function setbuddy (action: Action) : Promise<void> {
    const target = action.victims.pop();
    action.victims.forEach(victim => {
        victim.mafia.role.buddy = target;
    });
}

export async function transform (action: Action) : Promise<void> {
    const transformTo = action.actioner.mafia.role.status.transform.split('/');
    action.victims.forEach(victim => {
        victim.mafia.role = getRole(transformTo[0]);
        if (transformTo.length > 1) {
            victim.mafia.team = Factions.get(transformTo[1]);
        }
        if (!action.templates.includes('silent')) {
            victim.send(`You have a new role. You are now a ${victim.mafia.role.name} (${victim.mafia.team.name}).`);
        }
    });
}

export async function reveal (action: Action) : Promise<void> {
    state.channel.send(`${action.actioner.displayName} has revealed himself to be ${action.actioner.mafia.team.name}!`);
}

export async function decreasestatus (action: Action) : Promise<void> {
    action.victims.forEach(victim => {
        if (victim.mafia.role.status[action.status] && typeof victim.mafia.role.status === 'number') {
            --victim.mafia.role.status;
        }
    });
}

export async function increasestatus (action: Action) : Promise<void> {
    action.victims.forEach(victim => {
        if (!victim.mafia.role.status[action.status]) {
            victim.mafia.role.status[action.status] = 1;
        } else if (typeof victim.mafia.role.status === 'number') {
            ++victim.mafia.role.status;
        }
    });
}

async function _decreaseStatus (player: Player, status: string) : Promise<void> {
    const action = getAbility('decreasestatus') as Action;
    action.victims = [player];
    action.status = status;
    await decreasestatus(action);
}

async function _increaseStatus (player: Player, status: string) : Promise<void> {
    const action = getAbility('increasestatus') as Action;
    action.victims = [player];
    action.status = status;
    await increasestatus(action);
}

async function tempDecreaseStatus (player: Player, status: string) : Promise<void> {
    const action = getAbility('decreasestatus') as Action;
    action.victims = [player];
    action.status = status;
    await decreasestatus(action);

    const queueIncreaseAction = getAbility('increasestatus') as Action;
    action.victims = [player];
    action.status = status;
    actionQueue.push(queueIncreaseAction);
}

async function tempIncreaseStatus (player: Player, status: string) : Promise<void> {
    const action = getAbility('increasestatus') as Action;
    action.victims = [player];
    action.status = status;
    await increasestatus(action);

    const queueDecreaseAction = getAbility('decreasestatus') as Action;
    action.victims = [player];
    action.status = status;
    actionQueue.push(queueDecreaseAction);
}

function hasStatus (player: Player, status: string) : boolean {
    return !!player.mafia.role.status[status];
}
