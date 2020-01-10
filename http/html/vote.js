hideOthers('usernameDiv');

let username;
let formalledUser;
let formalledBy;

const socket = new WebSocket('ws://18.223.209.141/');
socket.addEventListener('message', message => {
    console.log(`Got socket message: ${message}`);
    const json = JSON.parse(message.data);
    switch (json.path) {
        case 'user':
            updateUsers(json.users);
            break;
        case 'formal':
            doFormal(json.formal, json.username);
            break;
        case 'reveal':
            doReveal(json.votes);
            break;
    }
});
socket.addEventListener('close', event => {
    const json = { path: 'logout', username: username };
    socket.send(JSON.stringify(json));
});

function submitUsername () {
    username = document.getElementById('username').value;
    if (!username) {
        return;
    }

    hideOthers('formalDiv');

    const json = { path: 'login', username: username };
    socket.send(JSON.stringify(json));
}

function submitFormal () {
    const json = { path: 'formal', username: username, formal: document.getElementById('formal').value };
    socket.send(JSON.stringify(json));
}

function vote () {
    const json = { path: 'vote', username: username };
    socket.send(JSON.stringify(json));
}

function updateUsers (users) {
    document.getElementById('formal').innerHTML = users.map(u => u !== username ? `<option value=${u}>u</option>` : ``);
}

function doFormal (formal, user) {
    formalledUser = formal;
    document.getElementById('vote').value = `Vote for ${formalledUser}`;
    hideOthers('voteDiv');

    let timeRemaining = 60;
    while (timeRemaining--) {
        document.getElementById('voteTimer').innerHTML = `${formalledBy} has formalled ${formalledUser}! Time remaining: ${timeRemaining}s`;
    }

    hideOthers('formalDiv');
}

function doReveal (votes) {
    document.getElementById('reveal').innerHTML = `People who voted for ${formalledUser}: ${votes.join(', ')}`;
}

function hideOthers (div) {
    document.getElementById('usernameDiv').hidden = true;
    document.getElementById('formalDiv').hidden = true;
    document.getElementById('voteDiv').hidden = true;

    document.getElementById(div).hidden = false;
}
