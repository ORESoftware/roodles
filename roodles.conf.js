module.exports = {
  exec: 'test/fixtures/test-server.js',
  exclude: ['node_modules', '.git', '.idea', 'test'],
  signal: 'SIGINT',
  processArgs: ['--foo', 'bar', '--baz', 'bam'],
  restartUponChanges: true,
  restartUponAdditions: false,
  restartUponUnlinking: false,
  processLogPath: null
};