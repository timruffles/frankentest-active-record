# Frankentest - Rails fixtures via IPC

A major blocker to a polyglot application is duplication in testing your database. Nobody wants to rebuild/learn a whole new fixture system.

Frankentest lets you use your Rails fixtures from other languages via a simple Unix-sockets based IPC (could be switched out easily for Windows).

## Installation

### Rails-side

Add frankentest to your `Gemfile` - probably in the testing group.

  gem 'frankentest'

Then run `frankentest` to start an agent - it'll listen on `/tmp/frankentest-agent` by default but you can pass a different path as `--socket-path`.

### Node side

If you're using the node client, install via `npm install --save frankentest`. It can hook into your test framework's setup and teardown methods. This example uses `mocha`:

    describe("ProjectApi",function() {

      beforeEach(fixme.setup) // clean set of fixtures
      afterEach(fixme.teardown)
      after(fixme.finish) // tell the agent it can listen for other connections

      it("can return all projects",function(done) {
        projects
          .all()
          .then(function(projects) {
            assert.equal(24,projects.length)
          },function(err) {
            fail(err)
          })
      })
    })

## Protocol

To reimplement the node client, take a look at the source code. It's a simple protocol over Unix Sockets - sending the strings `setup`, `teardown`, `setup:done`, `teardown:done` and `finish`. Each command is suffixed with a newline `\n`. That is all.

