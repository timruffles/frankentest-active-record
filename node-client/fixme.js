var cp = require("child_process")
var net = require("net")
var es = require("event-stream")

function retry(max,fn,cb) {
  var attempts = 0
  function attempt() {
    if(attempts === max) cb(true)
    attempts += 1
    fn(function(err,val) {
      if(err) return setTimeout(attempt,1000)
      cb(null,val)
    })
  }
  attempt()
}

function makeAgent(path,done) {
  function attempt(cb) {
    console.log("Attempting to connect to agent at " + path + "...")
    var socket = net.connect(path,function(c) {

      console.log("got socket")

      var events = es.split()
      socket.on("data",function(d) {
        console.log("skt data " + d)
      })
      socket.pipe(events)

      var receiving = false

      cb(null,{
        send: function(msg,cb) {
          socket.write(msg + "\n","utf-8",cb)
        },
        receive: function(msg,cb) {
          if(receiving) throw new Error("Already waiting for message")
          receiving = true
          events.once("data",function(evt) {
            console.log("received")
            receiving = false
            if(evt == msg) return cb()
            console.error("Waiting for " + msg + " but received " + evt + " out of order")
            //process.exit()
          })
        }
      })

    })
    socket.on("error",cb)
  }
  retry(15,attempt,function(err,agent) {
    if(err) throw new Error("Couldn't connect to agent after 15 seconds")
    done(agent)
  })
}


function commandQueue() {
  var commands = []
  var working = false
  var crashed = false

  function work(fn) {
    if(crashed) return
    working = true
    fn(function(err) {
      if(err) {
        console.error("Queue crashed: " + err)
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

function fixme(socketPath) {

  var agent

  var queue = commandQueue()
  queue(function(finished) {
    makeAgent(socketPath,function(newAgent) {
      console.log("agent:" + newAgent)
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

module.exports = fixme
