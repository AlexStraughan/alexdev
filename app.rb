require 'sinatra'
require 'sinatra/reloader' if development?

# Configure Sinatra
configure do
  set :port, ENV['PORT'] || 4567
  set :bind, '0.0.0.0'
end

# Homepage route
get '/' do
  erb :index
end
