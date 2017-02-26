module.exports = {
  exec: 'test/fixtures/test-server.js',
  signal: 'SIGINT',
  processArgs: ['--foo', 'bar', '--baz', 'bam'],
  restartUponChanges: true,
  restartUponAdditions: false,
  restartUponUnlinking: false,
  processLogPath: null
};