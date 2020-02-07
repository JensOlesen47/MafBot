export const authScript = `const discord_id = localStorage.getItem('discord_id');

if (!discord_id) {
    window.location.assign('https://discordapp.com/api/oauth2/authorize?client_id=487077607427276810&redirect_uri=https%3A%2F%2Fmafbot.mafia451.com%2Fauthenticate&response_type=code&scope=identify%20guilds.join&prompt=none');
}`;