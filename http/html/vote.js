// hideOthers('usernameDiv');

const livingPlayers = ['Urist','StarV','Ellibereth','Keychain'];

updateLivingPlayers(livingPlayers);

const adminIds = ['135782754267693056', '127862334893850624', '343523759610789908', '339494032331767809'];

const userid = localStorage.getItem('discord_id');
if (!userid) {
    window.location.assign('https://mafbot.mafia451.com/login');
}
if (adminIds.includes(userid)) {
    document.getElementById('adminDiv').hidden = false;
}

const username = localStorage.getItem('discord_username');
// let formalledUser;
// let formalledBy;

const socket = new WebSocket('wss://mafbot.mafia451.com/');
socket.onmessage = function (message) {
    console.log(`Got socket message: ${message.data}`);
    const json = JSON.parse(message.data);
    switch (json.path) {
        // case 'user':
        //     updateUsers(json.users);
        //     break;
        // case 'formal':
        //     doFormal(json.formal, json.username);
        //     break;
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
    // const json = { path: 'logout', username: username };
    // socket.send(JSON.stringify(json));
    socket.close();
});

// function submitUsername () {
//     username = document.getElementById('username').value;
//     if (!username) {
//         return;
//     }
//
//     hideOthers('formalDiv');
//
//     const json = { path: 'login', username: username };
//     socket.send(JSON.stringify(json));
// }

// function submitFormal () {
//     const formalee = document.getElementById('formal').value;
//     if (!formalee) {
//         return;
//     }
//     const json = { path: 'formal', username: username, formal: document.getElementById('formal').value };
//     socket.send(JSON.stringify(json));
// }

function vote () {
    const voteButton = document.getElementById('voteBtn');
    voteButton.toggleAttribute('disabled', true);
    voteButton.setAttribute('class', 'btn btn-success');

    const formalSpan = document.getElementById('formalSpan');
    const formalledPlayer = formalSpan.innerHTML.replace(' is under formal!', '');
    formalSpan.innerHTML = `You have voted for ${formalledPlayer}.`;

    const json = { path: 'vote', username: username };
    socket.send(JSON.stringify(json));
}

function formal (player) {
    const json = { path: 'formal', username: player };
    socket.send(JSON.stringify(json));
}

function clear () {
    const json = { path: 'clear' };
    socket.send(JSON.stringify(json));
}

function reveal () {
    const json = { path: 'reveal' };
    socket.send(JSON.stringify(json));
}

// function updateUsers (users) {
//     document.getElementById('formal').innerHTML = users.map(u => u !== username ? `<option value=${u}>${u}</option>` : ``);
// }

// function doFormal (formal, user) {
//     hideOthers('voteDiv');
//     formalledUser = formal;
//     formalledBy = user;
//     document.getElementById('vote').value = `Vote for ${formalledUser}`;
//
//     let timeRemaining = 60;
//     const timerInterval = setInterval(() => {
//         document.getElementById('voteTimer').innerHTML = `${formalledBy} has formalled ${formalledUser}! Time remaining: ${timeRemaining--}s`;
//
//         if (timeRemaining <= 0) {
//             hideOthers('formalDiv');
//             clearInterval(timerInterval);
//         }
//     }, 1000);
// }

function updateLivingPlayers (players) {
    document.getElementById('livingPlayersDiv').innerHTML = players
        .map(p => `<div id="livingPlayer_${p}"><span class="badge badge-secondary">${p}</span><span id="vote_${p}" class="position-fixed ml-1" hidden>🙋</span></div>`)
        .join('\n');

    document.getElementById('formalMenu').innerHTML = players
        .map(p => `<button id="formalPlayer_${p}" class="dropdown-item" onclick="formal('${p}')">${p}</button>`)
        .join('\n');
}

function doFormal (player) {
    const voteButton = document.getElementById('voteBtn');
    voteButton.toggleAttribute('disabled', false);
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
    voteButton.setAttribute('class', 'btn btn-secondary');
    document.getElementById('formalSpan').innerHTML = 'Nobody is under formal at the moment.';
    livingPlayers.forEach(p => document.getElementById(`vote_${p}`).hidden = true);
}

// function hideOthers (div) {
//     document.getElementById('usernameDiv').hidden = true;
//     document.getElementById('formalDiv').hidden = true;
//     document.getElementById('voteDiv').hidden = true;
//     document.getElementById('vote').hidden = false;
//     document.getElementById('thanksForVoting').hidden = true;
//
//     document.getElementById(div).hidden = false;
// }
