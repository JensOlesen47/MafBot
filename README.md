# MafBot
Join our Discord server to play! https://discord.gg/DUEFa9s

#### Using Typescript
Typescript is essentially object-oriented JavaScript.
For this project, it's necessary to install npm and node. I won't go into how to do that here.
Install Typescript by running `npm i -g typescript`.
Compile the project by running `tsc` in the project root directory.

#### Adding commands

You should first modify [commands.ts](/mafia/commands/commands.ts). Then you can add the command to [cmd.ts](/cmd.ts) as a public/private command.

#### Adding roles / setups

All roles, setups, abilities and factions are described in their corresponding [lib](/mafia/libs) file.
For abilities, it is necessary to define a function with the same name in [actions.ts](/mafia/commands/actions.ts).

#### Adding tests
We use the mocha framework for tests: https://mochajs.org/

Any time you add a setup, please ensure that you at least add a test under the [test](/test) directory. Ideally we should be adding tests for new roles as they are added as well.
