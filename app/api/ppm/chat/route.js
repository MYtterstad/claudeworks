export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  getAllProjects, getProject, createProject, updateProjectField, deleteProject,
  getPortfolios, getPortfolio, createPortfolio, updatePortfolio,
  addProjectToPortfolio, removeProjectFromPortfolio,
  getProjectSnapshots, getPortfolioSnapshots,
  getProjectSnapshot, getPortfolioSnapshot,
  createProjectSnapshot, createPortfolioSnapshot,
  advanceProjectPhase, updatePhaseField,
} from '@/lib/db'

// ============================================================================
// Tool definitions for Claude
// ============================================================================

const TOOLS = [
  {
    name: 'list_projects',
    description: 'List all projects in the database with their key attributes and phases. Returns full project data.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_project',
    description: 'Get detailed information about a specific project by ID, including all phases.',
    input_schema: {
      type: 'object',
      properties: { project_id: { type: 'string', description: 'The project ID (e.g. proj-kronos)' } },
      required: ['project_id']
    }
  },
  {
    name: 'list_portfolios',
    description: 'List all portfolios with their project counts.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_portfolio',
    description: 'Get a portfolio by ID with all its projects and phases.',
    input_schema: {
      type: 'object',
      properties: { portfolio_id: { type: 'string', description: 'The portfolio ID' } },
      required: ['portfolio_id']
    }
  },
  {
    name: 'update_project_field',
    description: 'Update a single field on a project. Fields: name, currentPhase, processStartDate, peakYearSales, timeToPeakYears, cogsRate, msRate, loeYear, salesAfterLoe, cannibalizationFactor, ta, modality, source, indication, modeOfAction.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        field: { type: 'string', description: 'The camelCase field name' },
        value: { description: 'The new value (string or number)' }
      },
      required: ['project_id', 'field', 'value']
    }
  },
  {
    name: 'update_phase_field',
    description: 'Update a field on a project phase. Fields: durationMonths, pos, internalCost, externalCost, isActual, startDelayMonths, milestonePayable, milestoneReceivable, actualDate, actualCost.',
    input_schema: {
      type: 'object',
      properties: {
        phase_id: { type: 'integer', description: 'The phase row ID' },
        field: { type: 'string' },
        value: { description: 'The new value' }
      },
      required: ['phase_id', 'field', 'value']
    }
  },
  {
    name: 'create_project',
    description: 'Create a new project with phases. Provide all fields needed for a pharma R&D project.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Unique ID like proj-name' },
        name: { type: 'string' },
        currentPhase: { type: 'string', enum: ['PC', 'PH1', 'PH2', 'PH3', 'REG', 'MARKET'] },
        ta: { type: 'string', description: 'Therapeutic area' },
        modality: { type: 'string' },
        source: { type: 'string' },
        indication: { type: 'string' },
        modeOfAction: { type: 'string' },
        peakYearSales: { type: 'number', description: 'Peak year sales in $M' },
        timeToPeakYears: { type: 'number' },
        cogsRate: { type: 'number' },
        msRate: { type: 'number' },
        loeYear: { type: 'number', description: 'Loss of exclusivity year' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration_months: { type: 'number' },
              pos: { type: 'number', description: 'Probability of success 0-1' },
              internal_cost: { type: 'number', description: 'Internal cost in $M' },
              external_cost: { type: 'number', description: 'External cost in $M' },
              is_actual: { type: 'integer', description: '1 if completed, 0 if planned' }
            }
          }
        }
      },
      required: ['id', 'name', 'currentPhase']
    }
  },
  {
    name: 'delete_project',
    description: 'Delete a project by ID. This is permanent.',
    input_schema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id']
    }
  },
  {
    name: 'advance_project_phase',
    description: 'Advance a project to the next phase, marking the current phase as completed with actual date and cost.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        actual_date: { type: 'string', description: 'Completion date YYYY-MM-DD' },
        actual_cost: { type: 'number', description: 'Actual cost in $M' }
      },
      required: ['project_id', 'actual_date']
    }
  },
  {
    name: 'list_snapshots',
    description: 'List snapshots for a project or portfolio.',
    input_schema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string', enum: ['project', 'portfolio'] },
        entity_id: { type: 'string' }
      },
      required: ['entity_type', 'entity_id']
    }
  },
  {
    name: 'create_snapshot',
    description: 'Create a named snapshot of a project or portfolio for later comparison.',
    input_schema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string', enum: ['project', 'portfolio'] },
        entity_id: { type: 'string' },
        name: { type: 'string', description: 'Snapshot name' }
      },
      required: ['entity_type', 'entity_id', 'name']
    }
  },
  {
    name: 'calculate_enpv',
    description: 'Calculate expected Net Present Value (eNPV) for a project. Uses risk-adjusted NPV with phase probabilities, costs, and commercial revenue projections.',
    input_schema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id']
    }
  },
  {
    name: 'portfolio_summary',
    description: 'Get a high-level summary of a portfolio: project count by phase, total costs, therapeutic areas, risk-adjusted value breakdown.',
    input_schema: {
      type: 'object',
      properties: { portfolio_id: { type: 'string' } },
      required: ['portfolio_id']
    }
  }
]

