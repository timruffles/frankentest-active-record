

//var s = net.createServer(function(c) {
//  c.on("data",function(r) {
//    r = r + ""
//    switch(r) {
//      case "setup":
//        return c.write("setup:done\n","utf-8")
//      case "teardown":
//        return c.write("teardown:done\n","utf-8")
//      default:
//        console.error("WTF DOES " + r + " mean?")
//    }
//  })
//})
//s.listen("/tmp/fixme-agent")

function test() {
  var fixme = fixme("/tmp/fixme-agent")
  fixme.setup(function() {})
  fixme.teardown(function() {})
}
