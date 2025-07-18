#!/usr/bin/env ruby
# Simple development proxy to mimic production Apache setup
require 'sinatra'
require 'net/http'
require 'uri'

set :port, 3000

# Proxy API requests to leaderboard server
['/api/*'].each do |path|
  get path do
    proxy_request(request, 'http://localhost:5678')
  end
  
  post path do
    proxy_request(request, 'http://localhost:5678')
  end
  
  options path do
    proxy_request(request, 'http://localhost:5678')
  end
end

# Proxy everything else to main app
get '/*' do
  proxy_request(request, 'http://localhost:4567')
end

def proxy_request(request, target_url)
  uri = URI(target_url + request.path_info)
  uri.query = request.query_string unless request.query_string.empty?
  
  http = Net::HTTP.new(uri.host, uri.port)
  
  # Create the request
  case request.request_method
  when 'GET'
    req = Net::HTTP::Get.new(uri)
  when 'POST'
    req = Net::HTTP::Post.new(uri)
    req.body = request.body.read
    request.body.rewind
  when 'OPTIONS'
    req = Net::HTTP::Options.new(uri)
  end
  
  # Copy headers
  request.env.each do |key, value|
    if key.start_with?('HTTP_') && key != 'HTTP_HOST'
      header_name = key[5..-1].split('_').map(&:capitalize).join('-')
      req[header_name] = value
    end
  end
  
  req['Content-Type'] = request.content_type if request.content_type
  
  # Make the request
  response = http.request(req)
  
  # Return the response
  status response.code.to_i
  headers response.to_hash
  response.body
end
