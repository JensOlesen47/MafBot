import {Collection, GuildMember, Role, User} from "discord.js";

const testUsers = [
    {
        id: '1',
        username: 'Amethyst'
    },
    {
        id: '2',
        username: 'Beryl'
    },
    {
        id: '3',
        username: 'Chrysocolla'
    },
    {
        id: '4',
        username: 'Diamond'
    },
    {
        id: '5',
        username: 'Emerald'
    },
    {
        id: '6',
        username: 'Feldspar'
    },
    {
        id: '7',
        username: 'Garnet'
    },
    {
        id: '8',
        username: 'Hematite'
    }
] as User[];

export function getTestUser (index: number, parentUser: User) : GuildMember {
    const user = testUsers[index];
    const send = async (msg: string) => parentUser.send(`[${user.username}] ${msg}`);

    return {
        user: {
            ...user,
            send
        },
        id: user.id,
        displayName: user.username,
        roles: new Collection<string, Role>(),
        addRole: (role, reason?) => null,
        removeRole: (role, reason) => null,
        send: send
    } as GuildMember;
}

export function isTestUser(user: User) : boolean {
    return Number(user.id) < 100;
}
