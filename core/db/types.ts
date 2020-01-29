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

export interface Ranking {
    userid: string;
    wins: number;
    losses: number;
}

export interface Bug {
    id: number;
    comment: string;
    reportedby: string;
    timestamp: string;
}

export interface UserToken {
    userid: string;
    accesstoken: string;
    refreshtoken: string;
    expiry: Date;
}
