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
    }
};

window.addEventListener('unload', () => {
    socket.close();
});

function vote () {
    const voteButton = document.getElementById('voteBtn');
    voteButton.toggleAttribute('disabled', true);
    voteButton.setAttribute('style', 'cursor: not-allowed');
    voteButton.setAttribute('class', 'btn btn-success');

    const formalSpan = document.getElementById('formalSpan');
    const formalledPlayer = formalSpan.innerHTML.replace(' is under formal!', '');
    formalSpan.innerHTML = `You have voted for ${formalledPlayer}.`;

    const json = { path: 'vote', userid };
    socket.send(JSON.stringify(json));
}

function formal (player) {
    const json = { path: 'formal', userid, username: player };
    socket.send(JSON.stringify(json));
}

function clearVotes () {
    const json = { path: 'clear', userid };
    socket.send(JSON.stringify(json));
}

function reveal () {
    const json = { path: 'reveal', userid };
    socket.send(JSON.stringify(json));
}

function updateLivingPlayers (players) {
    document.getElementById('voteBtn').hidden = !players.find(p => p.id === userid);
    document.getElementById('formalSpan').innerHTML = `Looks like you're not involved in a game at the moment.`;

    livingPlayers = players.map(p => p.name);

    document.getElementById('livingPlayersDiv').innerHTML = livingPlayers
        .map(p => `<div id="livingPlayer_${p}"><span class="badge badge-secondary">${p}</span><span id="vote_${p}" class="position-fixed ml-1" hidden>🙋</span></div>`)
        .join('\n');

    document.getElementById('formalMenu').innerHTML = livingPlayers
        .map(p => `<button id="formalPlayer_${p}" class="dropdown-item" onclick="formal('${p}')">${p}</button>`)
        .join('\n');
}

function doFormal (player) {
    const voteButton = document.getElementById('voteBtn');
    voteButton.toggleAttribute('disabled', false);
    voteButton.removeAttribute('style');
    voteButton.setAttribute('class', 'btn btn-info');
    document.getElementById('formalSpan').innerHTML = `${player} is under formal!`;
}

function doReveal (votes) {
    doClear();

    votes.forEach(v => document.getElementById(`vote_${v}`).hidden = false);
}

function doClear () {
    const voteButton = document.getElementById('voteBtn');
    voteButton.toggleAttribute('disabled', true);
    voteButton.setAttribute('style', 'cursor: not-allowed');
    voteButton.setAttribute('class', 'btn btn-secondary');
    document.getElementById('formalSpan').innerHTML = 'Nobody is under formal at the moment.';
    livingPlayers.forEach(p => document.getElementById(`vote_${p}`).hidden = true);
}
