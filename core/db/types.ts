export interface Setup {
    id: number;
    name: string;
}

export interface GameHistory {
    id: number;
    video: boolean;
    fksetup: number;
    winningteam?: string;
    timestamp: string;
    guildid: string;
}

export interface UserHistory {
    fkgamehistory: number;
    userid: number;
    username: string;
    role: string;
    team: string;
    won?: boolean;
    death?: string;
}

export interface History {
    id: number;
    video: boolean;
    setupname: string;
    winningteam: string;
    timestamp: string;
    guildid: string;
    userid: string;
    username: string;
    role: string;
    team: string;
    won: boolean;
    death: string;
}