// ============================================================================
// Tool execution
// ============================================================================

async function executeTool(name, input) {
  switch (name) {
    case 'list_projects':
      return await getAllProjects()

    case 'get_project':
      return await getProject(input.project_id) || { error: 'Project not found' }

    case 'list_portfolios':
      return await getPortfolios()

    case 'get_portfolio':
      return await getPortfolio(input.portfolio_id) || { error: 'Portfolio not found' }

    case 'update_project_field':
      return await updateProjectField(input.project_id, input.field, input.value)

    case 'update_phase_field':
      return await updatePhaseField(input.phase_id, input.field, input.value)

    case 'create_project':
      return await createProject(input)

    case 'delete_project':
      await deleteProject(input.project_id)
      return { success: true, deleted: input.project_id }

    case 'advance_project_phase':
      return await advanceProjectPhase(input.project_id, input.actual_date, input.actual_cost || 0)

    case 'list_snapshots': {
      if (input.entity_type === 'project') return await getProjectSnapshots(input.entity_id)
      return await getPortfolioSnapshots(input.entity_id)
    }

    case 'create_snapshot': {
      if (input.entity_type === 'project') return await createProjectSnapshot(input.entity_id, input.name)
      return await createPortfolioSnapshot(input.entity_id, input.name)
    }

    case 'calculate_enpv': {
      const project = await getProject(input.project_id)
      if (!project) return { error: 'Project not found' }
      return calculateProjectENPV(project)
    }

    case 'portfolio_summary': {
      const portfolio = await getPortfolio(input.portfolio_id)
      if (!portfolio) return { error: 'Portfolio not found' }
      return buildPortfolioSummary(portfolio)
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ============================================================================
// Analytics helpers
// ============================================================================

function calculateProjectENPV(project, discountRate = 0.10) {
  const phases = project.phases || []
  const PHASE_ORDER = ['PC', 'PH1', 'PH2', 'PH3', 'REG']

  // Calculate cumulative probability of success
  let cumulativePoS = 1.0
  let totalCost = 0
  let totalDurationMonths = 0
  const phaseDetails = []

  for (const phaseName of PHASE_ORDER) {
    const phase = phases.find(p => p.phase === phaseName)
    if (!phase) continue

    const pos = phase.is_actual === 1 ? 1.0 : (phase.pos || 0)
    cumulativePoS *= pos
    const phaseCost = (phase.internal_cost || 0) + (phase.external_cost || 0)
    totalCost += phaseCost
    totalDurationMonths += phase.duration_months || 0

    phaseDetails.push({
      phase: phaseName,
      pos,
      cumulativePoS: Math.round(cumulativePoS * 1000) / 1000,
      cost: Math.round(phaseCost * 10) / 10,
      duration_months: phase.duration_months,
      is_actual: phase.is_actual === 1
    })
  }

  // Commercial revenue projection
  const peakSales = project.peak_year_sales || 0
  const timeToPeak = project.time_to_peak_years || 3
  const loeYear = project.loe_year || 2040
  const cogsRate = project.cogs_rate || 0.05
  const msRate = project.ms_rate || 0.08
  const launchYear = 2026 + (totalDurationMonths / 12) // rough estimate
  const yearsOnMarket = Math.max(0, loeYear - launchYear)

  // Simple trapezoidal revenue model
  let totalRevenue = 0
  for (let y = 0; y < yearsOnMarket; y++) {
    const rampUp = Math.min(1.0, (y + 1) / timeToPeak)
    const annualSales = peakSales * rampUp
    const netRevenue = annualSales * (1 - cogsRate - msRate)
    const discounted = netRevenue / Math.pow(1 + discountRate, y + (launchYear - 2026))
    totalRevenue += discounted
  }

  // Risk-adjusted NPV
  const riskAdjustedRevenue = totalRevenue * cumulativePoS
  const discountedCost = totalCost // simplified - costs are near-term
  const enpv = riskAdjustedRevenue - discountedCost

  return {
    project_name: project.name,
    current_phase: project.current_phase,
    cumulative_pos: Math.round(cumulativePoS * 1000) / 1000,
    total_dev_cost_M: Math.round(totalCost * 10) / 10,
    peak_year_sales_M: peakSales,
    estimated_launch_year: Math.round(launchYear * 10) / 10,
    loe_year: loeYear,
    risk_adjusted_revenue_M: Math.round(riskAdjustedRevenue),
    enpv_M: Math.round(enpv),
    phase_details: phaseDetails,
    discount_rate: discountRate
  }
}

function buildPortfolioSummary(portfolio) {
  const projects = portfolio.projects || []
  const phaseCount = { PC: 0, PH1: 0, PH2: 0, PH3: 0, REG: 0, MARKET: 0 }
  const taBreakdown = {}
  let totalCost = 0

  const projectSummaries = projects.map(p => {
    phaseCount[p.current_phase] = (phaseCount[p.current_phase] || 0) + 1
    const ta = p.ta || 'Unknown'
    taBreakdown[ta] = (taBreakdown[ta] || 0) + 1

    const phaseCost = (p.phases || []).reduce((sum, ph) => sum + (ph.internal_cost || 0) + (ph.external_cost || 0), 0)
    totalCost += phaseCost

    const enpvResult = calculateProjectENPV(p, portfolio.discount_rate || 0.10)

    return {
      name: p.name,
      id: p.id,
      phase: p.current_phase,
      ta: p.ta,
      peak_sales_M: p.peak_year_sales,
      dev_cost_M: Math.round(phaseCost * 10) / 10,
      cumulative_pos: enpvResult.cumulative_pos,
      enpv_M: enpvResult.enpv_M
    }
  })

  const totalENPV = projectSummaries.reduce((sum, p) => sum + (p.enpv_M || 0), 0)

  return {
    portfolio_name: portfolio.name,
    portfolio_id: portfolio.id,
    project_count: projects.length,
    phase_distribution: phaseCount,
    therapeutic_areas: taBreakdown,
    total_dev_cost_M: Math.round(totalCost),
    total_enpv_M: Math.round(totalENPV),
    discount_rate: portfolio.discount_rate,
    projects: projectSummaries.sort((a, b) => (b.enpv_M || 0) - (a.enpv_M || 0))
  }
}

// ============================================================================
// System prompt
// ============================================================================

const SYSTEM_PROMPT = `You are a pharmaceutical portfolio management assistant for the Titan Portfolio. You help analyze R&D pipeline data, calculate risk-adjusted valuations, and manage project/portfolio data.

Key domain knowledge:
- Projects progress through phases: PC (Preclinical) → PH1 → PH2 → PH3 → REG (Regulatory) → MARKET
- Each phase has: duration (months), probability of success (PoS), internal + external costs
- Completed phases (is_actual=1) have PoS=1.0 in calculations
- eNPV = risk-adjusted Net Present Value = (cumulative PoS × discounted revenue) - development costs
- Peak Year Sales, COGS rate, M&S rate, and Loss of Exclusivity (LoE) drive commercial projections
- Process start date uses decimal year format (e.g. 2024.5 = mid-2024)

When answering:
- Be concise but insightful. Focus on what matters for decision-making.
- Use actual numbers from the data. Don't guess.
- When comparing projects, highlight key differentiators: risk, value, timeline.
- For portfolio-level questions, provide aggregate views by phase, TA, or risk tier.
- Always use the available tools to get real data before answering.
- Format numbers: costs in $M, percentages for PoS, years for dates.`

// ============================================================================
// Chat endpoint
// ============================================================================

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'ANTHROPIC_API_KEY not configured',
        message: 'Add your Anthropic API key to Vercel environment variables.'
      }, { status: 503 })
    }

    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    // Import Anthropic SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    // Agentic loop: keep calling Claude until it stops using tools
    let currentMessages = [...messages]
    let iterations = 0
    const MAX_ITERATIONS = 10

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages
      })

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')

      if (toolUseBlocks.length === 0) {
        // No tools — extract text response and return
        const textContent = response.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        return NextResponse.json({
          response: textContent,
          iterations
        })
      }

      // Execute all tool calls
      currentMessages.push({ role: 'assistant', content: response.content })

      const toolResults = []
      for (const toolUse of toolUseBlocks) {
        try {
          const result = await executeTool(toolUse.name, toolUse.input)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          })
        } catch (error) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: error.message }),
            is_error: true
          })
        }
      }

      currentMessages.push({ role: 'user', content: toolResults })
    }

    return NextResponse.json({
      response: 'I ran into a complexity limit processing your request. Could you try a more specific question?',
      iterations
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
