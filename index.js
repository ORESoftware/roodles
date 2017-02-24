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
const _ = require('underscore');

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
    names: ['verbosity', 'v'],
    type: 'integer',
    help: 'Verbosity level => 1, 2, 3, the higher the more verbose, default is 2.'
  },
  {
    names: ['process-args'],
    type: 'arrayOfString',
    help: 'These args are directly passed to your running process.'
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

// Use `parser.help()` for formatted options help.
if (opts.help) {
  var help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: roodles foo.js [OPTIONS]\n'
    + 'options:\n'
    + help);
  process.exit(0);
}

exec = opts._args[0];

if (opts._args.length < 1) {
  throw new Error(' => [roodles] => You must supply a .js script for roodles to execute.')
}


if (opts._args.length > 1) {
  throw new Error(' => [roodles] => You supplied too many arguments (should be just one) => '
    + chalk.bgCyan.black.bold(JSON.stringify(opts._args)))
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

if (!projectRoot) {
  throw new Error('Could not find project root given cwd => ', cwd);
}
else {
  console.log(' => [roodles] project root => ', projectRoot);
}


exec = path.isAbsolute(exec) ? exec : path.resolve(projectRoot + '/' + exec);

try {
  if (!fs.statSync(exec).isFile()) {
    throw ' => not a file'
  }
}
catch (err) {
  throw ' => [roodles] => ' + err;
}


const defaults = {
  verbosity: 2,
  processArgs: [],
  include: projectRoot,
  exclude: [
    /node_modules/,
    /public/,
    /bower_components/,
    /.git/,
    /.idea/,
    /package.json/,
    /test/
  ]
};


var roodlesConf;

try {
  roodlesConf = require(projectRoot + '/roodles.conf.js');
}
catch (err) {
  roodlesConf = {};
}

const override = {};

if(opts.include){
  override.include = opts.include;
}

if(opts.exclude){
  override.include = opts.include;
}

if(opts.process_args){
  override.processArgs = opts.process_args;
}

if(opts.verbosity){
  override.verbosity = opts.verbosity;
}


roodlesConf = Object.assign(defaults, roodlesConf, override);

// const ignored = [
//   'public',
//   '.git',
//   '.idea',
//   'package.json',
//   'dev-server.js',
//   'node_modules'
// ];


const exclude = _.flatten([roodlesConf.exclude]);

const absouluteIgnored = exclude.map(function (item) {
  return '^' + path.resolve(__dirname + '/' + item);
});

const joined = absouluteIgnored.join('|');
const rgx = new RegExp('(' + joined + ')');

console.log('\n', chalk.cyan(' => Ignored paths => '));
absouluteIgnored.forEach(function (p) {
  console.log(chalk.grey(p));
});


// const include = _.flatten([roodlesConf.include]);

// Initialize watcher.
const watcher = chokidar.watch(roodlesConf.include, {
  ignored: rgx,
  persistent: true,
  ignoreInitial: true,
});

let first = true;
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

    console.log('\n');
    if(first){
      first = false;
      console.log(chalk.cyan(' => Roodles is now starting your process...'));
    }
    else{
      console.log(chalk.black.bold(' => Roodles is re-starting your process...'));
    }


    let n = cp.spawn(exec, roodlesConf.processArgs, {
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
      console.log(' => "rs" captured...relaunching dev server...');
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
      // noop
  });

});

