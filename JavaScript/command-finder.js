const fs = require('fs');
const path = require('path');
const readline = require('readline');

const jszip = require('jszip');


const args = getArgs();
const commands = {};


function searchScript(buffer) {}

function searchFolder(filename) {
  if (path.basename(filename) !== args.folder) {
    commands[path.basename(filename)] = {};
  }

  fs.readdir(filename, (err, items) => {
    if (err)
      throw err;

    for (let item of items) {
      fs.stat(item, (err, stats) => {
        if (err)
          throw err;
        
        if (stats.isDirectory()) {
          searchFolder(item);
        } else if (path.extname(filename) === '.zip') {
          searchZip(item);
        } else {
          searchScript(fs.createReadStream(item));
        }
      });
    }
  });
}

function searchZip(filename) {
  fs.readFile(filename, (err, data) => {
    if (err)
      throw err;

    jszip.loadAsync(data).then(zip => {
      zip.forEach((relativePath, file) => {
        if (!file.dir && path.extname(relativePath) === '.cs') {
          searchScript(file.nodeStream());
        }
      });
    });
  });
}


function getArgs() {
  return require('yargs')
  .usage('Usage: $0 -f [folder] -t [type] -o [out]')
  .options({
    f: {
      alias: 'folder',
      coerce: f => path.isAbsolute(f) ? f : path.resolve(process.cwd(), f),
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
}

function main() {
  searchFolder(args.folder, commands);
}

main();
