export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db, clearAllData, createPortfolio, createProject, addPhase, addProjectToPortfolio } from '@/lib/db'

// Helper to convert date string to decimal year
function dateToDecimalYear(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z')
  const year = date.getUTCFullYear()
  const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / 86400000)
  const daysInYear = new Date(year, 11, 31).getUTCDate()
  return year + dayOfYear / daysInYear
}

// Titan portfolio data - 14 projects
const TITAN_PROJECTS = [
  {
    id: 'proj-kronos',
    name: 'Kronos',
    currentPhase: 'PH3',
    ta: 'Oncology',
    modality: 'Small molecule',
    source: 'In-house',
    indication: 'Non-small cell lung cancer',
    modeOfAction: 'EGFR inhibitor',
    peakYearSales: 1125,
    timeToPeakYears: 3,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2035,
    phases: [
      { phase: 'PC', cost: 10, pos: 1.0, months: 16, date: '2022-04-23', actual: true },
      { phase: 'PH1', cost: 20, pos: 1.0, months: 18, date: '2023-08-06', actual: true },
      { phase: 'PH2', cost: 50, pos: 1.0, months: 24, date: '2024-02-03', actual: true },
      { phase: 'PH3', cost: 140, pos: 0.65, months: 8, date: '2026-02-11', actual: false },
      { phase: 'REG', cost: 15, pos: 0.9, months: 14, date: '2026-10-10', actual: false }
    ]
  },
  {
    id: 'proj-rhea',
    name: 'Rhea',
    currentPhase: 'PH2',
    ta: 'CNS',
    modality: 'Antibody',
    source: 'Licensed',
    indication: "Alzheimer's disease",
    modeOfAction: 'Amyloid-beta targeting antibody',
    peakYearSales: 750,
    timeToPeakYears: 4,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2037,
    phases: [
      { phase: 'PC', cost: 9, pos: 1.0, months: 14, date: '2021-10-10', actual: true },
      { phase: 'PH1', cost: 18, pos: 1.0, months: 20, date: '2023-12-07', actual: true },
      { phase: 'PH2', cost: 42, pos: 0.5, months: 10, date: '2025-08-06', actual: false },
      { phase: 'PH3', cost: 150, pos: 0.8, months: 24, date: '2026-06-24', actual: false },
      { phase: 'REG', cost: 12, pos: 0.95, months: 14, date: '2028-06-20', actual: false }
    ]
  },
  {
    id: 'proj-oceanus',
    name: 'Oceanus',
    currentPhase: 'PH1',
    ta: 'Immunology',
    modality: 'Small molecule',
    source: 'In-house',
    indication: 'Rheumatoid arthritis',
    modeOfAction: 'JAK1/3 inhibitor',
    peakYearSales: 1200,
    timeToPeakYears: 5,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2040,
    phases: [
      { phase: 'PC', cost: 11, pos: 1.0, months: 18, date: '2024-10-05', actual: true },
      { phase: 'PH1', cost: 10, pos: 0.7, months: 12, date: '2026-04-21', actual: false },
      { phase: 'PH2', cost: 35, pos: 0.3, months: 18, date: '2027-04-16', actual: false },
      { phase: 'PH3', cost: 200, pos: 0.65, months: 30, date: '2029-10-04', actual: false },
      { phase: 'REG', cost: 15, pos: 0.9, months: 14, date: '2032-04-03', actual: false }
    ]
  },
  {
    id: 'proj-hyperion',
    name: 'Hyperion',
    currentPhase: 'PH1',
    ta: 'Rare Disease',
    modality: 'Gene therapy',
    source: 'Partnership',
    indication: 'Spinal muscular atrophy',
    modeOfAction: 'SMN gene replacement',
    peakYearSales: 900,
    timeToPeakYears: 4,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2039,
    phases: [
      { phase: 'PC', cost: 9.5, pos: 1.0, months: 15, date: '2025-01-05', actual: true },
      { phase: 'PH1', cost: 10, pos: 0.6, months: 10, date: '2026-04-09', actual: false },
      { phase: 'PH2', cost: 60, pos: 0.45, months: 16, date: '2027-02-10', actual: false },
      { phase: 'PH3', cost: 250, pos: 0.7, months: 28, date: '2028-06-19', actual: false },
      { phase: 'REG', cost: 20, pos: 0.9, months: 12, date: '2030-10-22', actual: false }
    ]
  },
  {
    id: 'proj-theia',
    name: 'Theia',
    currentPhase: 'PH1',
    ta: 'Oncology',
    modality: 'ADC',
    source: 'In-house',
    indication: 'HER2+ breast cancer',
    modeOfAction: 'HER2-targeting ADC',
    peakYearSales: 1350,
    timeToPeakYears: 1,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2042,
    phases: [
      { phase: 'PC', cost: 11.5, pos: 1.0, months: 17, date: '2024-11-03', actual: true },
      { phase: 'PH1', cost: 8, pos: 0.7, months: 14, date: '2026-04-20', actual: false },
      { phase: 'PH2', cost: 27, pos: 0.5, months: 20, date: '2027-06-09', actual: false },
      { phase: 'PH3', cost: 400, pos: 0.55, months: 36, date: '2029-02-25', actual: false },
      { phase: 'REG', cost: 12, pos: 0.9, months: 16, date: '2032-02-23', actual: false }
    ]
  },
  {
    id: 'proj-coeus',
    name: 'Coeus',
    currentPhase: 'PH2',
    ta: 'Cardiovascular',
    modality: 'Small molecule',
    source: 'Acquired',
    indication: 'Heart failure with reduced ejection fraction',
    modeOfAction: 'SGLT2 inhibitor',
    peakYearSales: 1800,
    timeToPeakYears: 2,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2039,
    phases: [
      { phase: 'PC', cost: 12, pos: 1.0, months: 19, date: '2021-06-25', actual: true },
      { phase: 'PH1', cost: 22, pos: 1.0, months: 22, date: '2023-01-20', actual: true },
      { phase: 'PH2', cost: 40, pos: 0.35, months: 14, date: '2024-11-16', actual: false },
      { phase: 'PH3', cost: 255, pos: 0.85, months: 30, date: '2026-01-10', actual: false },
      { phase: 'REG', cost: 8, pos: 0.9, months: 14, date: '2028-07-17', actual: false }
    ]
  },
  {
    id: 'proj-atlas',
    name: 'Atlas',
    currentPhase: 'PH3',
    ta: 'CNS',
    modality: 'Antibody',
    source: 'In-house',
    indication: "Parkinson's disease",
    modeOfAction: 'Alpha-synuclein targeting antibody',
    peakYearSales: 1125,
    timeToPeakYears: 5,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2036,
    phases: [
      { phase: 'PC', cost: 10.5, pos: 1.0, months: 13, date: '2022-03-21', actual: true },
      { phase: 'PH1', cost: 19, pos: 1.0, months: 19, date: '2023-04-11', actual: true },
      { phase: 'PH2', cost: 52, pos: 1.0, months: 25, date: '2024-11-03', actual: true },
      { phase: 'PH3', cost: 200, pos: 0.8, months: 12, date: '2026-12-08', actual: false },
      { phase: 'REG', cost: 10, pos: 0.9, months: 14, date: '2027-12-25', actual: false }
    ]
  },
  {
    id: 'proj-prometheus',
    name: 'Prometheus',
    currentPhase: 'PH1',
    ta: 'Metabolic',
    modality: 'RNA therapeutic',
    source: 'Licensed',
    indication: 'Type 2 diabetes',
    modeOfAction: 'GLP-1R agonist (RNA)',
    peakYearSales: 1125,
    timeToPeakYears: 3,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2040,
    phases: [
      { phase: 'PC', cost: 10, pos: 1.0, months: 16, date: '2024-12-16', actual: true },
      { phase: 'PH1', cost: 15, pos: 0.6, months: 12, date: '2026-04-13', actual: false },
      { phase: 'PH2', cost: 60, pos: 0.35, months: 18, date: '2027-04-11', actual: false },
      { phase: 'PH3', cost: 180, pos: 0.65, months: 28, date: '2028-10-07', actual: false },
      { phase: 'REG', cost: 13, pos: 0.95, months: 14, date: '2030-02-09', actual: false }
    ]
  },
  {
    id: 'proj-mnemosyne',
    name: 'Mnemosyne',
    currentPhase: 'PH2',
    ta: 'Immunology',
    modality: 'Small molecule',
    source: 'Partnership',
    indication: 'Inflammatory bowel disease',
    modeOfAction: 'TYK2 inhibitor',
    peakYearSales: 1050,
    timeToPeakYears: 1,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2038,
    phases: [
      { phase: 'PC', cost: 9, pos: 1.0, months: 14, date: '2022-06-13', actual: true },
      { phase: 'PH1', cost: 15, pos: 1.0, months: 18, date: '2023-08-06', actual: true },
      { phase: 'PH2', cost: 30, pos: 0.5, months: 12, date: '2025-02-05', actual: false },
      { phase: 'PH3', cost: 308.95, pos: 0.65, months: 24, date: '2026-02-15', actual: false },
      { phase: 'REG', cost: 20, pos: 0.9, months: 12, date: '2028-02-06', actual: false }
    ]
  },
  {
    id: 'proj-phoebe',
    name: 'Phoebe',
    currentPhase: 'REG',
    ta: 'Oncology',
    modality: 'Cell therapy',
    source: 'In-house',
    indication: 'Chronic myeloid leukemia',
    modeOfAction: 'CAR-T cell therapy',
    peakYearSales: 525,
    timeToPeakYears: 4,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2034,
    phases: [
      { phase: 'PC', cost: 11, pos: 1.0, months: 15, date: '2018-04-14', actual: true },
      { phase: 'PH1', cost: 20, pos: 1.0, months: 18, date: '2019-07-14', actual: true },
      { phase: 'PH2', cost: 60, pos: 1.0, months: 24, date: '2021-01-22', actual: true },
      { phase: 'PH3', cost: 350, pos: 1.0, months: 36, date: '2023-01-11', actual: true },
      { phase: 'REG', cost: 12, pos: 0.9, months: 14, date: '2026-01-04', actual: false }
    ]
  },
  {
    id: 'proj-themis',
    name: 'Themis',
    currentPhase: 'PH1',
    ta: 'Rare Disease',
    modality: 'Antibody',
    source: 'Licensed',
    indication: 'Transthyretin amyloidosis',
    modeOfAction: 'TTR-stabilizing antibody',
    peakYearSales: 1125,
    timeToPeakYears: 2,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2040,
    phases: [
      { phase: 'PC', cost: 10.5, pos: 1.0, months: 17, date: '2024-11-17', actual: true },
      { phase: 'PH1', cost: 12, pos: 0.6, months: 12, date: '2026-04-20', actual: false },
      { phase: 'PH2', cost: 50, pos: 0.35, months: 18, date: '2027-04-06', actual: false },
      { phase: 'PH3', cost: 250, pos: 0.7, months: 30, date: '2028-10-15', actual: false },
      { phase: 'REG', cost: 14, pos: 0.9, months: 14, date: '2030-04-05', actual: false }
    ]
  },
  {
    id: 'proj-iapetus',
    name: 'Iapetus',
    currentPhase: 'PC',
    ta: 'Oncology',
    modality: 'Bispecific antibody',
    source: 'In-house',
    indication: 'Multiple myeloma',
    modeOfAction: 'BCMA×CD3 bispecific',
    peakYearSales: 950,
    timeToPeakYears: 3,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2042,
    phases: [
      { phase: 'PC', cost: 12, pos: 0.8, months: 18, date: '2026-01-20', actual: false },
      { phase: 'PH1', cost: 18, pos: 0.65, months: 14, date: '2027-07-12', actual: false },
      { phase: 'PH2', cost: 45, pos: 0.4, months: 20, date: '2028-09-23', actual: false },
      { phase: 'PH3', cost: 220, pos: 0.6, months: 30, date: '2030-05-22', actual: false },
      { phase: 'REG', cost: 14, pos: 0.9, months: 14, date: '2032-11-14', actual: false }
    ]
  },
  {
    id: 'proj-crius',
    name: 'Crius',
    currentPhase: 'PC',
    ta: 'Metabolic',
    modality: 'Small molecule',
    source: 'In-house',
    indication: 'NASH / MASH',
    modeOfAction: 'FXR agonist',
    peakYearSales: 1400,
    timeToPeakYears: 4,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2043,
    phases: [
      { phase: 'PC', cost: 14, pos: 0.75, months: 16, date: '2026-02-21', actual: false },
      { phase: 'PH1', cost: 20, pos: 0.6, months: 16, date: '2027-06-09', actual: false },
      { phase: 'PH2', cost: 55, pos: 0.35, months: 22, date: '2028-10-25', actual: false },
      { phase: 'PH3', cost: 280, pos: 0.55, months: 32, date: '2030-08-05', actual: false },
      { phase: 'REG', cost: 16, pos: 0.9, months: 14, date: '2033-04-04', actual: false }
    ]
  },
  {
    id: 'proj-tethys',
    name: 'Tethys',
    currentPhase: 'PC',
    ta: 'Cardiovascular',
    modality: 'RNA therapeutic',
    source: 'Partnership',
    indication: 'Familial hypercholesterolemia',
    modeOfAction: 'PCSK9 siRNA',
    peakYearSales: 800,
    timeToPeakYears: 3,
    cogsRate: 0.05,
    msRate: 0.08,
    loeYear: 2041,
    phases: [
      { phase: 'PC', cost: 10, pos: 0.85, months: 15, date: '2026-03-24', actual: false },
      { phase: 'PH1', cost: 14, pos: 0.7, months: 12, date: '2027-06-10', actual: false },
      { phase: 'PH2', cost: 38, pos: 0.45, months: 18, date: '2028-06-12', actual: false },
      { phase: 'PH3', cost: 190, pos: 0.65, months: 28, date: '2029-12-05', actual: false },
      { phase: 'REG', cost: 12, pos: 0.9, months: 14, date: '2032-04-10', actual: false }
    ]
  }
]

