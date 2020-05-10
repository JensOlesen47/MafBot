let livingPlayers = [];
let timerInterval;

const adminIds = ['135782754267693056', '127862334893850624', '343523759610789908', '339494032331767809'];

const userid = localStorage.getItem('discord_id');
if (!userid) {
    window.location.assign('https://mafbot.mafia451.com/login');
}
if (adminIds.includes(userid)) {
    document.getElementById('adminDiv').hidden = false;
}

const username = localStorage.getItem('discord_username');

const socket = new WebSocket('wss://mafbot.mafia451.com/');
socket.onmessage = function (message) {
    console.log(`Got socket message: ${message.data}`);
    const json = JSON.parse(message.data);
    switch (json.path) {
        case 'players':
            updateLivingPlayers(json.players);
            break;
        case 'formal':
            doFormal(json.username);
            break;
        case 'reveal':
            doReveal(json.votes);
            break;
        case 'clear':
            doClear();
            break;
        case 'history':
            doHistory(json.formals);
            break;
        case 'log':
            doLog(json.logs);
            break;
    }
};

function sendSocketMessage(json) {
    json.from = { userid, username };
    socket.send(JSON.stringify(json));
}

window.addEventListener('unload', () => {
    socket.close();
});

function vote () {
    const voteButton = document.getElementById('voteBtn');
    if (voteButton.checked) {
        const formalSpan = document.getElementById('formalSpan');
        const formalledPlayer = formalSpan.innerHTML.replace(' is under formal!', '');
        formalSpan.innerHTML = `You have voted for ${formalledPlayer}.`;
        sendSocketMessage({ path: 'vote' });
    } else {
        const formalSpan = document.getElementById('formalSpan');
        const formalledPlayer = formalSpan.innerHTML.replace('You have voted for ', '').slice(0, -1);
        formalSpan.innerHTML = `${formalledPlayer} is under formal!`;
        sendSocketMessage({ path: 'unvote' });
    }
}

function formal (player) {
    sendSocketMessage({ path: 'formal', username: player });
}

function modkill (player) {
    if (confirm(`Do you really want to MODKILL ${player}?`)) {
        sendSocketMessage({ path: 'modkill', username: player });
    }
}

function clearVotes () {
    sendSocketMessage({ path: 'clear' });
}

function reveal () {
    sendSocketMessage({ path: 'reveal' });
}

function updateLivingPlayers (players) {
    const userIsAliveInGame = players.find(p => p.id === userid && p.alive);
    if (userIsAliveInGame) {
        document.getElementById('formalSpan').innerHTML = `Nobody is under formal at the moment.`;
    } else {
        document.getElementById('formalSpan').innerHTML = `Looks like you're not involved in a game at the moment.`;
    }

    livingPlayers = players.filter(p => p.alive).map(p => p.name);

    document.getElementById('livingPlayersDiv').hidden = false;

    document.getElementById('livingPlayers').innerHTML = livingPlayers
        .map(p => `<div id="livingPlayer_${p}"><span class="badge badge-secondary">${p}</span><span id="vote_${p}" class="position-fixed ml-1" hidden>🙋</span></div>`)
        .join('\n');

    document.getElementById('deadPlayers').innerHTML = players.filter(p => !p.alive)
        .map(p => `<div id="deadPlayer_${p.name}">${getBadge(p)}</div>`);

    document.getElementById('formalMenu').innerHTML = livingPlayers
        .map(p => `<button id="formalPlayer_${p}" class="dropdown-item" onclick="formal('${p}')">${p}</button>`)
        .join('\n');

    document.getElementById('modkillMenu').innerHTML = livingPlayers
        .map(p => `<button id="modkillPlayer_${p}" class="dropdown-item" onclick="modkill('${p}')">${p}</button>`)
        .join('\n');
}

function doFormal (player) {
    document.getElementById('voteDiv').hidden = false;
    document.getElementById('voteBtn').checked = false;
    document.getElementById('formalSpan').innerHTML = `${player} is under formal!`;
    document.getElementById('formalTimer').innerHTML = `1:00`;
    document.getElementById('formalTimer').hidden = false;
    let timer = 60;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        document.getElementById('formalTimer').innerHTML = `0:${timer <= 10 ? '0' : ''}${--timer}`;
        if (!timer && timerInterval) clearInterval(timerInterval);
    }, 1000);
}

function doReveal (votes) {
    doClear();

    votes.forEach(v => document.getElementById(`vote_${v}`).hidden = false);
}

function doClear () {
    document.getElementById('voteDiv').hidden = true;
    document.getElementById('voteBtn').checked = false;

    document.getElementById('formalSpan').innerHTML = 'Nobody is under formal at the moment.';
    document.getElementById('formalTimer').hidden = true;
    if (timerInterval) clearInterval(timerInterval);

    livingPlayers.forEach(p => document.getElementById(`vote_${p}`).hidden = true);
}

function doHistory (formals) {
    const historyDiv = document.getElementById('historyDiv');
    const historyCards = document.getElementById('historyCards');

    if (!formals.length) {
        historyDiv.hidden = true;
        historyCards.innerHTML = '';
    } else {
        historyDiv.hidden = false;
        historyCards.innerHTML = formals.map(buildFormalCard).join('\n');
    }
}

function getBadge (player) {
    let badgeClass;
    if (player.alive) {
        badgeClass = 'badge badge-secondary';
    } else if (player.team === 'town') {
        badgeClass = 'badge badge-success';
    } else if (player.team === 'mafia') {
        badgeClass = 'badge badge-danger';
    } else {
        badgeClass = 'badge badge-warning';
    }
    return `<span class="${badgeClass}">${player.name}</span>`;
}

function buildFormalCard (formal) {
    return `<div class="card m-1"><div class="card-header text-center">${getBadge(formal.votee)}</div><div class="card-body text-center">${formal.voters.map(getBadge).join('<br>')}</div></div>`;
}

function doLog (logs) {
    document.getElementById('logDiv').hidden = !logs.length;
    document.getElementById('logPre').innerHTML = logs;
}
