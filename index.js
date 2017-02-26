#!/usr/bin/env node

//core
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

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
    help: 'Print the help information and exit.'
  },
  {
    names: ['verbosity', 'v'],
    type: 'integer',
    help: 'Verbosity level => {1, 2, or 3}; the higher, the more verbose; default is 2.'
  },
  {
    names: ['process-args'],
    type: 'string',
    help: 'These args are directly passed to your running process, your should surround with quotes like so: ' +
    '--process-args="--foo bar --baz bam".'
  },
  {
    names: ['process-log-path', 'log'],
    type: 'string',
    help: 'Instead of logging your process stdout/stderr to the terminal, it will send stdout/stderr to this log file.'
  },
  {
    names: ['restart-upon-change', 'restart-upon-changes', 'ruc'],
    type: 'bool',
    help: 'Roodles will restart your process upon file changes.'
  },
  {
    names: ['restart-upon-addition', 'restart-upon-additions', 'rua'],
    type: 'bool',
    help: 'Roodles will restart your process upon file additions.'
  },
  {
    names: ['restart-upon-unlink', 'restart-upon-unlinks', 'ruu'],
    type: 'bool',
    help: 'Roodles will restart your process upon file deletions/unlinking.'
  },
  {
    names: ['exec'],
    type: 'string',
    help: 'Relative or absolute path of the file you wish to execute (and re-execute on changes).'
  },
  {
    names: ['include'],
    type: 'arrayOfString',
    help: 'Include these paths (array of regex and/or strings).'
  },
  {
    names: ['exclude'],
    type: 'arrayOfString',
    help: 'Exclude these paths (array of regex and/or strings).'
  },
  {
    names: ['signal', 's'],
    type: 'string',
    help: 'The --signal option is one of {"SIGINT","SIGTERM","SIGKILL"}.'
    // enum: ['SIGINT', 'SIGTERM', 'SIGKILL']
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

if (opts.help) {
  var help = parser.help({includeEnv: true}).trimRight();
  console.log('\n');
  console.log('usage: roodles [OPTIONS]\n\n'
    + 'options:\n'
    + help + '\n\n');
  process.exit(0);
}

if (opts._args.length > 0) {
  throw new Error(' => [roodles] => You supplied too many arguments (should be zero) => '
    + chalk.bgCyan.black.bold(JSON.stringify(opts._args)))
}

function findRoot (pth) {

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
  if (opts.verbosity > 1) {
    console.log('\n');
    console.log(chalk.cyan.bold.underline(' => Roodles considers the following to be your project root => '), chalk.cyan('"' + projectRoot + '"'));
  }
}

function getAbsPath (p) {
  return path.isAbsolute(p) ? p : path.resolve(projectRoot + '/' + p);
}

const defaults = {
  verbosity: 2,
  signal: 'SIGKILL',
  processArgs: [],
  retartUponChange: true,
  restartUponAddition: false,
  restartUponUnlink: false,
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

  if (roodlesConf.processLogPath) {
    roodlesConf.processLogPath = getAbsPath(roodlesConf.processLogPath);
  }
  if (roodlesConf.exec) {
    roodlesConf.exec = getAbsPath(roodlesConf.exec);
  }

}
catch (err) {
  roodlesConf = {};
}

const override = {};

if (opts.exec) {
  override.exec = getAbsPath(opts.exec);
}
else if (!roodlesConf.exec) {
  throw new Error(' => Roodles needs an "exec" file to run!\nYou can specify one with "exec" in your ' +
    'roodles.conf.js file or you can pass one at the command line with the "--exec" option');
}

if (opts.process_log_path) {
  override.processLogPath = getAbsPath(opts.process_log_path);
}

if (opts.signal) {
  override.signal = String(opts.signal).trim();
  assert(['SIGINT', 'SIGTERM', 'SIGKILL'].indexOf(String(override.signal).trim()) > -1, ' => Value passed as "signal" ' +
    'option needs to be one of {"SIGINT","SIGTERM","SIGKILL"},\nyou passed => "' + override.signal + '".');
}

if (opts.include) {
  override.include = opts.include;
}

if (opts.exclude) {
  override.exclude = opts.exclude;
}

if (opts.process_args) {
  if (Array.isArray(opts.process_args)) {
    override.processArgs = opts.process_args;
  }
  else if (typeof opts.process_args === 'string') {
    override.processArgs = String(opts.process_args).trim().split(/\s+/)
  }
  else {
    throw new Error(' => "processArgs" needs to be either an array or string.');
  }
}

if ('restart_upon_change' in opts) {
  override.restartUponChange = opts.restart_upon_change;
}

if ('restart_upon_addition' in opts) {
  override.restartUponAddition = opts.restart_upon_addition;
}

if ('restart_upon_unlink' in opts) {
  override.restartUponUnlink = opts.restart_upon_unlink;
}

if (opts.verbosity) {
  override.verbosity = opts.verbosity;
}

const $roodlesConf = Object.assign(defaults, roodlesConf, override);

var strm, success = false;

function getStream (force) {
  if (force || success) {
    return fs.createWriteStream($roodlesConf.processLogPath, {end: true, autoClose: true})
      .once('error', function (err) {
        console.error('\n');
        console.error(chalk.red.bold(err.message));
        console.log(' => You may have accidentally used a path for "exec" or "processLogPath" that begins with "/" => \n' +
          ' if your relative path begins with "/" then you should remove that.');
        throw err;
      });
  }
}

if ($roodlesConf.processLogPath) {
  // try {
  //   fs.statSync($roodlesConf.processLogPath);
  // }
  // catch (err) {
  //   console.error(chalk.yellow.bold(' Warning => Log path was not found on the filesystem =>'), '\n',
  //     $roodlesConf.processLogPath);
  // }

  try {
    strm = getStream(true);
    success = true;
    if ($roodlesConf.verbosity > 1) {
      console.log(' => Your process stdout/stderr will be sent to the log file at path =>', '\n',
        $roodlesConf.processLogPath);
    }
  }
  catch (err) {
    console.error(err.message);
    console.log(' => You may have accidentally used an absolute path for "exec" or "processLogPath",\n' +
      'if your relative path begins with "/" then you should remove that.');
    return;
  }

}

try {
  if (!fs.statSync($roodlesConf.exec).isFile()) {
    throw ' => "exec" option value is not a file'
  }
}
catch (err) {
  throw  err;
}

if ($roodlesConf.verbosity > 1) {
  console.log('\n');
  console.log(chalk.green.bold('=> Here is your combined roodles configuration given (1) roodles defaults ' +
    '(2) roodles.conf.js and (3) your command line arguments => '));
  console.log(chalk.green(util.inspect($roodlesConf)));
}

const exclude = _.flatten([$roodlesConf.exclude]);
const joined = exclude.join('|');
const rgx = new RegExp('(' + joined + ')');

if ($roodlesConf.verbosity > 1) {
  console.log('\n', chalk.cyan(' => Roodles will ignore paths that match any of the following => '));
  exclude.forEach(function (p) {
    console.log('=> ',chalk.grey(p));
  });
}

const include = _.flatten([$roodlesConf.include]);

const watcher = chokidar.watch(include, {
  ignored: rgx,
  persistent: true,
  ignoreInitial: true,
});

let first = true;

watcher.once('ready', function () {

  let count = 0;

  if ($roodlesConf.verbosity > 2) {
    console.log('\n', chalk.magenta(' => watched paths => '));
  }

  const watched = watcher.getWatched();
  Object.keys(watched).forEach(function (k) {
    const values = watched[k];
    values.forEach(function (p) {
      count++;
      if ($roodlesConf.verbosity > 2) {
        console.log(chalk.grey(path.resolve(k + '/' + p)));
      }
    })
  });

  if ($roodlesConf.verbosity > 1) {
    console.log('\n',' => Total number of watched paths => ', count,'\n');
  }

  function launch () {

    console.log('\n');
    if (first) {
      console.log(chalk.cyan(' => Roodles is now starting your process...and will restart ' +
        'your process upon file changes.'), '\n');
      if($roodlesConf.verbosity > 1){
        console.log(' => Your process will be launced with the following command => "' + $roodlesConf.exec +
          ' ' + $roodlesConf.processArgs.join(' ') + '"','\n');
      }
    }
    else {
      console.log(chalk.black.bold(' => Roodles is re-starting your process...'));
    }

    strm = getStream();

    let n = cp.spawn($roodlesConf.exec, $roodlesConf.processArgs);

    if($roodlesConf.verbosity > 1){
      console.log(' => Your process is running with pid => ', n.pid);
    }

    if($roodlesConf.verbosity > 1 && first && !strm){
      console.log(' => What follows is the stdout/stderr of your process => ','\n');
    }

    first = false;

    n.on('error', function (err) {
      console.log(' => Server error => ', err.stack || err);
    });

    n.stdout.setEncoding('utf8');
    n.stderr.setEncoding('utf8');
    n.stdout.pipe(strm || process.stdout, {end: true, autoClose: true});
    n.stderr.pipe(strm || process.stderr, {end: true, autoClose: true});

    n.stderr.on('data', function (d) {
      if (String(d).match(/error/i)) {
        const stck = String(d).split('\n').filter(function (s, index) {
          return index < 3 || (!String(s).match(/\/node_modules\//) && String(s).match(/\//));
        });
        const joined = stck.join('\n');
        console.error('\n');
        console.error(chalk.bgRed.white(' => captured stderr from your process => '));
        console.error(chalk.red.bold(joined));
        console.log('\n');
      }
    });

    return n;
  }

  let k = launch();

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  function killAndRestart () {
    k.once('close', function () {
      k.removeAllListeners();
      k.unref();
      setTimeout(function () {
        k = launch();
        if($roodlesConf.verbosity > 1){
          console.log(' => Process restarted, new process pid => ', k.pid);
        }

      }, 300);
    });

    if ($roodlesConf.verbosity > 2) {
      console.log(' => Killing your process with the "' + $roodlesConf.signal + '" signal.');
    }

    k.kill($roodlesConf.signal);

  }

  process.stdin.on('data', function (d) {
    if (String(d).trim() === 'rs') {
      if ($roodlesConf.verbosity > 1) {
        console.log(' => "rs" captured...');
      }
      killAndRestart();
    }
  });

  if ($roodlesConf.restartUponChange) {
    watcher.on('change', path => {
      console.log(' => watched file changed => ', path);
      killAndRestart();
    });
  }

  if ($roodlesConf.restartUponAddition) {
    watcher.on('add', path => {
      console.log(' => File within watched path was added => ', path);
      killAndRestart();
    });
  }

  if ($roodlesConf.restartUponUnlink) {
    watcher.on('unlink', path => {
      console.log(' => file within watched path was unlinked => ', path);
      killAndRestart();
    });
  }

});

