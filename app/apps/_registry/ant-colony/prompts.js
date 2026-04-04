const steps = [
  {
    title: "Research ant colony optimization",
    description: "Started by researching the Ant Colony Optimization (ACO) algorithm by Marco Dorigo (1992) — pheromone-based foraging, transition probability formula, evaporation dynamics.",
    prompt: "You know how ants work? When they swarm around on the ground it looks random, but they always find their way back, and if there's an abundance of food somewhere you'll see many ants walk back and forth with little pieces. A theory is that they release a scent for good path and another one for bad. I think we can build an app showing ant swarms. Please research the 'Ant algorithm' so we get it right.",
    outcome: "Identified ACO core mechanics: P(i→j) = τ^α × η^β / Σ, two pheromone types, evaporation rate ρ, and the relationship between Dorigo's original work and real ant foraging behavior.",
  },
  {
    title: "Design the simulation model",
    description: "Planned the grid-based simulation with individual ants, nest, food sources, obstacles, and canvas rendering. Discussed mobile vs. desktop interaction, edit mode vs. observe mode.",
    prompt: "I like the idea with the map and having individual ants simulated. The user can select how many ants (10-200). The map should have food sources and the nest. When sim starts all ants are in the nest. There should also be obstacles. The user can move obstacles and place new ones. Can you suggest how we could implement that so the UI works both for desktop and phone/tablet?",
    outcome: "Designed Edit/Observe mode toggle for mobile-friendly canvas interaction, with in-canvas toolbar for placing items.",
  },
  {
    title: "Biological accuracy — no omniscience",
    description: "Ensured ants don't know where food is from the start. They discover it through random walk with short-range detection, making the emergent trail-following behavior more realistic and educational.",
    prompt: "Should the ants know where the food sources are from the start? Or do they have to just randomly find one?",
    outcome: "Implemented blind foraging — ants wander randomly until within 30-cell detection range of food. Only then do they move toward it. This makes the pheromone trail discovery genuinely emergent.",
  },
  {
    title: "User-placed food sources",
    description: "Added the ability for users to place additional food sources, enabling experiments with path optimization and colony adaptation.",
    prompt: "The user should be able to place another food source. If so, the user can place a new food source closer to the nest than the one the ants have found and watch how long it takes for them to find the new better source.",
    outcome: "Added cookie placement in edit mode with depletable food quantities. Users can test colony adaptation to new, closer food sources.",
  },
  {
    title: "Visual overhaul — forest glade theme",
    description: "Transformed the basic prototype into a cartoony forest glade with speckled ground texture, cartoon ant nest, cookie food sources, stones, logs, and ants with legs and antennae.",
    prompt: "Let's make it look like a real glade in a forest, in a cartoony clean kind of way. Ground should be different brown/green with a speckled pattern. Stones or logs as obstacles. The ant nest should look cartoony. Food source should be cookies. Ants should be slightly bigger with real legs. Create the images with canvas drawing. Light colour pastels for panels. Lower sim speed must be much lower.",
    outcome: "Complete visual redesign — all artwork generated procedurally with canvas API. No external images needed. Tick accumulator pattern for fractional speed (0.02–1.0).",
  },
  {
    title: "Ant inspector and math panel",
    description: "Added educational features — click any ant to see its 8-direction decision breakdown table, and a math panel showing the live transition formula with current parameters.",
    prompt: "If I pause and click an ant — is there any learning we can have in a popup window? And I am particularly interested in the Maths for this one. Is there anything we can show below the map?",
    outcome: "Built AntInspector popup with name, trip count, steps walked, and full 8-direction decision table (τ^α, η^β, momentum, score, probability). Added MathPanel with live formula, parameter interpretation, and colony statistics.",
  },
  {
    title: "Anti-stagnation mechanisms",
    description: "Fixed ants getting trapped in pheromone loops by adding a proportional exploration floor and stagnation escape.",
    prompt: "Here are the scores for one ant that has become stuck in a little cluster of ants. How can we get away from this? [showed ant with 100% probability in one direction]",
    outcome: "Added proportional exploration floor (2% of max score) so no direction is ever truly 0%, and stagnation escape (random walk after 300 unproductive steps). Tuned floor to be proportional rather than fixed constant to avoid disrupting normal movement.",
  },
]

export default steps