export async function POST() {
  try {
    // Clear all existing data
    clearAllData()

    // Create portfolio
    const portfolio = createPortfolio(
      'titan-portfolio',
      'Titan Portfolio 2026',
      null,
      0.10,
      0.00
    )

    // Add each project and link to portfolio
    for (const projectData of TITAN_PROJECTS) {
      const pcPhase = projectData.phases.find(p => p.phase === 'PC')
      const processStartDate = pcPhase ? dateToDecimalYear(pcPhase.date) : 2026

      // Create project (no portfolio_id — projects are independent)
      createProject({
        id: projectData.id,
        name: projectData.name,
        currentPhase: projectData.currentPhase,
        processStartDate,
        peakYearSales: projectData.peakYearSales,
        timeToPeakYears: projectData.timeToPeakYears,
        cogsRate: projectData.cogsRate,
        msRate: projectData.msRate,
        loeYear: projectData.loeYear,
        ta: projectData.ta,
        modality: projectData.modality,
        source: projectData.source,
        indication: projectData.indication,
        modeOfAction: projectData.modeOfAction
      })

      // Add phases
      for (const phase of projectData.phases) {
        const internalCost = phase.cost * 0.4
        const externalCost = phase.cost * 0.6
        addPhase(
          projectData.id,
          phase.phase,
          phase.months,
          phase.pos,
          internalCost,
          externalCost,
          phase.actual ? 1 : 0
        )
      }

      // Link project to portfolio
      addProjectToPortfolio('titan-portfolio', projectData.id)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Titan portfolio seeded with 14 projects',
        portfolio
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
