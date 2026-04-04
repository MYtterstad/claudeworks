import { NextResponse } from 'next/server'
import { getPortfolio } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Helper to convert decimal year to date
function decimalYearToISODate(decimalYear) {
  const year = Math.floor(decimalYear)
  const dayOfYear = Math.round((decimalYear - year) * 365.25)
  const date = new Date(year, 0, 1)
  date.setDate(date.getDate() + dayOfYear)
  return date.toISOString().split('T')[0]
}

// Load the Captario template
function loadTemplate() {
  const templatePath = '/sessions/inspiring-bold-mendel/mnt/Claude/AI Analysis/Portfolio data/CAD 0234 Basic-Default.json'
  const content = fs.readFileSync(templatePath, 'utf-8')
  return JSON.parse(content)
}

// Deep clone an object
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Update assumptions in template for a project
function updateAssumptions(template, project, phases) {
  const assumptions = template.data.assumptions

  // Helper to find and update assumption
  const updateAssumption = (name, value) => {
    const assumption = assumptions.find(a => a.name === name)
    if (assumption) {
      assumption.type.Scalar = value
    }
  }

  // Update scalar assumptions
  updateAssumption('Process start date', project.process_start_date)
  updateAssumption('Peak Year Sales', project.peak_year_sales)
  updateAssumption('Time to Peak Market Share', project.time_to_peak_years)
  updateAssumption('COGS Rate', project.cogs_rate)
  updateAssumption('Market and Sales Costs Rate', project.ms_rate)
  updateAssumption('Loss of Exclusivity', project.loe_year)
  updateAssumption('Sales After LoE', project.sales_after_loe)
  updateAssumption('Cannibalization Factor', project.cannibalization_factor)
  updateAssumption('Discount Rate', template.discountRate)
  updateAssumption('Tax Rate', template.taxRate)

  // Update phase-specific assumptions
  const phaseMap = {
    'PC': { success: 'PC/Success', duration: 'PC/Duration months', cost: 'PC/Internal Cost', extCost: 'PC/External Cost', delay: 'PC/Start Delay' },
    'PH1': { success: 'PH1/Success', duration: 'PH1/Duration months', cost: 'PH1/Internal Cost', extCost: 'PH1/External Cost', delay: 'PH1/Start Delay' },
    'PH2': { success: 'PH2/Success', duration: 'PH2/Duration months', cost: 'PH2/Internal Cost', extCost: 'PH2/External Cost', delay: 'PH2/Start Delay' },
    'PH3': { success: 'PH3/Success', duration: 'PH3/Duration months', cost: 'PH3/Internal Cost', extCost: 'PH3/External Cost', delay: 'PH3/Start Delay' },
    'REG': { success: 'Reg/Success', duration: 'Reg/Duration months', cost: 'Reg/Internal Cost', extCost: 'Reg/External Cost', delay: 'Reg/Start Delay' }
  }

  for (const phase of phases) {
    const phaseConfig = phaseMap[phase.phase]
    if (phaseConfig) {
      // Update Phase Success - completed phases = 1.0, market = 1.0, others use POS
      const successValue = phase.is_actual === 1 ? 1.0 : phase.pos
      updateAssumption(phaseConfig.success, successValue)

      // Update Duration - completed phases = 0, market = 999, others use duration
      const durationValue = phase.is_actual === 1 ? 0 : (phase.phase === 'MARKET' ? 999 : phase.duration_months)
      updateAssumption(phaseConfig.duration, durationValue)

      // Update costs
      updateAssumption(phaseConfig.cost, phase.internal_cost)
      updateAssumption(phaseConfig.extCost, phase.external_cost)

      // Update start delay
      updateAssumption(phaseConfig.delay, phase.start_delay_months || 0)
    }
  }

  // Update attribute values
  const attributeValues = template.data.attributeValues
  if (attributeValues) {
    const updateAttr = (name, value) => {
      const attr = attributeValues.find(a => a.name === name)
      if (attr) attr.selectedSegmentId = value
    }

    updateAttr('Current Phase', project.current_phase.toLowerCase())
    updateAttr('Therapeutic Area', project.ta ? project.ta.toLowerCase().replace(/\s+/g, '-') : 'oncology')
    updateAttr('Molecular Type', project.modality ? project.modality.toLowerCase().replace(/\s+/g, '-') : 'small-molecule')
    updateAttr('Source', project.source ? project.source.toLowerCase() : 'in-house')
  }
}

export async function POST(req) {
  try {
    const { portfolioId } = await req.json()

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Missing required field: portfolioId' },
        { status: 400 }
      )
    }

    const portfolio = getPortfolio(portfolioId)
    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    // Load template
    const baseTemplate = loadTemplate()

    // Generate Captario JSON for each project
    const captarioFiles = []

    for (const project of portfolio.projects) {
      const template = deepClone(baseTemplate)

      // Add discount/tax rates to template for easy access
      template.discountRate = portfolio.discount_rate
      template.taxRate = portfolio.tax_rate

      // Update assumptions with project data
      updateAssumptions(template, project, project.phases)

      // Store with project ID
      captarioFiles.push({
        projectId: project.id,
        projectName: project.name,
        data: template
      })
    }

    return NextResponse.json({
      success: true,
      portfolioId,
      portfolioName: portfolio.name,
      projectCount: captarioFiles.length,
      files: captarioFiles
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
