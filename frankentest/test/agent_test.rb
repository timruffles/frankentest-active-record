require "bundler"
require "minitest/autorun"
require "mocha/setup"

require_relative "../frankentest"

# stub out runner creation
Runner.stubs(create_runner: {})


UnitTest = MiniTest::Unit::TestCase
class UnitTest
  unless self.class.respond_to? :test
    def self.test name, &block
      define_method "test_#{name.gsub(" ","_")}", &block
    end
  end
end


class UnixSocketIpcTest < UnitTest
  def setup
    @agent = stub(setup: true, teardown: true)
    @ipc = UnixSocketIpc.new(@agent,"/tmp/test")
  end
  test "processes setup" do
    @agent.expects(:setup).once
    assert_equal "setup:done", @ipc.process("setup") 
  end
  test "processes teardown" do
    @agent.expects(:teardown).once
    assert_equal "teardown:done", @ipc.process("teardown") 
  end
  test "processes teardown" do
    assert_equal :finish, @ipc.process("finish") 
  end
end
