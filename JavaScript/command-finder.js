const fs = require('fs');
const path = require('path');
const readline = require('readline');

const jszip = require('jszip');


const args = getArgs();
const cmdRegex = /\s*function serverCmd([\w\d]+)\s*\(([%\w\d,\s]+)*\)/g;
const commands = {};


function searchScript(parentName, fileName, contents) {
  if (!contents) {
    try {
      contents = fs.readFileSync(fileName);
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log(`searchScript was passed a fileName without a buffer, and
          the fileName did not exist on the file system.`);
        throw e;
      }
    }
  }

  const parent = commands[path.basename(parentName)];
  parent[path.basename(fileName)] = {};

  let result = true;

  while (result !== null) {
    result = cmdRegex.exec(contents);
    if (result !== null) {
      parent[path.basename(fileName)][result[1]] = result[2].split(/\s*,\s*/g);
    }
  }
}

function searchFolder(fileName) {
  if (fileName !== args.folder) {
    commands[path.basename(fileName)] = {};
  }

  fs.readdir(fileName, (err, items) => {
    if (err)
      throw err;

    for (let item of items) {
      item = path.resolve(process.cwd(), fileName, item);

      fs.stat(item, (err, stats) => {
        if (err)
          throw err;
        
        if (stats.isDirectory()) {
          searchFolder(item);
        } else if (path.extname(item) === '.zip') {
          searchZip(item);
        } else {
          fs.readFile(item, (err, contents) => {
            searchScript(flieName, item, contents);
          });
        }
      });
    }
  });
}

function searchZip(fileName) {
  if (path.basename(fileName) !== args.folder) {
    commands[path.basename(fileName)] = {};
  }

  fs.readFile(fileName, (err, data) => {
    if (err)
      throw err;

    jszip.loadAsync(data).then(zip => {
      zip.forEach((relativePath, file) => {
        if (!file.dir && path.extname(relativePath) === '.cs') {
          file.async('string').then(contents => {
            searchScript(fileName, relativePath, contents);
          }).catch(err => {
            console.log(err);
          });
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

function commandsToJson() {
  return JSON.stringify(commands, (key, val) => {
    if (Object.values(val).length === 0) {
      return undefined;
    } else {
      return val;
    }
  }, 2);
}

// function commandsToTxt() {}

function main() {
  const start = process.hrtime();

  searchFolder(args.folder);
  
  process.on('exit', () => {
    let end = process.hrtime(start);

    fs.writeFileSync(`${args.out}.${args.type}`, commandsToJson());
    console.log(`Time taken: ${end[0] + end[1] * 10e-10}`,
      `\nOutput can be found in ${args.out}.${args.type}`);
  });
}

main();
