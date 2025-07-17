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

# API endpoint for interactive features
get '/api/greeting' do
  content_type :json
  greetings = [
    "Code your way to success! 🚀",
    "Building the digital future! 💻",
    "Every click brings more power! ⚡",
    "The code flows through you! ✨",
    "Generating infinite possibilities! 🌟"
  ]
  
  { greeting: greetings.sample }.to_json
end

# Generators endpoint (replacing skills)
get '/api/generators' do
  content_type :json
  generators = [
    { 
      id: "junior_dev",
      name: "Junior Developer", 
      baseCost: 15,
      baseProduction: 1,
      description: "A fresh coder learning the ropes",
      icon: "👨‍💻",
      unlockCondition: { type: "always" } # Always available
    },
    { 
      id: "senior_dev",
      name: "Senior Developer", 
      baseCost: 100,
      baseProduction: 3,
      description: "Experienced programmer with deep knowledge",
      icon: "🧙‍♂️",
      unlockCondition: { type: "always" } # Always available
    },
    { 
      id: "code_monkey",
      name: "Code Monkey", 
      baseCost: 1100,
      baseProduction: 8,
      description: "Automated coding assistant",
      icon: "🐵",
      unlockCondition: { type: "always" } # Always available
    },
    { 
      id: "ai_assistant",
      name: "AI Assistant", 
      baseCost: 12000,
      baseProduction: 47,
      description: "Advanced AI that writes code automatically",
      icon: "🤖",
      unlockCondition: { type: "always" } # Always available
    },
    { 
      id: "quantum_computer",
      name: "Quantum Computer", 
      baseCost: 130000,
      baseProduction: 260,
      description: "Quantum processing power for ultimate coding",
      icon: "⚛️",
      unlockCondition: { type: "generator_owned", generator: "ai_assistant", count: 1 }
    },
    { 
      id: "coding_farm",
      name: "Coding Farm", 
      baseCost: 1400000,
      baseProduction: 1400,
      description: "Massive server farm dedicated to code generation",
      icon: "🏭",
      unlockCondition: { type: "generator_owned", generator: "quantum_computer", count: 1 }
    },
    # Add more advanced generators
    { 
      id: "neural_network",
      name: "Neural Network", 
      baseCost: 20000000,
      baseProduction: 7800,
      description: "Self-learning neural network that evolves code",
      icon: "🧠",
      unlockCondition: { type: "generator_owned", generator: "coding_farm", count: 1 }
    },
    { 
      id: "code_singularity",
      name: "Code Singularity", 
      baseCost: 330000000,
      baseProduction: 44000,
      description: "The ultimate coding consciousness",
      icon: "🌌",
      unlockCondition: { type: "generator_owned", generator: "neural_network", count: 1 }
    }
  ]
  
  { generators: generators }.to_json
end
