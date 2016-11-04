const fs = require('fs');
const path = require('path');
const readline = require('readline');

const jszip = require('jszip');


const args = getArgs();
const commands = {};


function searchScript(filename, buffer) {
  if (!buffer) {
    try {
      buffer = fs.createReadStream(filename);
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log(`searchScript was passed a filename without a buffer, and
          the filename did not exist on the file system.`);
        throw e;
      }
    }
  }
}

function searchFolder(filename) {
  if (filename !== args.folder) {
    commands[path.basename(filename)] = {};
  }

  fs.readdir(filename, (err, items) => {
    if (err)
      throw err;

    for (let item of items) {
      item = path.resolve(process.cwd(), filename, item);

      fs.stat(item, (err, stats) => {
        if (err)
          throw err;
        
        if (stats.isDirectory()) {
          searchFolder(item);
        } else if (path.extname(item) === '.zip') {
          searchZip(item);
        } else {
          searchScript(fs.createReadStream(item));
        }
      });
    }
  });
}

function searchZip(filename) {
  if (path.basename(filename) !== args.folder) {
    commands[path.basename(filename)] = {};
  }

  fs.readFile(filename, (err, data) => {
    if (err)
      throw err;

    jszip.loadAsync(data).then(zip => {
      zip.forEach((relativePath, file) => {
        if (!file.dir && path.extname(relativePath) === '.cs') {
          searchScript(relativePath, file.nodeStream());
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
  const start = process.hrtime();

  searchFolder(args.folder);
  
  process.on('exit', () => {
    console.log(commands);

    let end = process.hrtime(start);
    console.log(`Time taken: ${end[0] + end[1] * 10e-10}`);
  });
}

main();
