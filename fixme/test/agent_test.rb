require "bundler"
Bundler.require(:testing)
require 'minitest/autorun'
require "mocha/setup"

require_relative "../agent"


UnitTest = MiniTest::Unit::TestCase
class UnitTest
  unless self.class.respond_to? :test
    def self.test name, &block
      define_method "test_#{name.gsub(" ","_")}", &block
    end
  end
end


class FixmeTest < UnitTest
end
class UnixSocketIpcTest < UnitTest
  def setup
    agent = stub(setup: true, teardown: true)
    @ipc = UnixSocketIpc.new(agent,"/tmp/test")
  end
  test "processes cmd" do
    assert_equal "setup:done", @ipc.process("setup") 
  end
  test "processes cmd" do
    assert_equal "teardown:done", @ipc.process("teardown") 
  end
end
