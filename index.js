#!/usr/bin/env node

//core
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

//npm
const dashdash = require('dashdash');
const chokidar = require('chokidar');
const chalk = require('chalk');

//project
const cwd = process.cwd();
var exec;


var options = [
  {
    name: 'version',
    type: 'bool',
    help: 'Print tool version and exit.'
  },
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit.'
  },
  {
    names: ['verbose', 'v'],
    type: 'arrayOfBool',
    help: 'Verbose output. Use multiple times for more verbose.'
  },
  {
    names: ['include'],
    type: 'arrayOfString',
    help: 'Include these paths.'
  },
  {
    names: ['exclude'],
    type: 'arrayOfString',
    help: 'Exclude these paths.'
  }
];


var parser = dashdash.createParser({options: options});
var opts;
try {
   opts = parser.parse(process.argv);
} catch (e) {
  console.error('[roodles]: error: %s', e.message);
  process.exit(1);
}

console.log("# opts:", opts);

const file = opts._args[0];

if(opts._args.length < 1){
  throw new Error(' => [roodles] => You must supply a .js script for roodles to execute.')
}

try{
  var isFile = fs.statSync(file).isFile();
}
catch(err){
  throw ' => [roodles] => Not a file => ' + err;
}


// Use `parser.help()` for formatted options help.
if (opts.help) {
  var help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: roodles foo.js [OPTIONS]\n'
    + 'options:\n'
    + help);
  process.exit(0);
}


function findRoot(pth) {

  var possiblePkgDotJsonPath = path.resolve(path.normalize(String(pth) + '/package.json'));

  try {
    fs.statSync(possiblePkgDotJsonPath).isFile();
    return pth;
  }
  catch (err) {
    var subPath = path.resolve(path.normalize(String(pth) + '/../'));
    if (subPath === pth) {
      return null;
    }
    else {
      return findRoot(subPath);
    }
  }

}


const projectRoot = findRoot(cwd);

if(!projectRoot){
  throw new Error('Could not find project root given cwd => ', cwd);
}
else{
  console.log(' => [roodles] project root => ', projectRoot);
}


var roodlesConf;

try{
  roodlesConf = require(projectRoot + '/roodles.conf.json');
}
catch(err){
  roodlesConf = {};
}


const ignored = [
  'public',
  '.git',
  '.idea',
  'package.json',
  'dev-server.js',
  'node_modules'
];

const absouluteIgnored = ignored.map(function (item) {
  return '^' + path.resolve(__dirname + '/' + item);
});

const joined = absouluteIgnored.join('|');
const rgx = new RegExp('(' + joined + ')');

console.log('\n', chalk.cyan(' => Ignored paths => '));
absouluteIgnored.forEach(function (p) {
  console.log(chalk.grey(p));
});

// Initialize watcher.
const watcher = chokidar.watch(__dirname, {
  ignored: rgx,
  persistent: true,
  ignoreInitial: true,
});


let errors = 0;

watcher.once('ready', function () {

  console.log('\n', chalk.magenta(' => watched files => '));
  const watched = watcher.getWatched();
  Object.keys(watched).forEach(function (k) {
    const values = watched[k];
    values.forEach(function (p) {
      console.log(chalk.grey(path.resolve(k + '/' + p)));
    })
  });

  function launch() {
    let n = cp.spawn('node', [exec], {
      env: Object.assign({}, process.env, {})
    });

    n.once('error', function (err) {
      console.log(' => Server error => ', err.stack || err);
    });

    n.stdout.setEncoding('utf8');
    n.stderr.setEncoding('utf8');

    n.stdout.pipe(process.stdout);
    n.stderr.pipe(process.stderr);

    n.stderr.on('data', function (d) {
      if (String(d).match(/error/i)) {
        const stck = String(d).split('\n').filter(function (s) {
          return !String(s).match(/\/node_modules\//);
        });
        const joined = stck.join('\n');
        console.error('\n');
        console.error(chalk.bgRed.white(' => Dev server captured stderr from the server => '));
        console.error(chalk.red.bold(joined));
      }
    });

    return n;
  }

  let k = launch();

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  function killAndRestart() {
    k.once('close', function () {
      k.removeAllListeners();
      k.unref();
      setTimeout(function () {
        k = launch();
        console.log(' => New process pid => ', k.pid);
      }, 300);
    });
    k.kill('SIGINT');

  }

  process.stdin.on('data', function (d) {
    if (String(d).trim() === 'rs') {
      console.log(' => relaunching dev server');
      killAndRestart();
    }
  });

  watcher.on('add', path => {
    console.log(' => watched file added => ', path);
  console.log(' => restarting server');
  killAndRestart();
});


  watcher.on('change', path => {
    console.log(' => watched file changed => ', path);
  console.log(' => restarting server');
  killAndRestart();
});


  watcher.on('unlink', path => {


  });

});

