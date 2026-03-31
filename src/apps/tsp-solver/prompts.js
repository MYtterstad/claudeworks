// Cleaned-up prompt walkthrough for the TSP Solver app.
// Personal details and unnecessary back-and-forth have been removed.
// Each step shows the core prompt and what it produced.

const promptSteps = [
  {
    title: 'Define the map and city system',
    description: 'Set up the foundation: a procedural town generator, reproducible layout via seeded RNG, and an interactive SVG map.',
    prompt: `Build a Traveling Salesman Problem (TSP) solver showcase. Generate a random map of UK town names using a seeded random number generator (so maps are reproducible). Place towns as points on a 2D canvas. Render as SVG with hover tooltips showing the town name and coordinates. Include a "Generate New Map" button to create a fresh problem.`,
    outcome: 'SVG canvas with seeded random UK towns, tooltips on hover, and a map generator button that allows reproducible problem instances.',
  },
  {
    title: 'Build the user interaction',
    description: 'Let users manually explore the problem by building their own route and seeing real-time distance feedback.',
    prompt: `Add click-to-build routing: user clicks a starting city, then clicks other cities in order to build a tour. Display the accumulated distance in real-time. Show the path on the map as they build. Once all cities are visited, show the total distance and allow them to "Clear Route" to start over.`,
    outcome: 'Interactive route builder with real-time distance tracking and visual path feedback.',
  },
  {
    title: 'Implement the genetic algorithm',
    description: 'Build the core evolutionary solver with selection, crossover, and generational loop.',
    prompt: `Implement a genetic algorithm for TSP. Create a population of random tours. Use ordered crossover (OX) for genetic combination: given two parent tours, select a random segment from parent A, preserve its order, and fill the rest from parent B. Add tournament selection (pick fittest of 5 random individuals). Include elitism: the best tour from each generation always survives to the next. Run a generation loop with a configurable population size (default 100) and generations (default 500).`,
    outcome: 'Full GA pipeline with OX crossover, tournament selection, and elitism. Tours improve over generations.',
  },
  {
    title: 'Add three mutation operators',
    description: 'Diversity comes from multiple mutation strategies, each exploring different neighborhoods of the solution space.',
    prompt: `Add three mutation types to the GA: (1) Swap mutation — pick two cities at random and swap them; (2) 2-opt mutation — randomly select a segment of the tour and reverse it to fix crossing edges; (3) Segment reversal — pick a smaller segment and reverse it. Each mutation has an independent probability per individual. Allow the user to tune mutation rates via sliders.`,
    outcome: 'Three distinct mutation operators that create diversity and allow local structure improvements; 2-opt especially handles crossing paths.',
  },
  {
    title: 'Add branch-and-bound exact solver',
    description: 'Run an exact solver in parallel to show the true optimal for small maps and prove the GA quality.',
    prompt: `Implement a branch-and-bound exact TSP solver that runs incrementally alongside the GA. It prunes partial tours that exceed the best known upper bound. For maps with ~12 cities or fewer, it will find the true optimal within reasonable time. Display the branch-and-bound result (and its proof of optimality) side-by-side with the GA best tour and distance.`,
    outcome: 'Exact solver running in parallel; for small maps, users see proof of GA quality relative to the true optimal.',
  },
  {
    title: 'Elite diversity and analysis',
    description: 'Visualize the population structure and extract insights from the elite pool of best tours.',
    prompt: `Add an elite analysis panel showing the top 10 tours. Compute edge similarity: for each pair of elite tours, count how many city-to-city edges they share. Display a heatmap of edge similarity so users can see which tours are structurally similar. Highlight common sub-sequences across multiple elite tours to show emergent patterns. Add a convergence chart: plot the best distance found and average population distance over generations.`,
    outcome: 'Elite diversity heatmap, shared edge highlighting in top tours, and a convergence chart showing population and elite improvement.',
  },
]

export default promptSteps
