#!/usr/bin/env node

/*
 nodemon was messing up big time, so we wrote this
 */


const cp = require('child_process');
const chokidar = require('chokidar');
const path = require('path');
const util = require('util');
const chalk = require('chalk');

const exec = path.resolve(__dirname + '/bin/www.js');


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

