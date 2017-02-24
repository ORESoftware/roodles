

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


## Usage: Here's the API

_Currently the API is a command line interface (CLI) only._

After installing locally, you can run:

```terminal
./node_modules/.bin/roodles 
```

if you don't use the ```roodles.conf.js``` file, then you will need to
at the very least specify which exec file to use.

To specify that, you can use:

```terminal
./node_modules/.bin/roodles --exec <file>
```



### Remember

To use roodles, your --exec file must have a hashbang; with node.js, that looks like:

```js
#!/usr/bin/env node
console.log('this node.js file has a hashbang at the top, telling ' +
 'the OS which executable to use to execute the file.');
```

Using the hashbang scheme means you can easily go beyond node.js exec scripts, and use bash, python, ruby,
perl, or even binary files like golang executables (which don't need a hashbang), etc, etc.


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
    -h, --help               Print the help information and exit.
    -v INT, --verbosity=INT  Verbosity level => 1, 2, or 3; the higher the more
                             verbose; default is 2.
    --process-args=ARG       These args are directly passed to your running
                             process.
    --exec=ARG               Relative or absolute path of the file you wish to
                             execute (and re-execute on changes).
    --include=ARG            Include these paths (array of regex and/or
                             strings).
    --exclude=ARG            Exclude these paths (array of regex and/or
                             strings).

```


# name: roodles ?

Roodles is just something I say on occasion, more like: "roodles!". 
At some point I would have used this name for a software project.
This was the right one. I think of roodles being similar to "redo"...like, "restart". 

roodles~redo.
