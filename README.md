

# roodles (NPM project)

This project is just like Nodemon. It strives to accomplish the same thing.
My team was having troubles with Nodemon, and so we wrote something we 
could tweak on our own. Maybe it works better, maybe it doesn't. We think it does.
All the code is in one file, so you can steal it easily :)


## Installation

=> ```npm install -D roodles@latest```

You can put a ```roodles.conf.js``` file at the root of your project:

```js
//roodles.conf.js

module.exports = Object.freeze({
   exec: '<path-to-exec-file>',  // any file with a hashbang
   include: ['c'],   // list of regexes or strings
   exclude: [/a/,'b'],
   verbosity: 2,  // an integer {1,2,3}
   processArgs: []  // the args that get sent to your process
});

```


## Here's the API

_Currently the API is a command line interface (CLI) only._

After installing locally, you can run:

```terminal
./node_modules/.bin/roodles 
```

if you don't use the roodles.conf.js file, then you will need to
at the very least specify which exec file to use.

To specify that, you can use:

```terminal
./node_modules/.bin/roodles --exec <file>
```

## Here are the default roodles.conf.js options:

```js
const defaults = {
  verbosity: 2,     // 1 is lowest verbosity, 3 is highest
  processArgs: [],   // we don't know what args to pass to your process!
  include: projectRoot,   // default is to watch all files in your project
  exclude: [             //...all files except the following!
    /node_modules/,
    /public/,
    /bower_components/,
    /.git/,
    /.idea/,
    /package.json/,
    /test/
  ]
};

```


### Here's the current --help output

```console
usage: roodles foo.js [OPTIONS]
options:
    --version                Print tool version and exit.
    -h, --help               Print this help and exit.
    -v INT, --verbosity=INT  Verbosity level => 1, 2, 3, the higher the more
                             verbose, default is 2.
    --process-args=ARG       These args are directly passed to your running
                             process.
    --exec=ARG               Relative path of the file you wish to execute (and
                             re-execute on changes).
    --include=ARG            Include these paths.
    --exclude=ARG            Exclude these paths.

```


# name: roodles ?

Roodles is just something I say on occasion, more like: "roodles!". 
At some point I would have used this name for a software project.
This was the right one. I think of roodles being similar to "redo"...like, "restart". 

roodles~redo.
