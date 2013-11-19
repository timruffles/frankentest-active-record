require_relative "fixme/agent"

require_relative "config/environment"
path = File.expand_path("../config/database.yml",__FILE__)
db = YAML.load_file(path).fetch("test")

ActiveRecord::Base.configurations = db
ActiveRecord::Base.establish_connection(db)
ActiveRecord::Base.logger = Logger.new(STDOUT)

agent = TestAgent.new(
  File.expand_path("../test/fixtures/",__FILE__)
)
listener = UnixSocketIpc.new(agent,"/tmp/fixme-agent")
listener.listen


