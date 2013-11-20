var cp = require("child_process")
var net = require("net")
var es = require("event-stream")

var noOp = function() {}

var log = {
  debug: noOp || function(msg) {
    console.log(msg)
  }
}

function makeAgent(path,done) {
  var socket = net.connect(path,function(c) {

    log.debug("opened socket")

    var events = es.split()
    socket.pipe(events)

    var receiving = false

    var agent = {
      send: function(msg,cb) {
        socket.write(msg + "\n","utf-8",cb)
      },
      receive: function(msg,cb) {
        if(receiving) throw new Error("Already waiting for message")
        receiving = true
        events.once("data",function(evt) {
          log.debug("received " + evt)
          receiving = false
          if(evt == msg) return cb()
          cb("Waiting for " + msg + " but received " + evt + " out of order")
        })
      }
    }

    done(null,agent)

  })
  socket.on("error",done)
}


function commandQueue(cb) {
  var commands = []
  var working = false
  var crashed = false

  function work(fn) {
    if(crashed) return
    working = true
    fn(function(err) {
      if(err) {
        cb(err)
        return crashed = true
      }
      working = false
      var next = commands.shift()
      if(!next) return
      work(next)
    })
  }

  return function command(fn) {
    if(working) return commands.push(fn)
    work(fn)
  }
}

function client(socketPath,cb) {

  var agent

  var queue = commandQueue(cb)
  queue(function(finished) {
    makeAgent(socketPath,function(err,newAgent) {
      if(err) return finished(err)
      agent = newAgent
      finished()
    })
  })

  return {
    finish: function(done) {
      queue(function(finished) {
        agent.send("finish")
        finished()
        done()
      })
    },
    setup: function(done) {
      queue(function(finished) {
        agent.send("setup")
        agent.receive("setup:done",function() {
          finished()
          done()
        })
      })
    },
    teardown: function(done) {
      queue(function(finished) {
        agent.send("teardown")
        agent.receive("teardown:done",function() {
          finished()
          done()
        })
      })
    }
  }
}

module.exports = client
