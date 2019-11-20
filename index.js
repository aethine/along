const args = require('yargs')
    .command({
        command: 'study <set> [cfg]',
        alias: ['s', 'st'],
        desc: 'Study a set',
        handler: argv => {

        }
    })
    .command({
        command: 'new <path>',
        alias: ['n'],
        desc: 'Creates a new set',
        handler: argv => {

        }
    })
    .command({
        command: 'category <set> <path>',
        alias: ['c, cat'],
        desc: 'Creates a new category within a set',
        handler: argv => {

        }
    })
    .command({
        command: 'term <set> <name> [content] [category..]',
        alias: ['r'],
        desc: 'Creates a new term within a set',
        handler: argv => {

        },
    })
    .command({
        command: 'template <set> <name> [content]',
        alias: ['t', 'temp', 'tag'],
        desc: 'Creates a new template within a set',
        handler: argv => {

        }
    })
    .demandCommand(1, 'Please specify a command. Use the --help argument to get help.')
    .help()
    .argv