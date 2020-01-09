const htmlPages = {
    registrationConfirmed: `<p>Congrats, you are now registered with mafbot!</p>`,
    vote: `<label for="votee" style="margin-right: 25px">Who do you want to vote for?</label><select id="votee" onchange="document.getElementById('voteeSpan').innerHTML = document.getElementById('votee').options[e.selectedIndex].text"><option value="Urist">Urist</option><option value="StarV">StarV</option><option value="Ellibereth">Ellibereth</option></select><br/><br/><span id="voteeSpan"></span>`
};

export function getHtmlPage (urlSegment: string) : string {
    const pageBody = htmlPages[urlSegment];
    if (!pageBody) {
        return;
    }

    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${urlSegment}</title>
    </head>
    <body>
        ${pageBody}
    </body>
</html>`;
}