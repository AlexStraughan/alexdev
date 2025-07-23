require 'json'

class GameData
  def self.load_generators
    generators_file = File.join(File.dirname(__FILE__), 'data', 'generators', 'generators.json')
    JSON.parse(File.read(generators_file))
  end

  def self.load_upgrades
    upgrades_dir = File.join(File.dirname(__FILE__), 'data', 'upgrades')
    all_upgrades = []

    # Load all upgrade files from the upgrades directory
    Dir.glob(File.join(upgrades_dir, '*.json')).each do |file|
      upgrades = JSON.parse(File.read(file))
      all_upgrades.concat(upgrades)
    end

    all_upgrades
  end

  def self.add_generator(generator_data)
    generators_file = File.join(File.dirname(__FILE__), 'data', 'generators', 'generators.json')
    generators = load_generators
    generators << generator_data
    File.write(generators_file, JSON.pretty_generate(generators))
  end

  def self.add_upgrade(generator_id, upgrade_data)
    upgrade_file = File.join(File.dirname(__FILE__), 'data', 'upgrades', "#{generator_id}.json")
    
    if File.exist?(upgrade_file)
      upgrades = JSON.parse(File.read(upgrade_file))
    else
      upgrades = []
    end
    
    upgrades << upgrade_data
    File.write(upgrade_file, JSON.pretty_generate(upgrades))
  end

  def self.list_upgrade_files
    upgrades_dir = File.join(File.dirname(__FILE__), 'data', 'upgrades')
    Dir.glob(File.join(upgrades_dir, '*.json')).map { |file| File.basename(file, '.json') }
  end
end
