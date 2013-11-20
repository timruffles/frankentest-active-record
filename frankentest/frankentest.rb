require "logger"
module HasLogger
  def logger
    @logger ||= Logger.new(STDOUT)
  end
end

class TestAgent
  include HasLogger
  attr_reader :path, :runner
  def initialize path
    @path = path
  end
  def runner
    return @runner if @runner
    @runner = Runner.create_runner path
    @runner
  end
  def setup
    runner.setup_fixtures
  end
  def teardown
    runner.teardown_fixtures
  end
end

module Runner
  def self.create_runner path
    require "active_record"
    runner = Class.new(ActiveSupport::TestCase) do
      include ActiveRecord::TestFixtures
      def initialize
      end
      def self.setup _
      end
      def self.teardown _
      end
      self.pre_loaded_fixtures = false
      self.use_instantiated_fixtures  = false
    end
    runner.fixture_path = path
    runner.fixtures :all
    runner.new
  end
end

class UnixSocketIpc
  include HasLogger
  attr_reader :agent, :path
  def initialize agent, path
    @agent = agent
    @path = path
  end
  def socket
    return @socket if @socket
    File.unlink(path) if File.exist?(path)
    @socket = UNIXServer.new(path)
  end
  def listen
    socket.listen(0)
    loop do
      logger.debug "Waiting for next connection"
      handle_connection socket.accept
    end
  end
  def handle_connection connection
    logger.debug "Connection received"
    loop do
      cmd = connection.gets
      next unless cmd
      response = process(cmd)
      return if response == :finish
      logger.debug "Sending #{response}"
      connection.puts response
    end
  end
  def process cmd
    case cmd.strip
    when "finish"
      return :finish
    when "setup"
      agent.setup
      logger.debug "Heard and ran setup"
      "setup:done"
    when "teardown"
      agent.teardown
      logger.debug "Heard and ran teardown"
      "teardown:done"
    else
      puts "ERR: no idea what #{cmd} means"
      exit(1)
    end
  end
end
