const fs = require('fs-extra');
const jszip = require('jszip');

const args = require('yargs')
  .usage('Usage: $0 -f [folder] -t [type] -o [out]')
  .options({
    f: {
      alias: 'folder',
      default: './Add-Ons',
      describe: 'Add-Ons folder to search'
    },
    t: {
      alias: 'type',
      choices: ['json', 'txt'],
      default: 'json',
      describe: 'Type of file to output'
    },
    o: {
      alias: 'out',
      default: 'server_commands',
      describe: 'Name of file to write to, WITHOUT extension'
    }
  })
  .argv;
