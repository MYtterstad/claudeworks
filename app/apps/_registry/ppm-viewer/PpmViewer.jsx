'use client'
import { useState, useMemo, createContext, useContext } from "react";
import { ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from "recharts";

const DATA = {"portfolio":{"id":"titan-portfolio","name":"Titan Portfolio 2026","currency":"USD","currencyUnit":"M","settings":{"discountRate":0.1,"taxRate":0.0,"simulationIterations":10000,"timeHorizonYears":20,"startYear":2026},"projects":[{"id":"proj-kronos","name":"Kronos","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH3","modality":"Small molecule","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Oncology","indication":"Non-small cell lung cancer","modeOfAction":"EGFR inhibitor"},"commercial":{"peakYearSales":1125,"timeToPeakYears":3,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2035},"phases":[{"name":"PC","cost":10,"probabilityOfSuccess":1.0,"durationMonths":16,"startDate":"2022-04-01","isActual":true},{"name":"PH1","cost":20,"probabilityOfSuccess":1.0,"durationMonths":18,"startDate":"2023-08-01","isActual":true},{"name":"PH2","cost":50,"probabilityOfSuccess":1.0,"durationMonths":24,"startDate":"2024-02-01","isActual":true},{"name":"PH3","cost":140,"probabilityOfSuccess":0.65,"durationMonths":8,"startDate":"2026-02-01","isActual":false},{"name":"REG","cost":15,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2026-10-01","isActual":false}]},{"id":"proj-rhea","name":"Rhea","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH2","modality":"Antibody","source":"Licensed","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"CNS","indication":"Alzheimer's disease","modeOfAction":"Amyloid-beta targeting antibody"},"commercial":{"peakYearSales":750,"timeToPeakYears":4,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2037},"phases":[{"name":"PC","cost":9,"probabilityOfSuccess":1.0,"durationMonths":14,"startDate":"2021-10-01","isActual":true},{"name":"PH1","cost":18,"probabilityOfSuccess":1.0,"durationMonths":20,"startDate":"2023-12-01","isActual":true},{"name":"PH2","cost":42,"probabilityOfSuccess":0.5,"durationMonths":10,"startDate":"2025-08-01","isActual":false},{"name":"PH3","cost":150,"probabilityOfSuccess":0.8,"durationMonths":24,"startDate":"2026-06-01","isActual":false},{"name":"REG","cost":12,"probabilityOfSuccess":0.95,"durationMonths":14,"startDate":"2028-06-01","isActual":false}]},{"id":"proj-oceanus","name":"Oceanus","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH1","modality":"Small molecule","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Immunology","indication":"Rheumatoid arthritis","modeOfAction":"JAK1/3 inhibitor"},"commercial":{"peakYearSales":1200,"timeToPeakYears":5,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2040},"phases":[{"name":"PC","cost":11,"probabilityOfSuccess":1.0,"durationMonths":18,"startDate":"2024-10-01","isActual":true},{"name":"PH1","cost":10,"probabilityOfSuccess":0.7,"durationMonths":12,"startDate":"2026-04-01","isActual":false},{"name":"PH2","cost":35,"probabilityOfSuccess":0.3,"durationMonths":18,"startDate":"2027-04-01","isActual":false},{"name":"PH3","cost":200,"probabilityOfSuccess":0.65,"durationMonths":30,"startDate":"2029-10-01","isActual":false},{"name":"REG","cost":15,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2032-04-01","isActual":false}]},{"id":"proj-hyperion","name":"Hyperion","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH1","modality":"Gene therapy","source":"Partnership","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Rare Disease","indication":"Spinal muscular atrophy","modeOfAction":"SMN gene replacement"},"commercial":{"peakYearSales":900,"timeToPeakYears":4,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2039},"phases":[{"name":"PC","cost":9.5,"probabilityOfSuccess":1.0,"durationMonths":15,"startDate":"2025-01-01","isActual":true},{"name":"PH1","cost":10,"probabilityOfSuccess":0.6,"durationMonths":10,"startDate":"2026-04-01","isActual":false},{"name":"PH2","cost":60,"probabilityOfSuccess":0.45,"durationMonths":16,"startDate":"2027-02-01","isActual":false},{"name":"PH3","cost":250,"probabilityOfSuccess":0.7,"durationMonths":28,"startDate":"2028-06-01","isActual":false},{"name":"REG","cost":20,"probabilityOfSuccess":0.9,"durationMonths":12,"startDate":"2030-10-01","isActual":false}]},{"id":"proj-theia","name":"Theia","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH1","modality":"ADC","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Oncology","indication":"HER2+ breast cancer","modeOfAction":"HER2-targeting ADC"},"commercial":{"peakYearSales":1350,"timeToPeakYears":1,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2042},"phases":[{"name":"PC","cost":11.5,"probabilityOfSuccess":1.0,"durationMonths":17,"startDate":"2024-11-01","isActual":true},{"name":"PH1","cost":8,"probabilityOfSuccess":0.7,"durationMonths":14,"startDate":"2026-04-01","isActual":false},{"name":"PH2","cost":27,"probabilityOfSuccess":0.5,"durationMonths":20,"startDate":"2027-06-01","isActual":false},{"name":"PH3","cost":400,"probabilityOfSuccess":0.55,"durationMonths":36,"startDate":"2029-02-01","isActual":false},{"name":"REG","cost":12,"probabilityOfSuccess":0.9,"durationMonths":16,"startDate":"2032-02-01","isActual":false}]},{"id":"proj-coeus","name":"Coeus","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH2","modality":"Small molecule","source":"Acquired","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Cardiovascular","indication":"Heart failure with reduced ejection fraction","modeOfAction":"SGLT2 inhibitor"},"commercial":{"peakYearSales":1800,"timeToPeakYears":2,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2039},"phases":[{"name":"PC","cost":12,"probabilityOfSuccess":1.0,"durationMonths":19,"startDate":"2021-06-01","isActual":true},{"name":"PH1","cost":22,"probabilityOfSuccess":1.0,"durationMonths":22,"startDate":"2023-01-01","isActual":true},{"name":"PH2","cost":40,"probabilityOfSuccess":0.35,"durationMonths":14,"startDate":"2024-11-01","isActual":false},{"name":"PH3","cost":255,"probabilityOfSuccess":0.85,"durationMonths":30,"startDate":"2026-01-01","isActual":false},{"name":"REG","cost":8,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2028-07-01","isActual":false}]},{"id":"proj-atlas","name":"Atlas","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH3","modality":"Antibody","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"CNS","indication":"Parkinson's disease","modeOfAction":"Alpha-synuclein targeting antibody"},"commercial":{"peakYearSales":1125,"timeToPeakYears":5,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2036},"phases":[{"name":"PC","cost":10.5,"probabilityOfSuccess":1.0,"durationMonths":13,"startDate":"2022-03-01","isActual":true},{"name":"PH1","cost":19,"probabilityOfSuccess":1.0,"durationMonths":19,"startDate":"2023-04-01","isActual":true},{"name":"PH2","cost":52,"probabilityOfSuccess":1.0,"durationMonths":25,"startDate":"2024-11-01","isActual":true},{"name":"PH3","cost":200,"probabilityOfSuccess":0.8,"durationMonths":12,"startDate":"2026-12-01","isActual":false},{"name":"REG","cost":10,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2027-12-01","isActual":false}]},{"id":"proj-prometheus","name":"Prometheus","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH1","modality":"RNA therapeutic","source":"Licensed","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Metabolic","indication":"Type 2 diabetes","modeOfAction":"GLP-1R agonist (RNA)"},"commercial":{"peakYearSales":1125,"timeToPeakYears":3,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2040},"phases":[{"name":"PC","cost":10,"probabilityOfSuccess":1.0,"durationMonths":16,"startDate":"2024-12-01","isActual":true},{"name":"PH1","cost":15,"probabilityOfSuccess":0.6,"durationMonths":12,"startDate":"2026-04-01","isActual":false},{"name":"PH2","cost":60,"probabilityOfSuccess":0.35,"durationMonths":18,"startDate":"2027-04-01","isActual":false},{"name":"PH3","cost":180,"probabilityOfSuccess":0.65,"durationMonths":28,"startDate":"2028-10-01","isActual":false},{"name":"REG","cost":13,"probabilityOfSuccess":0.95,"durationMonths":14,"startDate":"2030-02-01","isActual":false}]},{"id":"proj-mnemosyne","name":"Mnemosyne","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH2","modality":"Small molecule","source":"Partnership","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Immunology","indication":"Inflammatory bowel disease","modeOfAction":"TYK2 inhibitor"},"commercial":{"peakYearSales":1050,"timeToPeakYears":1,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2038},"phases":[{"name":"PC","cost":9,"probabilityOfSuccess":1.0,"durationMonths":14,"startDate":"2022-06-01","isActual":true},{"name":"PH1","cost":15,"probabilityOfSuccess":1.0,"durationMonths":18,"startDate":"2023-08-01","isActual":true},{"name":"PH2","cost":30,"probabilityOfSuccess":0.5,"durationMonths":12,"startDate":"2025-02-01","isActual":false},{"name":"PH3","cost":308.95,"probabilityOfSuccess":0.65,"durationMonths":24,"startDate":"2026-02-01","isActual":false},{"name":"REG","cost":20,"probabilityOfSuccess":0.9,"durationMonths":12,"startDate":"2028-02-01","isActual":false}]},{"id":"proj-phoebe","name":"Phoebe","modelType":"portfolio","included":true,"attributes":{"currentPhase":"REG","modality":"Cell therapy","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Oncology","indication":"Chronic myeloid leukemia","modeOfAction":"CAR-T cell therapy"},"commercial":{"peakYearSales":525,"timeToPeakYears":4,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2034},"phases":[{"name":"PC","cost":11,"probabilityOfSuccess":1.0,"durationMonths":15,"startDate":"2018-04-01","isActual":true},{"name":"PH1","cost":20,"probabilityOfSuccess":1.0,"durationMonths":18,"startDate":"2019-07-01","isActual":true},{"name":"PH2","cost":60,"probabilityOfSuccess":1.0,"durationMonths":24,"startDate":"2021-01-01","isActual":true},{"name":"PH3","cost":350,"probabilityOfSuccess":1.0,"durationMonths":36,"startDate":"2023-01-01","isActual":true},{"name":"REG","cost":12,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2026-01-01","isActual":false}]},{"id":"proj-themis","name":"Themis","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PH1","modality":"Antibody","source":"Licensed","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Rare Disease","indication":"Transthyretin amyloidosis","modeOfAction":"TTR-stabilizing antibody"},"commercial":{"peakYearSales":1125,"timeToPeakYears":2,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2040},"phases":[{"name":"PC","cost":10.5,"probabilityOfSuccess":1.0,"durationMonths":17,"startDate":"2024-11-01","isActual":true},{"name":"PH1","cost":12,"probabilityOfSuccess":0.6,"durationMonths":12,"startDate":"2026-04-01","isActual":false},{"name":"PH2","cost":50,"probabilityOfSuccess":0.35,"durationMonths":18,"startDate":"2027-04-01","isActual":false},{"name":"PH3","cost":250,"probabilityOfSuccess":0.7,"durationMonths":30,"startDate":"2028-10-01","isActual":false},{"name":"REG","cost":14,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2030-04-01","isActual":false}]},{"id":"proj-iapetus","name":"Iapetus","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PC","modality":"Bispecific antibody","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Oncology","indication":"Multiple myeloma","modeOfAction":"BCMA\u00d7CD3 bispecific"},"commercial":{"peakYearSales":950,"timeToPeakYears":3,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2042},"phases":[{"name":"PC","cost":12,"probabilityOfSuccess":0.8,"durationMonths":18,"startDate":"2026-01-01","isActual":false},{"name":"PH1","cost":18,"probabilityOfSuccess":0.65,"durationMonths":14,"startDate":"2027-07-01","isActual":false},{"name":"PH2","cost":45,"probabilityOfSuccess":0.4,"durationMonths":20,"startDate":"2028-09-01","isActual":false},{"name":"PH3","cost":220,"probabilityOfSuccess":0.6,"durationMonths":30,"startDate":"2030-05-01","isActual":false},{"name":"REG","cost":14,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2032-11-01","isActual":false}]},{"id":"proj-crius","name":"Crius","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PC","modality":"Small molecule","source":"In-house","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Metabolic","indication":"NASH / MASH","modeOfAction":"FXR agonist"},"commercial":{"peakYearSales":1400,"timeToPeakYears":4,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2043},"phases":[{"name":"PC","cost":14,"probabilityOfSuccess":0.75,"durationMonths":16,"startDate":"2026-02-01","isActual":false},{"name":"PH1","cost":20,"probabilityOfSuccess":0.6,"durationMonths":16,"startDate":"2027-06-01","isActual":false},{"name":"PH2","cost":55,"probabilityOfSuccess":0.35,"durationMonths":22,"startDate":"2028-10-01","isActual":false},{"name":"PH3","cost":280,"probabilityOfSuccess":0.55,"durationMonths":32,"startDate":"2030-08-01","isActual":false},{"name":"REG","cost":16,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2033-04-01","isActual":false}]},{"id":"proj-tethys","name":"Tethys","modelType":"portfolio","included":true,"attributes":{"currentPhase":"PC","modality":"RNA therapeutic","source":"Partnership","pipelineStatus":"Development Project","priority":3,"therapeuticArea":"Cardiovascular","indication":"Familial hypercholesterolemia","modeOfAction":"PCSK9 siRNA"},"commercial":{"peakYearSales":800,"timeToPeakYears":3,"cogsPercent":0.05,"marketingAndSalesPercent":0.08,"lossOfExclusivityYear":2041},"phases":[{"name":"PC","cost":10,"probabilityOfSuccess":0.85,"durationMonths":15,"startDate":"2026-03-01","isActual":false},{"name":"PH1","cost":14,"probabilityOfSuccess":0.7,"durationMonths":12,"startDate":"2027-06-01","isActual":false},{"name":"PH2","cost":38,"probabilityOfSuccess":0.45,"durationMonths":18,"startDate":"2028-06-01","isActual":false},{"name":"PH3","cost":190,"probabilityOfSuccess":0.65,"durationMonths":28,"startDate":"2029-12-01","isActual":false},{"name":"REG","cost":12,"probabilityOfSuccess":0.9,"durationMonths":14,"startDate":"2032-04-01","isActual":false}]}]},"simulation":{"iterations":10000,"settings":{"discountRate":0.1,"taxRate":0.0,"startYear":2026,"timeHorizonYears":20},"portfolioKPIs":{"expectedNPV":9289.32,"npvPercentiles":{"p10":4045.1,"p25":6174.73,"p50":8943.45,"p75":11973.47,"p90":15200.79},"expectedPeakRevenue":3662.57,"expectedLaunches":4.22,"launchDistribution":[{"launches":0,"probability":0.0011},{"launches":1,"probability":0.0196},{"launches":2,"probability":0.0894},{"launches":3,"probability":0.2106},{"launches":4,"probability":0.2778},{"launches":5,"probability":0.2204},{"launches":6,"probability":0.1147},{"launches":7,"probability":0.0503},{"launches":8,"probability":0.0125},{"launches":9,"probability":0.0032},{"launches":10,"probability":0.0004}]},"projectKPIs":[{"projectId":"proj-kronos","projectName":"Kronos","expectedNPV":1781.61,"npvPositive":3132.46,"npvNegative":-142.33,"probabilityOfLaunch":0.5875,"expectedLaunchYear":2028,"costToLaunch":149.85,"nominalCostToLaunch":155.0,"peakRevenue":1125.0,"roi":11.89,"productivityIndex":11.95},{"projectId":"proj-rhea","projectName":"Rhea","expectedNPV":574.97,"npvPositive":1591.61,"npvNegative":-47.33,"probabilityOfLaunch":0.3797,"expectedLaunchYear":2030,"costToLaunch":100.33,"nominalCostToLaunch":183.0,"peakRevenue":750.0,"roi":5.73,"productivityIndex":6.17},{"projectId":"proj-oceanus","projectName":"Oceanus","expectedNPV":172.53,"npvPositive":1786.5,"npvNegative":-43.81,"probabilityOfLaunch":0.1182,"expectedLaunchYear":2032,"costToLaunch":77.15,"nominalCostToLaunch":260.0,"peakRevenue":1200.0,"roi":2.24,"productivityIndex":2.81},{"projectId":"proj-hyperion","projectName":"Hyperion","expectedNPV":189.96,"npvPositive":1418.4,"npvNegative":-60.58,"probabilityOfLaunch":0.1694,"expectedLaunchYear":2032,"costToLaunch":117.58,"nominalCostToLaunch":340.0,"peakRevenue":900.0,"roi":1.62,"productivityIndex":2.0},{"projectId":"proj-theia","projectName":"Theia","expectedNPV":440.89,"npvPositive":2933.42,"npvNegative":-81.61,"probabilityOfLaunch":0.1733,"expectedLaunchYear":2033,"costToLaunch":170.37,"nominalCostToLaunch":447.0,"peakRevenue":1350.0,"roi":2.59,"productivityIndex":3.64},{"projectId":"proj-coeus","projectName":"Coeus","expectedNPV":1507.98,"npvPositive":5770.85,"npvNegative":-28.18,"probabilityOfLaunch":0.2649,"expectedLaunchYear":2030,"costToLaunch":92.01,"nominalCostToLaunch":263.0,"peakRevenue":1800.0,"roi":16.39,"productivityIndex":17.72},{"projectId":"proj-atlas","projectName":"Atlas","expectedNPV":1471.51,"npvPositive":2121.05,"npvNegative":-185.55,"probabilityOfLaunch":0.7184,"expectedLaunchYear":2029,"costToLaunch":207.94,"nominalCostToLaunch":210.0,"peakRevenue":1125.0,"roi":7.08,"productivityIndex":7.75},{"projectId":"proj-prometheus","projectName":"Prometheus","expectedNPV":230.53,"npvPositive":2140.69,"npvNegative":-54.14,"probabilityOfLaunch":0.1297,"expectedLaunchYear":2032,"costToLaunch":89.68,"nominalCostToLaunch":268.0,"peakRevenue":1125.0,"roi":2.57,"productivityIndex":3.13},{"projectId":"proj-mnemosyne","projectName":"Mnemosyne","expectedNPV":996.0,"npvPositive":3589.0,"npvNegative":-88.49,"probabilityOfLaunch":0.2949,"expectedLaunchYear":2029,"costToLaunch":163.59,"nominalCostToLaunch":331.45,"peakRevenue":1050.0,"roi":6.09,"productivityIndex":6.46},{"projectId":"proj-phoebe","projectName":"Phoebe","expectedNPV":1278.16,"npvPositive":1422.13,"npvNegative":-11.84,"probabilityOfLaunch":0.8996,"expectedLaunchYear":2027,"costToLaunch":12.0,"nominalCostToLaunch":12.0,"peakRevenue":525.0,"roi":106.51,"productivityIndex":107.91},{"projectId":"proj-themis","projectName":"Themis","expectedNPV":256.86,"npvPositive":2253.4,"npvNegative":-51.8,"probabilityOfLaunch":0.1339,"expectedLaunchYear":2032,"costToLaunch":97.54,"nominalCostToLaunch":326.0,"peakRevenue":1125.0,"roi":2.63,"productivityIndex":3.32},{"projectId":"proj-iapetus","projectName":"Iapetus","expectedNPV":125.9,"npvPositive":1512.67,"npvNegative":-53.77,"probabilityOfLaunch":0.1147,"expectedLaunchYear":2034,"costToLaunch":97.51,"nominalCostToLaunch":309.0,"peakRevenue":950.0,"roi":1.29,"productivityIndex":1.77},{"projectId":"proj-crius","projectName":"Crius","expectedNPV":102.07,"npvPositive":2108.45,"npvNegative":-58.27,"probabilityOfLaunch":0.074,"expectedLaunchYear":2034,"costToLaunch":99.61,"nominalCostToLaunch":385.0,"peakRevenue":1400.0,"roi":1.02,"productivityIndex":1.41},{"projectId":"proj-tethys","projectName":"Tethys","expectedNPV":160.34,"npvPositive":1286.28,"npvNegative":-51.42,"probabilityOfLaunch":0.1583,"expectedLaunchYear":2033,"costToLaunch":97.75,"nominalCostToLaunch":264.0,"peakRevenue":800.0,"roi":1.64,"productivityIndex":2.23}],"timeSeries":{"years":[2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045],"portfolioCashFlow":[-387.18,-464.71,-91.13,220.99,984.06,1750.53,2192.02,2550.34,3040.47,2935.51,2511.48,1902.46,1687.52,1427.52,880.05,498.65,388.47,90.13,0.0,0.0],"portfolioRevenue":[0.0,0.0,116.75,455.14,1334.67,2151.74,2572.72,2940.63,3495.34,3374.15,2886.76,2186.74,1939.68,1640.83,1011.55,573.16,446.52,103.6,0.0,0.0],"portfolioCOGS":[0.0,0.0,5.84,22.76,66.73,107.59,128.64,147.03,174.77,168.71,144.34,109.34,96.98,82.04,50.58,28.66,22.33,5.18,0.0,0.0],"portfolioDevCosts":[387.18,464.71,192.71,174.98,177.1,121.48,46.25,8.01,0.48,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"portfolioMS":[0.0,0.0,9.34,36.41,106.77,172.14,205.82,235.25,279.63,269.93,230.94,174.94,155.17,131.27,80.92,45.85,35.72,8.29,0.0,0.0],"revenueByProject":{"Kronos":[0.0,0.0,18.36,238.67,458.98,660.94,660.94,660.94,660.94,660.94,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Rhea":[0.0,0.0,0.0,0.0,29.66,100.86,172.05,243.25,284.77,284.77,284.77,284.77,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Oceanus":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,16.55,44.92,73.28,101.65,130.02,141.84,141.84,141.84,0.0,0.0,0.0,0.0,0.0],"Hyperion":[0.0,0.0,0.0,0.0,0.0,0.0,9.53,47.64,85.76,123.87,152.46,152.46,152.46,152.46,0.0,0.0,0.0,0.0,0.0,0.0],"Theia":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,136.47,233.96,233.96,233.96,233.96,233.96,233.96,233.96,233.96,0.0,0.0,0.0],"Coeus":[0.0,0.0,0.0,0.0,79.47,317.88,476.82,476.82,476.82,476.82,476.82,476.82,476.82,476.82,0.0,0.0,0.0,0.0,0.0,0.0],"Atlas":[0.0,0.0,0.0,0.0,148.17,309.81,471.45,633.09,794.73,808.2,808.2,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Prometheus":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,36.48,85.12,133.75,145.91,145.91,145.91,145.91,145.91,0.0,0.0,0.0,0.0,0.0],"Mnemosyne":[0.0,0.0,0.0,0.0,283.84,309.64,309.64,309.64,309.64,309.64,309.64,309.64,309.64,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Phoebe":[0.0,0.0,98.39,216.47,334.54,452.61,472.29,472.29,472.29,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Themis":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,43.94,119.25,150.64,150.64,150.64,150.64,150.64,150.64,0.0,0.0,0.0,0.0,0.0],"Iapetus":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,36.32,72.64,108.96,108.96,108.96,108.96,108.96,108.96,0.0,0.0,0.0],"Crius":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.11,41.01,66.91,92.81,103.6,103.6,103.6,103.6,103.6,0.0,0.0],"Tethys":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,24.62,66.84,109.05,126.64,126.64,126.64,126.64,126.64,0.0,0.0,0.0,0.0]},"devCostByProject":{"Kronos":[142.11,7.74,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Rhea":[42.74,37.27,17.93,2.4,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Oceanus":[7.5,14.7,16.27,16.31,16.31,5.35,0.71,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Hyperion":[9.0,25.68,28.19,29.09,22.77,2.85,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Theia":[5.14,9.45,11.3,44.09,47.07,47.07,5.53,0.73,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Coeus":[35.85,35.85,18.94,1.36,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Atlas":[16.67,183.9,6.8,0.57,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Prometheus":[11.25,21.69,21.91,15.86,15.86,2.73,0.38,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Mnemosyne":[73.34,77.28,12.42,0.54,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Phoebe":[10.29,1.71,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Themis":[9.0,18.01,20.36,21.37,21.37,6.69,0.75,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Iapetus":[8.0,10.21,13.0,14.15,16.89,18.26,15.47,1.53,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Crius":[9.63,10.97,11.89,13.65,14.86,16.57,16.57,5.0,0.48,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"Tethys":[6.67,10.25,13.7,15.6,21.97,21.97,6.85,0.75,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]}},"revenueQuartiles":{"years":[2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045],"min":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"p25":[0.0,0.0,109.37,240.62,878.12,1556.25,1650.0,2046.87,2521.87,2250.0,1875.0,1050.0,950.0,800.0,0.0,0.0,0.0,0.0,0.0,0.0],"median":[0.0,0.0,140.62,646.87,1359.37,2059.37,2325.0,2812.5,3450.0,3297.92,2850.0,1950.0,1800.0,1350.0,950.0,0.0,0.0,0.0,0.0,0.0],"p75":[0.0,0.0,140.62,646.87,1659.37,2943.75,3356.25,3731.25,4462.5,4331.25,3825.0,3050.0,2875.0,2550.0,1400.0,950.0,950.0,0.0,0.0,0.0],"max":[0.0,0.0,140.62,646.87,2700.0,4575.0,5665.63,6771.25,8690.62,9356.25,8539.17,8179.17,8629.17,7775.0,6825.0,4500.0,3700.0,1400.0,0.0,0.0]},"decisionTrees":[{"projectId":"proj-kronos","projectName":"Kronos","probabilityOfLaunch":0.585,"expectedLaunchYear":2027.9,"nodes":[{"phase":"PH3","startYear":2026.1,"endYear":2026.8,"cumulativeProbability":1.0,"successProbability":0.65,"failureProbability":0.35,"developmentCost":140,"cumulativeDevCost":140.0,"failureOutcome":{"probability":0.35,"npv":-140.0}},{"phase":"REG","startYear":2026.8,"endYear":2027.9,"cumulativeProbability":0.65,"successProbability":0.9,"failureProbability":0.1,"developmentCost":15,"cumulativeDevCost":155.0,"failureOutcome":{"probability":0.065,"npv":-155.0}}]},{"projectId":"proj-rhea","projectName":"Rhea","probabilityOfLaunch":0.38,"expectedLaunchYear":2029.6,"nodes":[{"phase":"PH2","startYear":2025.6,"endYear":2026.4,"cumulativeProbability":1.0,"successProbability":0.5,"failureProbability":0.5,"developmentCost":42,"cumulativeDevCost":42.0,"failureOutcome":{"probability":0.5,"npv":-42.0}},{"phase":"PH3","startYear":2026.4,"endYear":2028.4,"cumulativeProbability":0.5,"successProbability":0.8,"failureProbability":0.2,"developmentCost":150,"cumulativeDevCost":192.0,"failureOutcome":{"probability":0.1,"npv":-192.0}},{"phase":"REG","startYear":2028.4,"endYear":2029.6,"cumulativeProbability":0.4,"successProbability":0.95,"failureProbability":0.05,"developmentCost":12,"cumulativeDevCost":204.0,"failureOutcome":{"probability":0.02,"npv":-204.0}}]},{"projectId":"proj-oceanus","projectName":"Oceanus","probabilityOfLaunch":0.1229,"expectedLaunchYear":2032.4,"nodes":[{"phase":"PH1","startYear":2026.2,"endYear":2027.2,"cumulativeProbability":1.0,"successProbability":0.7,"failureProbability":0.3,"developmentCost":10,"cumulativeDevCost":10.0,"failureOutcome":{"probability":0.3,"npv":-10.0}},{"phase":"PH2","startYear":2027.2,"endYear":2028.8,"cumulativeProbability":0.7,"successProbability":0.3,"failureProbability":0.7,"developmentCost":35,"cumulativeDevCost":45.0,"failureOutcome":{"probability":0.49,"npv":-45.0}},{"phase":"PH3","startYear":2028.8,"endYear":2031.2,"cumulativeProbability":0.21,"successProbability":0.65,"failureProbability":0.35,"developmentCost":200,"cumulativeDevCost":245.0,"failureOutcome":{"probability":0.0735,"npv":-245.0}},{"phase":"REG","startYear":2031.2,"endYear":2032.4,"cumulativeProbability":0.1365,"successProbability":0.9,"failureProbability":0.1,"developmentCost":15,"cumulativeDevCost":260.0,"failureOutcome":{"probability":0.0136,"npv":-260.0}}]},{"projectId":"proj-hyperion","projectName":"Hyperion","probabilityOfLaunch":0.1701,"expectedLaunchYear":2031.7,"nodes":[{"phase":"PH1","startYear":2026.2,"endYear":2027.1,"cumulativeProbability":1.0,"successProbability":0.6,"failureProbability":0.4,"developmentCost":10,"cumulativeDevCost":10.0,"failureOutcome":{"probability":0.4,"npv":-10.0}},{"phase":"PH2","startYear":2027.1,"endYear":2028.4,"cumulativeProbability":0.6,"successProbability":0.45,"failureProbability":0.55,"developmentCost":60,"cumulativeDevCost":70.0,"failureOutcome":{"probability":0.33,"npv":-70.0}},{"phase":"PH3","startYear":2028.4,"endYear":2030.7,"cumulativeProbability":0.27,"successProbability":0.7,"failureProbability":0.3,"developmentCost":250,"cumulativeDevCost":320.0,"failureOutcome":{"probability":0.081,"npv":-320.0}},{"phase":"REG","startYear":2030.7,"endYear":2031.7,"cumulativeProbability":0.189,"successProbability":0.9,"failureProbability":0.1,"developmentCost":20,"cumulativeDevCost":340.0,"failureOutcome":{"probability":0.0189,"npv":-340.0}}]},{"projectId":"proj-theia","projectName":"Theia","probabilityOfLaunch":0.1733,"expectedLaunchYear":2033.4,"nodes":[{"phase":"PH1","startYear":2026.2,"endYear":2027.4,"cumulativeProbability":1.0,"successProbability":0.7,"failureProbability":0.3,"developmentCost":8,"cumulativeDevCost":8.0,"failureOutcome":{"probability":0.3,"npv":-8.0}},{"phase":"PH2","startYear":2027.4,"endYear":2029.1,"cumulativeProbability":0.7,"successProbability":0.5,"failureProbability":0.5,"developmentCost":27,"cumulativeDevCost":35.0,"failureOutcome":{"probability":0.35,"npv":-35.0}},{"phase":"PH3","startYear":2029.1,"endYear":2032.1,"cumulativeProbability":0.35,"successProbability":0.55,"failureProbability":0.45,"developmentCost":400,"cumulativeDevCost":435.0,"failureOutcome":{"probability":0.1575,"npv":-435.0}},{"phase":"REG","startYear":2032.1,"endYear":2033.4,"cumulativeProbability":0.1925,"successProbability":0.9,"failureProbability":0.1,"developmentCost":12,"cumulativeDevCost":447.0,"failureOutcome":{"probability":0.0192,"npv":-447.0}}]},{"projectId":"proj-coeus","projectName":"Coeus","probabilityOfLaunch":0.2677,"expectedLaunchYear":2029.7,"nodes":[{"phase":"PH2","startYear":2024.8,"endYear":2026.0,"cumulativeProbability":1.0,"successProbability":0.35,"failureProbability":0.65,"developmentCost":40,"cumulativeDevCost":40.0,"failureOutcome":{"probability":0.65,"npv":-40.0}},{"phase":"PH3","startYear":2026.0,"endYear":2028.5,"cumulativeProbability":0.35,"successProbability":0.85,"failureProbability":0.15,"developmentCost":255,"cumulativeDevCost":295.0,"failureOutcome":{"probability":0.0525,"npv":-295.0}},{"phase":"REG","startYear":2028.5,"endYear":2029.7,"cumulativeProbability":0.2975,"successProbability":0.9,"failureProbability":0.1,"developmentCost":8,"cumulativeDevCost":303.0,"failureOutcome":{"probability":0.0297,"npv":-303.0}}]},{"projectId":"proj-atlas","projectName":"Atlas","probabilityOfLaunch":0.72,"expectedLaunchYear":2029.1,"nodes":[{"phase":"PH3","startYear":2026.9,"endYear":2027.9,"cumulativeProbability":1.0,"successProbability":0.8,"failureProbability":0.2,"developmentCost":200,"cumulativeDevCost":200.0,"failureOutcome":{"probability":0.2,"npv":-200.0}},{"phase":"REG","startYear":2027.9,"endYear":2029.1,"cumulativeProbability":0.8,"successProbability":0.9,"failureProbability":0.1,"developmentCost":10,"cumulativeDevCost":210.0,"failureOutcome":{"probability":0.08,"npv":-210.0}}]},{"projectId":"proj-prometheus","projectName":"Prometheus","probabilityOfLaunch":0.1297,"expectedLaunchYear":2032.2,"nodes":[{"phase":"PH1","startYear":2026.2,"endYear":2027.2,"cumulativeProbability":1.0,"successProbability":0.6,"failureProbability":0.4,"developmentCost":15,"cumulativeDevCost":15.0,"failureOutcome":{"probability":0.4,"npv":-15.0}},{"phase":"PH2","startYear":2027.2,"endYear":2028.8,"cumulativeProbability":0.6,"successProbability":0.35,"failureProbability":0.65,"developmentCost":60,"cumulativeDevCost":75.0,"failureOutcome":{"probability":0.39,"npv":-75.0}},{"phase":"PH3","startYear":2028.8,"endYear":2031.1,"cumulativeProbability":0.21,"successProbability":0.65,"failureProbability":0.35,"developmentCost":180,"cumulativeDevCost":255.0,"failureOutcome":{"probability":0.0735,"npv":-255.0}},{"phase":"REG","startYear":2031.1,"endYear":2032.2,"cumulativeProbability":0.1365,"successProbability":0.95,"failureProbability":0.05,"developmentCost":13,"cumulativeDevCost":268.0,"failureOutcome":{"probability":0.0068,"npv":-268.0}}]},{"projectId":"proj-mnemosyne","projectName":"Mnemosyne","probabilityOfLaunch":0.2925,"expectedLaunchYear":2029.1,"nodes":[{"phase":"PH2","startYear":2025.1,"endYear":2026.1,"cumulativeProbability":1.0,"successProbability":0.5,"failureProbability":0.5,"developmentCost":30,"cumulativeDevCost":30.0,"failureOutcome":{"probability":0.5,"npv":-30.0}},{"phase":"PH3","startYear":2026.1,"endYear":2028.1,"cumulativeProbability":0.5,"successProbability":0.65,"failureProbability":0.35,"developmentCost":308.95,"cumulativeDevCost":338.95,"failureOutcome":{"probability":0.175,"npv":-338.95}},{"phase":"REG","startYear":2028.1,"endYear":2029.1,"cumulativeProbability":0.325,"successProbability":0.9,"failureProbability":0.1,"developmentCost":20,"cumulativeDevCost":358.95,"failureOutcome":{"probability":0.0325,"npv":-358.95}}]},{"projectId":"proj-phoebe","projectName":"Phoebe","probabilityOfLaunch":0.9,"expectedLaunchYear":2027.2,"nodes":[{"phase":"REG","startYear":2026.0,"endYear":2027.2,"cumulativeProbability":1.0,"successProbability":0.9,"failureProbability":0.1,"developmentCost":12,"cumulativeDevCost":12.0,"failureOutcome":{"probability":0.1,"npv":-12.0}}]},{"projectId":"proj-themis","projectName":"Themis","probabilityOfLaunch":0.1323,"expectedLaunchYear":2032.4,"nodes":[{"phase":"PH1","startYear":2026.2,"endYear":2027.2,"cumulativeProbability":1.0,"successProbability":0.6,"failureProbability":0.4,"developmentCost":12,"cumulativeDevCost":12.0,"failureOutcome":{"probability":0.4,"npv":-12.0}},{"phase":"PH2","startYear":2027.2,"endYear":2028.8,"cumulativeProbability":0.6,"successProbability":0.35,"failureProbability":0.65,"developmentCost":50,"cumulativeDevCost":62.0,"failureOutcome":{"probability":0.39,"npv":-62.0}},{"phase":"PH3","startYear":2028.8,"endYear":2031.2,"cumulativeProbability":0.21,"successProbability":0.7,"failureProbability":0.3,"developmentCost":250,"cumulativeDevCost":312.0,"failureOutcome":{"probability":0.063,"npv":-312.0}},{"phase":"REG","startYear":2031.2,"endYear":2032.4,"cumulativeProbability":0.147,"successProbability":0.9,"failureProbability":0.1,"developmentCost":14,"cumulativeDevCost":326.0,"failureOutcome":{"probability":0.0147,"npv":-326.0}}]},{"projectId":"proj-iapetus","projectName":"Iapetus","probabilityOfLaunch":0.1123,"expectedLaunchYear":2034.0,"nodes":[{"phase":"PC","startYear":2026.0,"endYear":2027.5,"cumulativeProbability":1.0,"successProbability":0.8,"failureProbability":0.2,"developmentCost":12,"cumulativeDevCost":12.0,"failureOutcome":{"probability":0.2,"npv":-12.0}},{"phase":"PH1","startYear":2027.5,"endYear":2028.7,"cumulativeProbability":0.8,"successProbability":0.65,"failureProbability":0.35,"developmentCost":18,"cumulativeDevCost":30.0,"failureOutcome":{"probability":0.28,"npv":-30.0}},{"phase":"PH2","startYear":2028.7,"endYear":2030.3,"cumulativeProbability":0.52,"successProbability":0.4,"failureProbability":0.6,"developmentCost":45,"cumulativeDevCost":75.0,"failureOutcome":{"probability":0.312,"npv":-75.0}},{"phase":"PH3","startYear":2030.3,"endYear":2032.8,"cumulativeProbability":0.208,"successProbability":0.6,"failureProbability":0.4,"developmentCost":220,"cumulativeDevCost":295.0,"failureOutcome":{"probability":0.0832,"npv":-295.0}},{"phase":"REG","startYear":2032.8,"endYear":2034.0,"cumulativeProbability":0.1248,"successProbability":0.9,"failureProbability":0.1,"developmentCost":14,"cumulativeDevCost":309.0,"failureOutcome":{"probability":0.0125,"npv":-309.0}}]},{"projectId":"proj-crius","projectName":"Crius","probabilityOfLaunch":0.078,"expectedLaunchYear":2034.4,"nodes":[{"phase":"PC","startYear":2026.1,"endYear":2027.4,"cumulativeProbability":1.0,"successProbability":0.75,"failureProbability":0.25,"developmentCost":14,"cumulativeDevCost":14.0,"failureOutcome":{"probability":0.25,"npv":-14.0}},{"phase":"PH1","startYear":2027.4,"endYear":2028.7,"cumulativeProbability":0.75,"successProbability":0.6,"failureProbability":0.4,"developmentCost":20,"cumulativeDevCost":34.0,"failureOutcome":{"probability":0.3,"npv":-34.0}},{"phase":"PH2","startYear":2028.7,"endYear":2030.6,"cumulativeProbability":0.45,"successProbability":0.35,"failureProbability":0.65,"developmentCost":55,"cumulativeDevCost":89.0,"failureOutcome":{"probability":0.2925,"npv":-89.0}},{"phase":"PH3","startYear":2030.6,"endYear":2033.2,"cumulativeProbability":0.1575,"successProbability":0.55,"failureProbability":0.45,"developmentCost":280,"cumulativeDevCost":369.0,"failureOutcome":{"probability":0.0709,"npv":-369.0}},{"phase":"REG","startYear":2033.2,"endYear":2034.4,"cumulativeProbability":0.0866,"successProbability":0.9,"failureProbability":0.1,"developmentCost":16,"cumulativeDevCost":385.0,"failureOutcome":{"probability":0.0087,"npv":-385.0}}]},{"projectId":"proj-tethys","projectName":"Tethys","probabilityOfLaunch":0.1566,"expectedLaunchYear":2033.4,"nodes":[{"phase":"PC","startYear":2026.2,"endYear":2027.4,"cumulativeProbability":1.0,"successProbability":0.85,"failureProbability":0.15,"developmentCost":10,"cumulativeDevCost":10.0,"failureOutcome":{"probability":0.15,"npv":-10.0}},{"phase":"PH1","startYear":2027.4,"endYear":2028.4,"cumulativeProbability":0.85,"successProbability":0.7,"failureProbability":0.3,"developmentCost":14,"cumulativeDevCost":24.0,"failureOutcome":{"probability":0.255,"npv":-24.0}},{"phase":"PH2","startYear":2028.4,"endYear":2029.9,"cumulativeProbability":0.595,"successProbability":0.45,"failureProbability":0.55,"developmentCost":38,"cumulativeDevCost":62.0,"failureOutcome":{"probability":0.3272,"npv":-62.0}},{"phase":"PH3","startYear":2029.9,"endYear":2032.2,"cumulativeProbability":0.2677,"successProbability":0.65,"failureProbability":0.35,"developmentCost":190,"cumulativeDevCost":252.0,"failureOutcome":{"probability":0.0937,"npv":-252.0}},{"phase":"REG","startYear":2032.2,"endYear":2033.4,"cumulativeProbability":0.174,"successProbability":0.9,"failureProbability":0.1,"developmentCost":12,"cumulativeDevCost":264.0,"failureOutcome":{"probability":0.0174,"npv":-264.0}}]}]}};

// Theme constants
const PHASE_COLORS = { PC: '#60a5fa', PH1: '#6c8cff', PH2: '#a78bfa', PH3: '#f472b6', REG: '#34d399', MARKET: '#fbbf24' };
const COLORS = ['#60a5fa', '#6c8cff', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#f87171', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4'];

// Formatting helpers
const fmt = (v, d = 0) => v >= 1000 ? (v / 1000).toFixed(d) + 'B' : v.toFixed(d);
const fmtM = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v.toFixed(0)}M`;
const fmtPct = (v) => (v * 100).toFixed(1) + '%';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const decToDate = (d) => {
  const yr = Math.floor(d);
  const mo = Math.round((d - yr) * 12);
  const dd = '01';
  return dd + ' ' + (mo < MONTHS.length ? MONTHS[mo] : 'Dec') + ' ' + yr;
};
const fmtDate = (iso) => {
  if (!iso) return '-';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;
  return String(d).padStart(2, '0') + ' ' + MONTHS[m] + ' ' + parts[0];
};

// Theme definitions
const THEMES = {
  dark: {
    bg: '#0f1117', bgCard: '#1a1d27', bgHover: '#242836', border: '#2e3345',
    text: '#e4e8f1', textMuted: '#8b92a8', textFaint: '#636b80',
    svgBg: '#0f1117', nodeBox: '#242836',
    positive: '#34d399', negative: '#f87171', accent: '#6c8cff',
  },
  light: {
    bg: '#f5f6fa', bgCard: '#ffffff', bgHover: '#f0f1f5', border: '#d4d8e0',
    text: '#1a1d27', textMuted: '#5c6477', textFaint: '#8b92a8',
    svgBg: '#f9fafb', nodeBox: '#ffffff',
    positive: '#059669', negative: '#dc2626', accent: '#4f6ddb',
  }
};
const ThemeContext = createContext(THEMES.dark);
const useTheme = () => useContext(ThemeContext);

// Style objects (dark defaults — will be overridden via theme where components use useTheme)
const card = { background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '8px', padding: '16px' };
const sub_ = { fontSize: '12px', color: 'var(--t-muted)', marginTop: '4px' };
const ttStyle = { background: 'var(--t-card)', border: '1px solid var(--t-border)', borderRadius: '4px', padding: '8px', fontSize: '12px' };
// Themed style helpers
const tCard = (t) => ({ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '16px' });
const tSub = (t) => ({ fontSize: '12px', color: t.textMuted, marginTop: '4px' });
const tTt = (t) => ({ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '8px', fontSize: '12px' });
const tSelect = (t) => ({ background: t.bgCard, color: t.text, border: `1px solid ${t.border}`, padding: '8px', borderRadius: '4px' });

// PhaseBadge component
const PhaseBadge = ({ phase }) => {
  const color = PHASE_COLORS[phase] || '#8b92a8';
  return <span style={{ display: 'inline-block', background: color, color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{phase}</span>;
};

// KPICard component
const KPICard = ({ label, value, subtext, onClick }) => {
  const t = useTheme();
  return (
    <div style={{ ...card, padding: '10px 12px', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ fontSize: '11px', color: t.textMuted, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: t.text }}>{value}</div>
      {subtext && <div style={{ fontSize: '10px', color: t.textMuted, marginTop: '2px' }}>{subtext}</div>}
    </div>
  );
};

// ProjectsTable component
const ProjectsTable = ({ projects, kpis, onRowClick }) => {
  const kpiMap = {};
  kpis.forEach(k => kpiMap[k.projectId] = k);
  const maxNPV = Math.max(...kpis.map(k => k.expectedNPV));
  const maxPeakRev = Math.max(...kpis.map(k => k.peakRevenue));
  const maxROI = Math.max(...kpis.map(k => k.roi));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--t-text)' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--t-border)' }}>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Project</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Phase</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>eNPV</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>eNPV+</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>eNPV-</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>P(Launch)</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Expected Launch</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Peak Revenue</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>RA Dev Cost</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>ROI</th>
            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>PI</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const kpi = kpiMap[p.id];
            return (
              <tr key={p.id} onClick={() => onRowClick(p.id)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--t-border)' }}>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{kpi.expectedNPV === maxNPV ? '★ ' : ''}{p.name}</td>
                <td style={{ padding: '12px' }}><PhaseBadge phase={p.attributes.currentPhase} /></td>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{fmtM(kpi.expectedNPV)}</td>
                <td style={{ padding: '12px', color: '#34d399' }}>{fmtM(kpi.npvPositive)}</td>
                <td style={{ padding: '12px', color: '#f87171' }}>{fmtM(kpi.npvNegative)}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '16px', background: 'var(--t-border)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: (kpi.probabilityOfLaunch * 100) + '%', height: '100%', background: '#60a5fa' }} />
                    </div>
                    <span style={{ color: 'var(--t-text)' }}>{fmtPct(kpi.probabilityOfLaunch)}</span>
                  </div>
                </td>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{decToDate(kpi.expectedLaunchYear)}</td>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{fmtM(kpi.peakRevenue)}{kpi.peakRevenue === maxPeakRev ? ' ☆' : ''}</td>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{fmtM(kpi.costToLaunch)}</td>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{kpi.roi.toFixed(1)}x{kpi.roi === maxROI ? ' ◆' : ''}</td>
                <td style={{ padding: '12px', color: 'var(--t-text)' }}>{kpi.productivityIndex.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Dashboard component
const Dashboard = ({ kpis, projects, timeSeries, launchDist, onSelectProject }) => {
  const [launchMode, setLaunchMode] = useState('exactly');
  const cashFlowData = useMemo(() => timeSeries.years.map((yr, idx) => {
    const obj = { year: yr, revenue: timeSeries.portfolioRevenue[idx] };
    Object.keys(timeSeries.revenueByProject).forEach(pn => {
      obj[pn] = timeSeries.revenueByProject[pn][idx];
    });
    return obj;
  }), [timeSeries]);

  const launchData = useMemo(() => {
    const raw = launchDist.map(d => ({ ...d }));
    return launchMode === 'exactly'
      ? raw.map(d => ({ launches: d.launches + '', probability: d.probability }))
      : raw.map((d, i) => ({ launches: d.launches + '', probability: raw.slice(i).reduce((s, x) => s + x.probability, 0) }));
  }, [launchDist, launchMode]);

  // Launch chart: project boxes stacked by expected launch year
  const { launchYearMap, launchYears } = useMemo(() => {
    const m = {};
    kpis.forEach(k => {
      const yr = Math.round(k.expectedLaunchYear);
      if (!m[yr]) m[yr] = [];
      m[yr].push({ name: k.projectName, prob: k.probabilityOfLaunch });
    });
    return { launchYearMap: m, launchYears: Object.keys(m).map(Number).sort((a, b) => a - b) };
  }, [kpis]);
  const lcMinY = Math.min(...launchYears), lcMaxY = Math.max(...launchYears);
  const lcW = 700, lcH = 220, lcPad = { l: 50, r: 20, t: 20, b: 30 };
  const lcSpan = Math.max(1, lcMaxY - lcMinY + 1); // +1 for padding on both sides
  const lcXScale = yr => lcPad.l + ((yr - lcMinY + 0.5) / lcSpan) * (lcW - lcPad.l - lcPad.r);
  const lcBarW = Math.min(60, (lcW - lcPad.l - lcPad.r) / lcSpan * 0.7);

  // Compute portfolio-level metrics
  const portfolioROI = DATA.simulation.portfolioKPIs.expectedNPV / Math.max(1, kpis.reduce((s, k) => s + k.costToLaunch, 0));
  const peakRevIdx = timeSeries.portfolioRevenue.indexOf(Math.max(...timeSeries.portfolioRevenue));
  const peakSalesYear = timeSeries.years[peakRevIdx];
  const peakSalesVal = timeSeries.portfolioRevenue[peakRevIdx];
  // Breakeven: first year cumulative CF turns positive
  let cumCFDash = 0;
  let breakevenYear = '--';
  for (let bi = 0; bi < timeSeries.years.length; bi++) {
    cumCFDash += timeSeries.portfolioCashFlow[bi];
    if (cumCFDash > 0) { breakevenYear = timeSeries.years[bi]; break; }
  }

  const [activeKPI, setActiveKPI] = useState(null);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '24px' }}>
        <div onClick={() => setActiveKPI(activeKPI === 'enpv' ? null : 'enpv')} style={{ cursor: 'pointer' }}>
          <KPICard label="Portfolio eNPV" value={fmtM(DATA.simulation.portfolioKPIs.expectedNPV)} subtext="Percentiles" />
        </div>
        <KPICard label="Expected Launches" value={DATA.simulation.portfolioKPIs.expectedLaunches.toFixed(2)} subtext={`of ${projects.length}`} />
        <KPICard label="Portfolio ROI" value={portfolioROI.toFixed(1) + 'x'} subtext="eNPV / RA cost" />
        <KPICard label="Peak Year Sales" value={fmtM(peakSalesVal)} subtext={`in ${peakSalesYear}`} />
        <KPICard label="Peak Sales Year" value={String(peakSalesYear)} />
        <KPICard label="Breakeven Year" value={String(breakevenYear)} />
      </div>

      {/* NPV percentiles popup when clicking Portfolio eNPV */}
      {activeKPI === 'enpv' && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ color: 'var(--t-text)', margin: 0 }}>NPV Percentiles</h4>
            <button onClick={() => setActiveKPI(null)} style={{ background: 'none', border: 'none', color: 'var(--t-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(DATA.simulation.portfolioKPIs.npvPercentiles).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 6, background: 'var(--t-hover)', fontSize: 12, flex: 1 }}>
                <div style={{ color: 'var(--t-muted)', fontSize: 11 }}>{k.toUpperCase()}</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4, color: 'var(--t-text)' }}>{fmtM(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...card, marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Portfolio Revenue by Project</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
            <XAxis dataKey="year" stroke="var(--t-muted)" />
            <YAxis stroke="var(--t-muted)" />
            <Tooltip contentStyle={ttStyle} />
            <Legend />
            {Object.keys(timeSeries.revenueByProject).map((proj, i) => (
              <Area key={proj} type="monotone" dataKey={proj} stackId="1" fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: 'var(--t-text)', margin: 0 }}>Launch Distribution</h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {['exactly', 'atLeast'].map(m => (
              <button key={m} onClick={() => setLaunchMode(m)} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 4, border: '1px solid var(--t-border)', background: launchMode === m ? 'var(--t-border)' : 'transparent', color: launchMode === m ? 'var(--t-text)' : 'var(--t-muted)', cursor: 'pointer' }}>
                {m === 'exactly' ? 'Exactly X' : 'At least X'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={launchData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
            <XAxis dataKey="launches" stroke="var(--t-muted)" label={{ value: 'Number of launches', position: 'insideBottom', offset: -5, fill: 'var(--t-muted)', fontSize: 11 }} />
            <YAxis stroke="var(--t-muted)" tickFormatter={v => (v * 100).toFixed(0) + '%'} />
            <Tooltip contentStyle={ttStyle} formatter={v => (v * 100).toFixed(1) + '%'} />
            <Bar dataKey="probability" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ ...card, marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 12px 0' }}>Expected Launch Timeline</h3>
        <div style={sub_}>Project launch probability by expected year</div>
        <svg viewBox={`0 0 ${lcW} ${lcH}`} style={{ width: '100%', maxHeight: lcH }}>
          {launchYears.map(yr => (
            <g key={yr}>
              <line x1={lcXScale(yr)} y1={lcPad.t} x2={lcXScale(yr)} y2={lcH - lcPad.b} stroke="var(--t-border)" strokeWidth={1} />
              <text x={lcXScale(yr)} y={lcH - 8} textAnchor="middle" fill="var(--t-muted)" fontSize={11}>{yr}</text>
            </g>
          ))}
          {launchYears.map(yr => {
            const projs = launchYearMap[yr];
            let stackY = lcH - lcPad.b;
            return projs.map((p, pi) => {
              const h = p.prob * (lcH - lcPad.t - lcPad.b);
              stackY -= h;
              const ci = kpis.findIndex(k => k.projectName === p.name);
              return (
                <g key={`${yr}-${pi}`}>
                  <rect x={lcXScale(yr) - lcBarW / 2} y={stackY} width={lcBarW} height={h} rx={3} fill={COLORS[ci % COLORS.length]} fillOpacity={0.7} stroke={COLORS[ci % COLORS.length]} strokeWidth={1} />
                  {h > 12 && <text x={lcXScale(yr)} y={stackY + h / 2 + 4} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={600}>{p.name}</text>}
                </g>
              );
            });
          })}
          <text x={10} y={lcPad.t + 10} fill="var(--t-muted)" fontSize={10}>P(Launch)</text>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <g key={v}>
              <text x={lcPad.l - 5} y={lcH - lcPad.b - v * (lcH - lcPad.t - lcPad.b) + 4} textAnchor="end" fill="var(--t-muted)" fontSize={10}>{(v * 100).toFixed(0)}%</text>
              <line x1={lcPad.l - 2} y1={lcH - lcPad.b - v * (lcH - lcPad.t - lcPad.b)} x2={lcW - lcPad.r} y2={lcH - lcPad.b - v * (lcH - lcPad.t - lcPad.b)} stroke="var(--t-border)" strokeWidth={0.5} />
            </g>
          ))}
        </svg>
      </div>

      <div style={{ ...card }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Project KPIs</h3>
        <ProjectsTable projects={projects} kpis={kpis} onRowClick={onSelectProject} />
      </div>
    </div>
  );
};

// Projects tab with multiple detail views
const ProjectsTab = ({ projects, kpis, onSelectProject }) => {
  const [attrView, setAttrView] = useState('attributes');
  const timeSeries = DATA.simulation.timeSeries;

  // KPI map for quick lookup
  const kpiMap = useMemo(() => { const m = {}; kpis.forEach(k => m[k.projectId] = k); return m; }, [kpis]);

  // ----- Chart 1: Launch Year vs eNPV, bubble size = P(Launch) -----
  const bubbleData1 = useMemo(() => kpis.map((k, i) => ({
    name: k.projectName, x: k.expectedLaunchYear, y: k.expectedNPV,
    r: Math.max(6, k.probabilityOfLaunch * 40), pol: k.probabilityOfLaunch, color: COLORS[i % COLORS.length]
  })), [kpis]);

  // ----- Chart 2: Reward/Risk vs Remaining Investment, size = P(Launch) -----
  const bubbleData2 = useMemo(() => kpis.map((k, i) => ({
    name: k.projectName,
    x: k.costToLaunch, // remaining RA investment
    y: k.npvNegative !== 0 ? Math.abs(k.npvPositive / k.npvNegative) : 0, // reward/risk
    r: Math.max(6, k.probabilityOfLaunch * 40), pol: k.probabilityOfLaunch, color: COLORS[i % COLORS.length]
  })), [kpis]);

  // ----- Chart 3: Efficient Frontier — cumulative cost vs cumulative eNPV ordered by ROI -----
  const frontierData = useMemo(() => {
    const sorted = [...kpis].sort((a, b) => b.roi - a.roi);
    let cumCost = 0, cumENPV = 0;
    const pts = [{ name: 'None', cumCost: 0, cumENPV: 0 }];
    sorted.forEach((k, i) => {
      // Next year cost for this project
      const nextYrCost = timeSeries.devCostByProject[k.projectName]?.[0] || 0;
      cumCost += nextYrCost;
      cumENPV += k.expectedNPV;
      pts.push({ name: k.projectName, cumCost, cumENPV, roi: k.roi, color: COLORS[kpis.indexOf(k) % COLORS.length] });
    });
    return pts;
  }, [kpis, timeSeries]);

  // ----- Chart 4: Tornado — impact on portfolio ROI of terminate vs succeed -----
  const tornadoData = useMemo(() => {
    const totalCost = kpis.reduce((s, k) => s + k.costToLaunch, 0);
    const totalENPV = DATA.simulation.portfolioKPIs.expectedNPV;
    const baseROI = totalENPV / Math.max(1, totalCost);
    return kpis.map((k, i) => {
      // Terminate: remove project from portfolio
      const roiExclude = (totalENPV - k.expectedNPV) / Math.max(1, totalCost - k.costToLaunch);
      // Succeed to launch: replace eNPV with npvPositive, costToLaunch stays
      const roiSucceed = (totalENPV - k.expectedNPV + k.npvPositive) / Math.max(1, totalCost);
      return {
        name: k.projectName, baseROI, roiExclude, roiSucceed,
        deltaExclude: roiExclude - baseROI,
        deltaSucceed: roiSucceed - baseROI,
        color: COLORS[i % COLORS.length]
      };
    }).sort((a, b) => a.deltaExclude - b.deltaExclude); // Most negative exclusion impact at top
  }, [kpis]);

  // Bubble chart SVG helper
  const BubbleChart = ({ data, xLabel, yLabel, title, subtitle, xFmt, yFmt }) => {
    const pad = { l: 70, r: 30, t: 10, b: 40 };
    const w = 600, h = 340;
    const xVals = data.map(d => d.x), yVals = data.map(d => d.y);
    const xMin = Math.min(...xVals), xMax = Math.max(...xVals);
    const yMin = Math.min(0, Math.min(...yVals)), yMax = Math.max(...yVals) * 1.1;
    const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;
    const sx = v => pad.l + ((v - xMin) / xRange) * (w - pad.l - pad.r);
    const sy = v => pad.t + ((yMax - v) / yRange) * (h - pad.t - pad.b);
    const fmtX = xFmt || (v => v.toFixed(0));
    const fmtY = yFmt || (v => fmtM(v));
    return (
      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 4px 0', fontSize: 14 }}>{title}</h3>
        {subtitle && <div style={sub_}>{subtitle}</div>}
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxHeight: h, marginTop: 8 }}>
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const yy = pad.t + t * (h - pad.t - pad.b);
            const val = yMax - t * yRange;
            return <g key={t}><line x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} stroke="var(--t-border)" strokeWidth={0.5} /><text x={pad.l - 6} y={yy + 3} textAnchor="end" fill="var(--t-muted)" fontSize={9}>{fmtY(val)}</text></g>;
          })}
          {data.map((d, i) => {
            const xx = sx(d.x);
            if (i === 0 || Math.abs(d.x - data[i - 1].x) > xRange * 0.05) {
              return <text key={'xl' + i} x={xx} y={h - 6} textAnchor="middle" fill="var(--t-muted)" fontSize={9}>{fmtX(d.x)}</text>;
            }
            return null;
          })}
          <text x={w / 2} y={h - 0} textAnchor="middle" fill="var(--t-muted)" fontSize={10}>{xLabel}</text>
          <text x={12} y={h / 2} textAnchor="middle" fill="var(--t-muted)" fontSize={10} transform={`rotate(-90, 12, ${h / 2})`}>{yLabel}</text>
          {/* Bubbles */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={sx(d.x)} cy={sy(d.y)} r={d.r} fill={d.color} fillOpacity={0.6} stroke={d.color} strokeWidth={1.5} />
              <text x={sx(d.x)} y={sy(d.y) - d.r - 3} textAnchor="middle" fill="var(--t-text)" fontSize={9} fontWeight={600}>{d.name}</text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ ...card, marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Projects</h3>
        <ProjectsTable projects={projects} kpis={kpis} onRowClick={onSelectProject} />
      </div>

      <div style={{ ...card }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['attributes', 'startDates', 'durations', 'probabilities', 'costs', 'commercial'].map(v => (
            <button
              key={v}
              onClick={() => setAttrView(v)}
              style={{
                background: attrView === v ? 'var(--t-border)' : 'transparent',
                color: 'var(--t-text)',
                border: '1px solid var(--t-border)',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {v === 'attributes' ? 'Attributes' : v === 'startDates' ? 'Phase Start Dates' : v === 'durations' ? 'Phase Durations' : v === 'probabilities' ? 'Phase Probabilities' : v === 'costs' ? 'Phase Costs' : 'Commercial'}
            </button>
          ))}
        </div>

        {attrView === 'attributes' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--t-text)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--t-border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Project</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>TA</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Modality</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Source</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Indication</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>MoA</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--t-border)' }}>
                    <td style={{ padding: '12px', color: 'var(--t-text)' }}>{p.name}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.attributes.therapeuticArea}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.attributes.modality}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.attributes.source}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.attributes.indication}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.attributes.modeOfAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {attrView === 'startDates' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--t-text)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--t-border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Project</th>
                  {['PC', 'PH1', 'PH2', 'PH3', 'REG'].map(ph => (
                    <th key={ph} style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>{ph}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--t-border)' }}>
                    <td style={{ padding: '12px', color: 'var(--t-text)' }}>{p.name}</td>
                    {['PC', 'PH1', 'PH2', 'PH3', 'REG'].map(ph => {
                      const phaseData = p.phases.find(x => x.name === ph);
                      return <td key={ph} style={{ padding: '12px', color: phaseData?.isActual ? '#34d399' : 'var(--t-muted)' }}>
                        {phaseData ? fmtDate(phaseData.startDate) : '-'}
                        {phaseData && <span style={{ fontSize: 10, marginLeft: 4, color: phaseData.isActual ? '#34d399' : '#fbbf24' }}>{phaseData.isActual ? '(A)' : '(P)'}</span>}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {['durations', 'probabilities', 'costs'].includes(attrView) && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--t-text)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--t-border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Project</th>
                  {['PC', 'PH1', 'PH2', 'PH3', 'REG'].map(ph => (
                    <th key={ph} style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>{ph}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--t-border)' }}>
                    <td style={{ padding: '12px', color: 'var(--t-text)' }}>{p.name}</td>
                    {['PC', 'PH1', 'PH2', 'PH3', 'REG'].map(ph => {
                      const phaseData = p.phases.find(x => x.name === ph);
                      let value = '-';
                      if (phaseData) {
                        if (attrView === 'durations') value = phaseData.durationMonths + ' mo';
                        else if (attrView === 'probabilities') value = fmtPct(phaseData.probabilityOfSuccess);
                        else if (attrView === 'costs') value = '$' + phaseData.cost.toFixed(0) + 'M';
                      }
                      return <td key={ph} style={{ padding: '12px', color: 'var(--t-muted)' }}>{value}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {attrView === 'commercial' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--t-text)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--t-border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Project</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Peak Sales</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>Time to Peak</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>COGS%</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>M&S%</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)', fontWeight: '500' }}>LOE Year</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--t-border)' }}>
                    <td style={{ padding: '12px', color: 'var(--t-text)' }}>{p.name}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>${p.commercial.peakYearSales}M</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.commercial.timeToPeakYears} yrs</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{fmtPct(p.commercial.cogsPercent)}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{fmtPct(p.commercial.marketingAndSalesPercent)}</td>
                    <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{p.commercial.lossOfExclusivityYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Visual Analytics ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 16, marginTop: 16 }}>
        {/* Chart 1: Launch Year vs eNPV */}
        <BubbleChart data={bubbleData1} xLabel="Expected Launch Year" yLabel="eNPV ($M)" title="Launch Timing vs Value" subtitle="Bubble size = probability of launch" />

        {/* Chart 2: Reward/Risk vs Remaining Investment */}
        <BubbleChart data={bubbleData2} xLabel="RA Investment to Launch ($M)" yLabel="Reward/Risk (eNPV+ / |eNPV-|)" title="Reward–Risk vs Investment" subtitle="Bubble size = probability of launch" xFmt={v => '$' + v.toFixed(0) + 'M'} yFmt={v => v.toFixed(1) + 'x'} />

        {/* Chart 3: Efficient Frontier */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ color: 'var(--t-text)', margin: '0 0 4px 0', fontSize: 14 }}>Efficient Frontier</h3>
          <div style={sub_}>Projects added by ROI (highest first). X = cumulative next-year cost, Y = cumulative portfolio eNPV.</div>
          {(() => {
            const pad = { l: 70, r: 30, t: 10, b: 40 };
            const w = 600, h = 340;
            const xMax = Math.max(...frontierData.map(d => d.cumCost)) * 1.1 || 1;
            const yMax = Math.max(...frontierData.map(d => d.cumENPV)) * 1.1 || 1;
            const sx = v => pad.l + (v / xMax) * (w - pad.l - pad.r);
            const sy = v => pad.t + ((yMax - v) / yMax) * (h - pad.t - pad.b);
            return (
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxHeight: h, marginTop: 8 }}>
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                  const yy = pad.t + t * (h - pad.t - pad.b);
                  return <g key={t}><line x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} stroke="var(--t-border)" strokeWidth={0.5} /><text x={pad.l - 6} y={yy + 3} textAnchor="end" fill="var(--t-muted)" fontSize={9}>{fmtM(yMax * (1 - t))}</text></g>;
                })}
                {/* Frontier line */}
                <polyline points={frontierData.map(d => `${sx(d.cumCost)},${sy(d.cumENPV)}`).join(' ')} fill="none" stroke="#6c8cff" strokeWidth={2} strokeOpacity={0.5} />
                {/* Points */}
                {frontierData.map((d, i) => (
                  <g key={i}>
                    <circle cx={sx(d.cumCost)} cy={sy(d.cumENPV)} r={i === 0 ? 4 : 7} fill={d.color || '#6c8cff'} fillOpacity={0.7} stroke={d.color || '#6c8cff'} strokeWidth={1.5} />
                    {i > 0 && <text x={sx(d.cumCost)} y={sy(d.cumENPV) - 10} textAnchor="middle" fill="var(--t-text)" fontSize={9} fontWeight={600}>{d.name}</text>}
                    {i > 0 && <text x={sx(d.cumCost)} y={sy(d.cumENPV) + 14} textAnchor="middle" fill="var(--t-muted)" fontSize={8}>ROI {d.roi.toFixed(1)}x</text>}
                  </g>
                ))}
                <text x={w / 2} y={h - 0} textAnchor="middle" fill="var(--t-muted)" fontSize={10}>Cumulative Next-Year Cost ($M)</text>
                <text x={12} y={h / 2} textAnchor="middle" fill="var(--t-muted)" fontSize={10} transform={`rotate(-90, 12, ${h / 2})`}>Cumulative eNPV ($M)</text>
              </svg>
            );
          })()}
        </div>

        {/* Chart 4: Tornado — Portfolio ROI Impact */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ color: 'var(--t-text)', margin: '0 0 4px 0', fontSize: 14 }}>Project Impact on Portfolio ROI</h3>
          <div style={sub_}>Baseline ROI: {tornadoData[0]?.baseROI.toFixed(1)}x — bars show change if project is excluded (left) or succeeds to launch (right)</div>
          {(() => {
            const pad = { l: 90, r: 30, t: 10, b: 30 };
            const w = 600, barH = 24, gap = 6;
            const h = pad.t + tornadoData.length * (barH + gap) + pad.b;
            const allDeltas = tornadoData.flatMap(d => [d.deltaExclude, d.deltaSucceed]);
            const maxAbs = Math.max(Math.abs(Math.min(...allDeltas)), Math.abs(Math.max(...allDeltas))) * 1.15 || 1;
            const cx = pad.l + (w - pad.l - pad.r) / 2; // baseline center
            const scale = v => (v / maxAbs) * ((w - pad.l - pad.r) / 2);
            return (
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxHeight: h, marginTop: 8 }}>
                {/* Baseline line */}
                <line x1={cx} y1={pad.t} x2={cx} y2={h - pad.b} stroke="var(--t-muted)" strokeWidth={1} strokeDasharray="3 2" />
                <text x={cx} y={h - 8} textAnchor="middle" fill="var(--t-muted)" fontSize={9}>Baseline ({tornadoData[0]?.baseROI.toFixed(1)}x)</text>
                {/* Axis labels */}
                <text x={pad.l} y={h - 8} textAnchor="start" fill="#f87171" fontSize={9}>Exclude</text>
                <text x={w - pad.r} y={h - 8} textAnchor="end" fill="#34d399" fontSize={9}>Succeed to Launch</text>
                {tornadoData.map((d, i) => {
                  const y = pad.t + i * (barH + gap);
                  const exW = scale(d.deltaExclude);
                  const suW = scale(d.deltaSucceed);
                  const sameDir = (exW >= 0 && suW >= 0) || (exW <= 0 && suW <= 0);
                  const halfH = barH / 2;
                  return (
                    <g key={i}>
                      <text x={pad.l - 6} y={y + barH / 2 + 4} textAnchor="end" fill="var(--t-text)" fontSize={10} fontWeight={500}>{d.name}</text>
                      {sameDir ? (
                        <>
                          {/* Stacked: succeed on top, exclude below */}
                          <rect x={suW > 0 ? cx : cx + suW} y={y} width={Math.abs(suW)} height={halfH} rx={2} fill="#34d399" fillOpacity={0.6} />
                          <text x={cx + suW + (suW > 0 ? 4 : -4)} y={y + halfH / 2 + 3} textAnchor={suW > 0 ? 'start' : 'end'} fill="#34d399" fontSize={8} fontWeight={600}>{d.deltaSucceed >= 0 ? '+' : ''}{d.deltaSucceed.toFixed(2)}x</text>
                          <rect x={exW > 0 ? cx : cx + exW} y={y + halfH} width={Math.abs(exW)} height={halfH} rx={2} fill="#f87171" fillOpacity={0.6} />
                          <text x={cx + exW + (exW > 0 ? 4 : -4)} y={y + halfH + halfH / 2 + 3} textAnchor={exW > 0 ? 'start' : 'end'} fill="#f87171" fontSize={8} fontWeight={600}>{d.deltaExclude >= 0 ? '+' : ''}{d.deltaExclude.toFixed(2)}x</text>
                        </>
                      ) : (
                        <>
                          {/* Normal tornado: bars go opposite directions */}
                          <rect x={exW < 0 ? cx + exW : cx} y={y} width={Math.abs(exW)} height={barH} rx={3} fill="#f87171" fillOpacity={0.6} />
                          <text x={cx + exW + (exW < 0 ? -4 : 4)} y={y + barH / 2 + 3} textAnchor={exW < 0 ? 'end' : 'start'} fill="#f87171" fontSize={8} fontWeight={600}>{d.deltaExclude >= 0 ? '+' : ''}{d.deltaExclude.toFixed(2)}x</text>
                          <rect x={suW > 0 ? cx : cx + suW} y={y} width={Math.abs(suW)} height={barH} rx={3} fill="#34d399" fillOpacity={0.6} />
                          <text x={cx + suW + (suW > 0 ? 4 : -4)} y={y + barH / 2 + 3} textAnchor={suW > 0 ? 'start' : 'end'} fill="#34d399" fontSize={8} fontWeight={600}>{d.deltaSucceed >= 0 ? '+' : ''}{d.deltaSucceed.toFixed(2)}x</text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// CashFlow tab
const CashFlowTab = ({ timeSeries }) => {
  const data = timeSeries.years.map((yr, i) => ({
    year: yr,
    revenue: timeSeries.portfolioRevenue[i],
    devCosts: timeSeries.portfolioDevCosts[i],
    cogs: timeSeries.portfolioCOGS[i],
    ms: timeSeries.portfolioMS[i],
    net: timeSeries.portfolioCashFlow[i]
  }));

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ ...card }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Portfolio Cash Flow</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
            <XAxis dataKey="year" stroke="var(--t-muted)" />
            <YAxis stroke="var(--t-muted)" />
            <Tooltip contentStyle={ttStyle} />
            <Legend />
            <Bar dataKey="revenue" fill="#34d399" name="Revenue" />
            <Bar dataKey="devCosts" fill="#f87171" name="Dev Costs" />
            <Bar dataKey="cogs" fill="#fb923c" name="COGS" />
            <Bar dataKey="ms" fill="#fbbf24" name="M&S" />
            <Line type="monotone" dataKey="net" stroke="#60a5fa" name="Net Cash Flow" yAxisId="right" strokeWidth={2} />
            <YAxis yAxisId="right" orientation="right" stroke="var(--t-muted)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// RevenueAnalysis tab
const RevenueAnalysisTab = ({ revenueQuartiles }) => {
  const boxData = revenueQuartiles.years.map((yr, i) => ({
    year: yr,
    min: revenueQuartiles.min[i],
    p25: revenueQuartiles.p25[i],
    median: revenueQuartiles.median[i],
    p75: revenueQuartiles.p75[i],
    max: revenueQuartiles.max[i]
  }));

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ ...card }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Revenue Distribution</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={boxData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
            <XAxis dataKey="year" stroke="var(--t-muted)" />
            <YAxis stroke="var(--t-muted)" />
            <Tooltip contentStyle={ttStyle} />
            <Line type="monotone" dataKey="min" stroke="var(--t-muted)" strokeWidth={1} name="Min" />
            <Line type="monotone" dataKey="p25" stroke="#60a5fa" strokeWidth={2} name="P25" />
            <Line type="monotone" dataKey="median" stroke="#34d399" strokeWidth={2} name="Median" />
            <Line type="monotone" dataKey="p75" stroke="#a78bfa" strokeWidth={2} name="P75" />
            <Line type="monotone" dataKey="max" stroke="#f87171" strokeWidth={1} name="Max" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Reusable P&L table component
const PLTable = ({ rows, title }) => {
  const activeYears = rows.filter(d => d.revenue > 0.1 || d.devCosts > 0.1);
  const displayRows = activeYears.length > 0 ? activeYears : rows.slice(0, 10);
  const total = displayRows.reduce((a, d) => ({ revenue: a.revenue + d.revenue, cogs: a.cogs + d.cogs, grossProfit: a.grossProfit + d.grossProfit, ms: a.ms + d.ms, devCosts: a.devCosts + d.devCosts, ebit: a.ebit + d.ebit }), { revenue: 0, cogs: 0, grossProfit: 0, ms: 0, devCosts: 0, ebit: 0 });
  const hdr = { padding: '10px 12px', textAlign: 'right', color: 'var(--t-muted)', fontSize: 11, borderBottom: '2px solid var(--t-border)' };
  const tc = { padding: '8px 12px', textAlign: 'right', fontSize: 12, borderBottom: '1px solid #1e2130', fontVariantNumeric: 'tabular-nums' };
  const lines = [
    { k: 'revenue', l: 'Revenue', color: '#34d399', bold: false },
    { k: 'cogs', l: '  COGS', color: '#f87171', neg: true },
    { k: 'grossProfit', l: 'Gross Profit', color: 'var(--t-text)', bold: true },
    { k: 'ms', l: '  Marketing & Sales', color: '#fbbf24', neg: true },
    { k: 'devCosts', l: '  Development Costs', color: '#f87171', neg: true },
    { k: 'ebit', l: 'EBIT', color: null, bold: true, isEbit: true },
  ];
  return (
    <div style={{ ...card, overflowX: 'auto' }}>
      {title && <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>{title}</h3>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: 'var(--t-text)' }}>
        <thead><tr>
          <th style={{ ...hdr, textAlign: 'left', minWidth: 160 }}>Line Item</th>
          {displayRows.map(d => <th key={d.year} style={hdr}>{d.year}</th>)}
          <th style={{ ...hdr, fontWeight: 700 }}>Total</th>
        </tr></thead>
        <tbody>
          {lines.map(li => (
            <tr key={li.k} style={li.bold ? { background: '#161821' } : {}}>
              <td style={{ ...tc, textAlign: 'left', fontWeight: li.bold ? 700 : 400, color: li.color || 'var(--t-text)', borderTop: li.isEbit ? '2px solid var(--t-border)' : undefined }}>{li.l}</td>
              {displayRows.map(d => {
                const v = d[li.k];
                const c = li.isEbit ? (v >= 0 ? '#34d399' : '#f87171') : (li.neg ? '#f87171' : (li.color || 'var(--t-text)'));
                return <td key={d.year} style={{ ...tc, color: c, fontWeight: li.bold ? 600 : 400, borderTop: li.isEbit ? '2px solid var(--t-border)' : undefined }}>{li.neg && v > 0 ? `(${v.toFixed(1)})` : v.toFixed(1)}</td>;
              })}
              <td style={{ ...tc, fontWeight: 700, color: li.isEbit ? (total[li.k] >= 0 ? '#34d399' : '#f87171') : (li.color || 'var(--t-text)'), borderTop: li.isEbit ? '2px solid var(--t-border)' : undefined }}>{li.neg && total[li.k] > 0 ? `(${total[li.k].toFixed(1)})` : total[li.k].toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Build P&L data for a project
const buildProjectPL = (projName, timeSeries, project) => {
  const years = timeSeries.years;
  const rev = timeSeries.revenueByProject[projName] || [];
  const dev = timeSeries.devCostByProject[projName] || [];
  const cp = project?.commercial?.cogsPercent || 0.05;
  const mp = project?.commercial?.marketingAndSalesPercent || 0.08;
  return years.map((yr, i) => {
    const r = rev[i] || 0, d = dev[i] || 0, c = r * cp, m = r * mp;
    return { year: yr, revenue: r, cogs: c, grossProfit: r - c, ms: m, devCosts: d, ebit: r - c - m - d };
  });
};

// PLStatement tab with portfolio + project selector
const PLStatementTab = ({ timeSeries, projects }) => {
  const [view, setView] = useState('portfolio');

  const portfolioPL = useMemo(() => timeSeries.years.map((yr, i) => {
    const r = timeSeries.portfolioRevenue[i], c = timeSeries.portfolioCOGS[i], m = timeSeries.portfolioMS[i], d = timeSeries.portfolioDevCosts[i];
    return { year: yr, revenue: r, cogs: c, grossProfit: r - c, ms: m, devCosts: d, ebit: r - c - m - d };
  }), [timeSeries]);

  const selProj = projects.find(p => p.id === view);
  const rows = selProj ? buildProjectPL(selProj.name, timeSeries, selProj) : portfolioPL;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={view} onChange={e => setView(e.target.value)} style={{ padding: '8px 14px', background: 'var(--t-hover)', border: '1px solid var(--t-border)', borderRadius: 8, color: 'var(--t-text)', fontSize: 14 }}>
          <option value="portfolio">Portfolio (Total)</option>
          {projects.filter(p => p.included).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <PLTable rows={rows} title={selProj ? `${selProj.name} P&L` : 'Portfolio P&L Statement'} />
    </div>
  );
};

// Gantt tab
const GanttTab = ({ projects, onSelectProject, decisionTrees }) => {
  const [showHistory, setShowHistory] = useState(true);
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const nowYear = 2026.25; // Apr 2026
  const pxPerYear = 80;
  const rowH = 28;

  const allPhases = [];
  projects.forEach((p, pi) => {
    p.phases.forEach((ph) => {
      if (!showHistory && ph.isActual) return;
      const start = new Date(ph.startDate).getFullYear() + (new Date(ph.startDate).getMonth() / 12);
      const end = start + (ph.durationMonths / 12);
      allPhases.push({
        projectId: p.id, projectName: p.name, phaseName: ph.name,
        start, end, color: PHASE_COLORS[ph.name], cost: ph.cost,
        pos: ph.probabilityOfSuccess, isActual: ph.isActual,
        startDate: ph.startDate, durationMonths: ph.durationMonths, pi
      });
    });
  });

  const allStarts = allPhases.map(p => p.start);
  const allEnds = allPhases.map(p => p.end);
  const minYear = Math.floor(Math.min(...allStarts, nowYear));
  const maxYear = Math.ceil(Math.max(...allEnds, nowYear + 2));
  const years = []; for (let y = minYear; y <= maxYear; y++) years.push(y);
  const svgW = 120 + (maxYear - minYear) * pxPerYear;
  const svgH = projects.length * rowH + 60;

  // Get launch dates from decision trees
  const launchMap = {};
  (decisionTrees || []).forEach(t => { launchMap[t.projectId] = t.expectedLaunchYear; });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <button onClick={() => setShowHistory(!showHistory)} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 6, border: '1px solid var(--t-border)', background: showHistory ? 'var(--t-border)' : 'transparent', color: 'var(--t-text)', cursor: 'pointer' }}>
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--t-muted)', flexWrap: 'wrap' }}>
          {Object.entries(PHASE_COLORS).filter(([k]) => ['PC','PH1','PH2','PH3','REG'].includes(k)).map(([k, c]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: 0.7, display: 'inline-block' }} />{k}
            </span>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#34d399', display: 'inline-block' }} />Launch
          </span>
        </div>
      </div>
      <div style={{ ...card, overflowX: 'auto' }}>
        <svg width={svgW} height={svgH} style={{ background: 'var(--t-bg)', display: 'block' }}>
          {/* Year grid */}
          {years.map(yr => {
            const x = 120 + (yr - minYear) * pxPerYear;
            return (<g key={yr}><line x1={x} y1={30} x2={x} y2={svgH} stroke="var(--t-border)" strokeWidth={0.5} /><text x={x} y={20} textAnchor="middle" fill="var(--t-muted)" fontSize={11}>{yr}</text></g>);
          })}
          {/* Now line */}
          <line x1={120 + (nowYear - minYear) * pxPerYear} y1={25} x2={120 + (nowYear - minYear) * pxPerYear} y2={svgH} stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 2" />
          <text x={120 + (nowYear - minYear) * pxPerYear} y={14} textAnchor="middle" fill="#fbbf24" fontSize={9}>Now</text>
          {/* Project rows */}
          {projects.map((p, pi) => {
            const cy = 40 + pi * rowH + rowH / 2;
            const phases = allPhases.filter(ph => ph.projectId === p.id);
            const launch = launchMap[p.id];
            return (
              <g key={p.id}>
                <text x={112} y={cy + 4} textAnchor="end" fill="#6c8cff" fontSize={12} fontWeight={600} style={{ cursor: 'pointer' }} onClick={() => onSelectProject && onSelectProject(p.id)}>{p.name}</text>
                {phases.map((ph, i) => {
                  const x1 = 120 + (ph.start - minYear) * pxPerYear;
                  const w = Math.max(2, (ph.end - ph.start) * pxPerYear);
                  const key = `${ph.projectId}-${ph.phaseName}`;
                  return (
                    <g key={i} onClick={() => setHoveredPhase(hoveredPhase === key ? null : key)} style={{ cursor: 'pointer' }}>
                      <rect x={x1} y={cy - 9} width={w} height={18} rx={3} fill={ph.color} fillOpacity={ph.isActual ? 0.5 : 0.8} stroke={hoveredPhase === key ? '#fff' : ph.color} strokeWidth={hoveredPhase === key ? 2 : 1} />
                      {w > 28 && <text x={x1 + w / 2} y={cy + 4} textAnchor="middle" fill="#fff" fontSize={9} fontWeight={600}>{ph.phaseName}</text>}
                    </g>
                  );
                })}
                {launch && <circle cx={120 + (launch - minYear) * pxPerYear} cy={cy} r={4} fill="#34d399" stroke="#0f1117" strokeWidth={1.5} />}
                {launch && <text x={120 + (launch - minYear) * pxPerYear + 8} y={cy + 4} fill="var(--t-muted)" fontSize={9}>{decToDate(launch)}</text>}
              </g>
            );
          })}
          {/* Tooltip layer — rendered last so it's on top of all bars */}
          {hoveredPhase && (() => {
            const hp = allPhases.find(ph => `${ph.projectId}-${ph.phaseName}` === hoveredPhase);
            if (!hp) return null;
            const hpIdx = projects.findIndex(p => p.id === hp.projectId);
            const hpCy = 40 + hpIdx * rowH + rowH / 2;
            const hpX = 120 + (hp.start - minYear) * pxPerYear;
            return (
              <foreignObject x={hpX} y={hpCy + 12} width={190} height={70}>
                <div style={{ background: 'var(--t-card)', border: '1.5px solid var(--t-border)', borderRadius: 6, padding: '7px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                  <div style={{ color: 'var(--t-text)', fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{hp.phaseName}: {hp.durationMonths}mo, ${hp.cost}M</div>
                  <div style={{ color: 'var(--t-muted)', fontSize: 10, marginBottom: 2 }}>POS: {(hp.pos * 100).toFixed(0)}% | {hp.isActual ? 'Actual' : 'Planned'}</div>
                  <div style={{ color: 'var(--t-muted)', fontSize: 10 }}>{fmtDate(hp.startDate)}</div>
                </div>
              </foreignObject>
            );
          })()}
        </svg>
      </div>
    </div>
  );
};

// Pipeline tab — phase-column layout with color-by attribute
const PIPELINE_PHASES = ['PC', 'PH1', 'PH2', 'PH3', 'REG', 'MARKET'];
const COLOR_BY_OPTIONS = [
  { key: 'phase', label: 'Phase' },
  { key: 'therapeuticArea', label: 'Therapeutic Area' },
  { key: 'modality', label: 'Modality' },
  { key: 'source', label: 'Source' },
  { key: 'indication', label: 'Indication' },
  { key: 'modeOfAction', label: 'Mode of Action' },
];
const ATTR_PALETTES = {
  therapeuticArea: ['#6c8cff', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#a78bfa', '#60a5fa', '#e879f9'],
  modality: ['#34d399', '#f472b6', '#6c8cff', '#fbbf24', '#fb923c', '#a78bfa'],
  source: ['#6c8cff', '#fbbf24', '#f472b6', '#34d399'],
  indication: ['#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#6c8cff', '#fb923c', '#60a5fa', '#e879f9'],
  modeOfAction: ['#fb923c', '#6c8cff', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#60a5fa', '#e879f9'],
};
const PipelineTab = ({ projects, kpis, onSelectProject }) => {
  const [colorBy, setColorBy] = useState('phase');
  const kpiMap = {};
  kpis.forEach(k => kpiMap[k.projectId] = k);

  // Build color map for current attribute
  const colorMap = useMemo(() => {
    if (colorBy === 'phase') return PHASE_COLORS;
    const vals = [...new Set(projects.map(p => p.attributes[colorBy]).filter(Boolean))];
    const pal = ATTR_PALETTES[colorBy] || ATTR_PALETTES.therapeuticArea;
    const m = {};
    vals.forEach((v, i) => { m[v] = pal[i % pal.length]; });
    return m;
  }, [colorBy, projects]);

  const getBrickColor = (p) => {
    if (colorBy === 'phase') return PHASE_COLORS[p.attributes.currentPhase] || '#8b92a8';
    return colorMap[p.attributes[colorBy]] || '#8b92a8';
  };

  // Group projects by current phase
  const grouped = {};
  PIPELINE_PHASES.forEach(ph => { grouped[ph] = []; });
  projects.forEach(p => {
    const cp = p.attributes.currentPhase;
    if (grouped[cp]) grouped[cp].push(p);
  });

  // Legend entries
  const legendEntries = colorBy === 'phase'
    ? PIPELINE_PHASES.map(ph => ({ label: ph, color: PHASE_COLORS[ph] }))
    : [...new Set(projects.map(p => p.attributes[colorBy]).filter(Boolean))].map(v => ({ label: v, color: colorMap[v] }));

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <label style={{ color: 'var(--t-muted)', fontSize: 13 }}>Color by:</label>
        <select value={colorBy} onChange={e => setColorBy(e.target.value)} style={{ background: 'var(--t-card)', color: 'var(--t-text)', border: '1px solid var(--t-border)', padding: '6px 10px', borderRadius: '4px', fontSize: 13 }}>
          {COLOR_BY_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginLeft: 8 }}>
          {legendEntries.map(le => (
            <span key={le.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--t-muted)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: le.color, display: 'inline-block' }} />
              {le.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PIPELINE_PHASES.length}, minmax(160px, 1fr))`, gap: 0, minWidth: PIPELINE_PHASES.length * 160 }}>
          {/* Phase column headers */}
          {PIPELINE_PHASES.map(ph => (
            <div key={ph} style={{ padding: '10px 12px', background: 'var(--t-card)', borderBottom: `3px solid ${PHASE_COLORS[ph]}`, textAlign: 'center', fontWeight: 700, fontSize: 13, color: PHASE_COLORS[ph], letterSpacing: 1 }}>
              {ph}
              <span style={{ display: 'block', fontSize: 10, color: 'var(--t-muted)', fontWeight: 400, marginTop: 2 }}>{grouped[ph].length} project{grouped[ph].length !== 1 ? 's' : ''}</span>
            </div>
          ))}
          {/* Phase column bodies */}
          {PIPELINE_PHASES.map(ph => (
            <div key={ph + '_body'} style={{ padding: '8px 6px', borderRight: '1px solid var(--t-border)', minHeight: 120 }}>
              {grouped[ph].map(p => {
                const kpi = kpiMap[p.id];
                const bc = getBrickColor(p);
                return (
                  <div key={p.id} onClick={() => onSelectProject && onSelectProject(p.id)} style={{ background: 'var(--t-hover)', border: `1.5px solid ${bc}`, borderRadius: 6, padding: '8px 10px', marginBottom: 8, cursor: onSelectProject ? 'pointer' : 'default', transition: 'border-color 0.15s' }}>
                    <div style={{ fontWeight: 600, color: 'var(--t-text)', fontSize: 12, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--t-muted)', marginBottom: 2 }}>{p.attributes.indication}</div>
                    <div style={{ fontSize: 10, color: 'var(--t-muted)', marginBottom: 4 }}>{p.attributes.modeOfAction}</div>
                    {kpi && <div style={{ fontSize: 10, color: '#34d399' }}>{fmtM(kpi.expectedNPV)} • P(L) {fmtPct(kpi.probabilityOfLaunch)}</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Decision Trees tab
const DecisionTreesTab = ({ projects, decisionTrees }) => {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id);
  const tree = decisionTrees.find(t => t.projectId === selectedProject);
  const projName = projects.find(p => p.id === selectedProject)?.name || '';

  if (!tree) return <div style={{ padding: '20px', color: 'var(--t-muted)' }}>No decision tree data</div>;

  const kpi = DATA.simulation.projectKPIs.find(k => k.projectId === selectedProject);
  const xSpacing = 170;
  // Backward induction eNPV
  const launchNPV = kpi?.npvPositive || 0;
  const nodeENPVs = new Array(tree.nodes.length).fill(0);
  for (let i = tree.nodes.length - 1; i >= 0; i--) {
    const n = tree.nodes[i];
    const successVal = i === tree.nodes.length - 1 ? launchNPV : nodeENPVs[i + 1];
    const failVal = n.failureOutcome?.npv || -n.cumulativeDevCost;
    nodeENPVs[i] = n.successProbability * successVal + n.failureProbability * failVal;
  }
  const svgW = Math.max(900, (tree.nodes.length + 2) * xSpacing);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ background: 'var(--t-card)', color: 'var(--t-text)', border: '1px solid var(--t-border)', padding: '8px', borderRadius: '4px' }}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {kpi && <span style={{ color: 'var(--t-muted)', fontSize: 13 }}>P(Launch): {fmtPct(kpi.probabilityOfLaunch)} | eNPV: <span style={{ color: kpi.expectedNPV >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>{fmtM(kpi.expectedNPV)}</span></span>}
      </div>
      <div style={{ ...card, overflowX: 'auto' }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>{projName} Decision Tree</h3>
        <svg width={svgW + 40} height={320} style={{ background: 'var(--t-bg)', display: 'block' }}>
          <g transform="translate(70, 130)">
            {/* START node */}
            <rect x={-50} y={-30} width={100} height={60} rx={8} fill="var(--t-hover)" stroke="#6c8cff" strokeWidth={2} />
            <text x={0} y={-10} textAnchor="middle" fontSize={12} fill="#6c8cff" fontWeight="bold">START</text>
            <text x={0} y={6} textAnchor="middle" fontSize={9} fill="var(--t-muted)">P(here) = 100%</text>
            <text x={0} y={20} textAnchor="middle" fontSize={9} fill="#6c8cff">eNPV: {fmtM(nodeENPVs[0])}</text>
            {tree.nodes.map((node, i) => {
              const x = (i + 1) * xSpacing;
              const pc = PHASE_COLORS[node.phase] || '#8b92a8';
              return (
                <g key={i}>
                  {/* Arrow with POS */}
                  <line x1={i * xSpacing + 50} y1={0} x2={x - 55} y2={0} stroke="var(--t-border)" strokeWidth={2} />
                  <polygon points={`${x - 55},${-4} ${x - 48},0 ${x - 55},4`} fill="var(--t-border)" />
                  <text x={(i * xSpacing + 50 + x - 55) / 2} y={-8} textAnchor="middle" fontSize={9} fill="#34d399" fontWeight={600}>POS {fmtPct(node.successProbability)}</text>
                  {/* Node box */}
                  <rect x={x - 55} y={-35} width={110} height={70} rx={8} fill="var(--t-hover)" stroke={pc} strokeWidth={2} />
                  <text x={x} y={-18} textAnchor="middle" fontSize={12} fill={pc} fontWeight="bold">{node.phase}</text>
                  <text x={x} y={-4} textAnchor="middle" fontSize={9} fill="var(--t-muted)">Cumul P: {fmtPct(node.cumulativeProbability)}</text>
                  <text x={x} y={10} textAnchor="middle" fontSize={9} fill="var(--t-muted)">Cost: ${node.developmentCost}M</text>
                  <text x={x} y={24} textAnchor="middle" fontSize={9} fill="#6c8cff">eNPV: {nodeENPVs[i] != null ? fmtM(nodeENPVs[i]) : '--'}</text>
                  {/* Failure branch */}
                  {node.failureOutcome && node.failureProbability > 0 && (
                    <g>
                      <line x1={x} y1={35} x2={x} y2={65} stroke="rgba(248,113,113,0.5)" strokeWidth={1} />
                      <rect x={x - 45} y={65} width={90} height={42} rx={6} fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" strokeWidth={1} />
                      <text x={x} y={80} textAnchor="middle" fontSize={9} fill="#f87171" fontWeight={600}>Fail ({fmtPct(node.failureProbability)})</text>
                      <text x={x} y={93} textAnchor="middle" fontSize={8} fill="#f87171">Cumul P: {fmtPct(node.failureOutcome.probability)}</text>
                      <text x={x} y={104} textAnchor="middle" fontSize={8} fill="#f87171">NPV: {fmtM(node.failureOutcome.npv)}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {/* LAUNCH node */}
            {(() => { const lx = (tree.nodes.length + 1) * xSpacing; return (
              <g>
                <line x1={tree.nodes.length * xSpacing + 55} y1={0} x2={lx - 50} y2={0} stroke="var(--t-border)" strokeWidth={2} />
                <rect x={lx - 50} y={-30} width={100} height={60} rx={8} fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth={2} />
                <text x={lx} y={-10} textAnchor="middle" fontSize={12} fill="#34d399" fontWeight="bold">LAUNCH</text>
                <text x={lx} y={6} textAnchor="middle" fontSize={9} fill="#34d399">P: {fmtPct(tree.probabilityOfLaunch)}</text>
                <text x={lx} y={20} textAnchor="middle" fontSize={9} fill="#34d399">{decToDate(tree.expectedLaunchYear)}</text>
              </g>
            ); })()}
          </g>
        </svg>
      </div>
    </div>
  );
};

// Portfolio Decision Tree tab — full binary decision tree with selectable depth (1-5 levels)
const PortfolioDecisionTreeTab = ({ decisionTrees }) => {
  const [maxLevels, setMaxLevels] = useState(5);
  // Collect all gate events chronologically
  const allGates = [];
  decisionTrees.forEach(tree => {
    tree.nodes.forEach(node => {
      allGates.push({ year: node.endYear, project: tree.projectName, phase: node.phase, pos: node.successProbability, projectId: tree.projectId, devCost: node.developmentCost, cumDevCost: node.cumulativeDevCost });
    });
  });
  allGates.sort((a, b) => a.year - b.year);
  const first5 = allGates.slice(0, maxLevels);
  const N = first5.length; // up to maxLevels

  // Compute per-project backward-induction eNPV at each gate node
  // For each project's decision tree, compute what the project eNPV is BEFORE each gate,
  // and what it becomes AFTER passing that gate (or failing).
  const projGateValues = useMemo(() => {
    const vals = {}; // vals[projectId] = { preGate: { phase: eNPV_before }, postPass: { phase: eNPV_after_pass }, failValue: { phase: npv_on_fail } }
    decisionTrees.forEach(tree => {
      const kpi = DATA.simulation.projectKPIs.find(k => k.projectId === tree.projectId);
      const launchNPV = kpi?.npvPositive || 0;
      const nodes = tree.nodes;
      // Backward-induction eNPV at each node index
      const nodeENPVs = new Array(nodes.length).fill(0);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const successVal = i === nodes.length - 1 ? launchNPV : nodeENPVs[i + 1];
        const failVal = n.failureOutcome?.npv || -n.cumulativeDevCost;
        nodeENPVs[i] = n.successProbability * successVal + n.failureProbability * failVal;
      }
      const preGate = {}, postPass = {}, failValue = {};
      nodes.forEach((n, i) => {
        preGate[n.phase] = nodeENPVs[i]; // eNPV before this gate decision
        postPass[n.phase] = i === nodes.length - 1 ? launchNPV : nodeENPVs[i + 1]; // eNPV if gate passes
        failValue[n.phase] = n.failureOutcome?.npv || -n.cumulativeDevCost; // NPV if project fails here
      });
      vals[tree.projectId] = { preGate, postPass, failValue, baseENPV: nodeENPVs[0] };
    });
    return vals;
  }, [decisionTrees]);

  // Portfolio base eNPV = sum of all project eNPVs (from backward induction)
  const portfolioBase = useMemo(() => {
    return Object.values(projGateValues).reduce((s, v) => s + v.baseENPV, 0);
  }, [projGateValues]);

  // Build binary tree — at each gate, success increases project value, failure reduces it
  const treeNodes = useMemo(() => {
    const totalNodes = Math.pow(2, N + 1) - 1;
    const nodes = new Array(totalNodes).fill(null);
    // projState tracks current eNPV contribution per project
    const initState = {};
    Object.entries(projGateValues).forEach(([pid, v]) => { initState[pid] = v.baseENPV; });
    nodes[0] = { depth: 0, prob: 1, portfolioENPV: portfolioBase, projState: { ...initState }, failedProjects: new Set() };

    for (let d = 0; d < N; d++) {
      const gate = first5[d];
      const pid = gate.projectId;
      const gv = projGateValues[pid];
      const levelStart = Math.pow(2, d) - 1;
      const levelSize = Math.pow(2, d);
      for (let i = 0; i < levelSize; i++) {
        const ni = levelStart + i;
        const parent = nodes[ni];
        if (!parent) continue;
        const leftIdx = 2 * ni + 1;
        const rightIdx = 2 * ni + 2;

        const alreadyFailed = parent.failedProjects.has(pid);

        // Success: project passes this gate → its contribution increases to postPass value
        const successState = { ...parent.projState };
        let successENPV = parent.portfolioENPV;
        if (!alreadyFailed && gv) {
          const oldVal = parent.projState[pid] || 0;
          const newVal = gv.postPass[gate.phase] || oldVal;
          successState[pid] = newVal;
          successENPV = parent.portfolioENPV + (newVal - oldVal);
        }
        nodes[leftIdx] = {
          depth: d + 1, prob: parent.prob * gate.pos,
          portfolioENPV: successENPV, projState: successState,
          failedProjects: new Set(parent.failedProjects),
          edgeProb: gate.pos, edgeType: 'pass'
        };

        // Fail: project fails at this gate → its contribution drops to fail value
        const failState = { ...parent.projState };
        const failSet = new Set(parent.failedProjects);
        let failENPV = parent.portfolioENPV;
        if (!alreadyFailed && gv) {
          const oldVal = parent.projState[pid] || 0;
          const newVal = gv.failValue[gate.phase] || 0;
          failState[pid] = newVal;
          failENPV = parent.portfolioENPV + (newVal - oldVal);
          failSet.add(pid);
        }
        nodes[rightIdx] = {
          depth: d + 1, prob: parent.prob * (1 - gate.pos),
          portfolioENPV: failENPV, projState: failState,
          failedProjects: failSet,
          edgeProb: 1 - gate.pos, edgeType: 'fail'
        };
      }
    }
    return nodes;
  }, [first5, N, portfolioBase, projGateValues]);

  // Layout
  const headerH = 70; // space for decision headers
  const colW = 220, nodeH = 42, padLeft = 130, padRight = 40;
  const leafCount = Math.pow(2, N);
  const rowH = Math.max(nodeH + 6, 48);
  const treeTop = headerH + 20;
  const svgH = treeTop + leafCount * rowH + 20;
  const svgW = padLeft + (N + 1) * colW + padRight;

  // Y positions — leaves evenly spaced, parents at midpoint
  const yPos = new Array(treeNodes.length).fill(0);
  const leafStart = Math.pow(2, N) - 1;
  for (let i = 0; i < leafCount; i++) {
    yPos[leafStart + i] = treeTop + i * rowH + rowH / 2;
  }
  for (let d = N - 1; d >= 0; d--) {
    const lvlStart = Math.pow(2, d) - 1;
    for (let i = 0; i < Math.pow(2, d); i++) {
      const ni = lvlStart + i;
      yPos[ni] = (yPos[2 * ni + 1] + yPos[2 * ni + 2]) / 2;
    }
  }

  // X center for each depth column
  const colX = (d) => padLeft + d * colW + colW / 2;

  // Color scale for portfolio eNPV
  const allENPVs = treeNodes.filter(Boolean).map(n => n.portfolioENPV);
  const minE = Math.min(...allENPVs), maxE = Math.max(...allENPVs);
  const colorScale = (v) => {
    if (maxE === minE) return '#6c8cff';
    const t = (v - minE) / (maxE - minE);
    if (t < 0.5) { const s = t * 2; return `rgb(${Math.round(248 - 120 * s)}, ${Math.round(113 + 67 * s)}, ${Math.round(113 - 13 * s)})`; }
    const s = (t - 0.5) * 2;
    return `rgb(${Math.round(128 - 76 * s)}, ${Math.round(180 + 31 * s)}, ${Math.round(100 + 53 * s)})`;
  };

  // Cumulative investment at each gate
  const cumInvestment = first5.reduce((acc, g, i) => { acc.push((acc[i - 1] || 0) + g.devCost); return acc; }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ color: 'var(--t-text)', margin: '0 0 4px 0' }}>Portfolio Decision Tree</h3>
            <div style={sub_}>First {N} chronological gate decisions — {leafCount} scenario outcomes. Each node shows the likelihood of reaching it and the resulting portfolio eNPV.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--t-muted)' }}>Levels:</span>
            {[1, 2, 3, 4, 5].map(lv => (
              <button key={lv} onClick={() => setMaxLevels(lv)} style={{
                width: 28, height: 28, borderRadius: '50%', border: lv === maxLevels ? '2px solid var(--t-accent)' : '1px solid var(--t-border)',
                background: lv === maxLevels ? 'var(--t-accent)' : 'var(--t-hover)', color: lv === maxLevels ? '#fff' : 'var(--t-text)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{lv}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...card, overflowX: 'auto', overflowY: 'auto', maxHeight: '85vh', padding: 0 }}>
        <svg width={svgW} height={svgH} style={{ display: 'block', background: 'var(--t-bg)' }}>
          {/* Column dividers and decision headers */}
          {first5.map((g, i) => {
            const x = padLeft + i * colW;
            const cx = colX(i);
            const pc = PHASE_COLORS[g.phase] || '#8b92a8';
            return (
              <g key={'hdr' + i}>
                {/* Vertical divider */}
                <line x1={x} y1={headerH - 5} x2={x} y2={svgH} stroke="var(--t-border)" strokeWidth={1} strokeDasharray="4 3" />
                {/* Decision header */}
                <text x={cx} y={16} textAnchor="middle" fontSize={12} fill={pc} fontWeight={700}>Decision {i + 1}: {g.project} {g.phase}</text>
                <text x={cx} y={32} textAnchor="middle" fontSize={10} fill="var(--t-muted)">{decToDate(g.year)} — POS {fmtPct(g.pos)}</text>
                <text x={cx} y={46} textAnchor="middle" fontSize={10} fill="var(--t-muted)">Phase cost: ${g.devCost}M — Cumul. invest: ${cumInvestment[i]}M</text>
              </g>
            );
          })}
          {/* Outcome column divider & header */}
          <line x1={padLeft + N * colW} y1={headerH - 5} x2={padLeft + N * colW} y2={svgH} stroke="var(--t-border)" strokeWidth={1} strokeDasharray="4 3" />
          <text x={colX(N)} y={16} textAnchor="middle" fontSize={12} fill="var(--t-muted)" fontWeight={700}>Outcomes</text>
          <text x={colX(N)} y={32} textAnchor="middle" fontSize={10} fill="var(--t-muted)">{leafCount} scenarios</text>

          {/* Edges with pass/fail labels and probability */}
          {treeNodes.map((node, ni) => {
            if (!node || node.depth >= N) return null;
            const gate = first5[node.depth];
            const leftIdx = 2 * ni + 1, rightIdx = 2 * ni + 2;
            const x1 = colX(node.depth) + 55;
            const x2 = colX(node.depth + 1) - 55;
            const midXs = (x1 + x2) / 2;
            const midYs = (yPos[ni] + yPos[leftIdx]) / 2;
            const midYf = (yPos[ni] + yPos[rightIdx]) / 2;
            const lw = Math.max(1, Math.min(4, node.prob * 6));
            return (
              <g key={'e' + ni}>
                {/* Pass edge */}
                <line x1={x1} y1={yPos[ni]} x2={x2} y2={yPos[leftIdx]} stroke="#34d399" strokeWidth={lw} strokeOpacity={0.6} />
                <text x={midXs} y={midYs - 4} textAnchor="middle" fontSize={8} fill="#34d399" fontWeight={600}>Pass {fmtPct(gate.pos)}</text>
                {/* Fail edge */}
                <line x1={x1} y1={yPos[ni]} x2={x2} y2={yPos[rightIdx]} stroke="#f87171" strokeWidth={lw} strokeOpacity={0.5} />
                <text x={midXs} y={midYf - 4} textAnchor="middle" fontSize={8} fill="#f87171" fontWeight={600}>Fail {fmtPct(1 - gate.pos)}</text>
              </g>
            );
          })}

          {/* Nodes */}
          {treeNodes.map((node, ni) => {
            if (!node) return null;
            const cx = colX(node.depth);
            const y = yPos[ni];
            const isLeaf = node.depth === N;
            const isRoot = ni === 0;
            const bw = isLeaf ? 100 : (isRoot ? 110 : 100);
            const bh = isLeaf ? 36 : (isRoot ? 44 : 36);
            const ec = colorScale(node.portfolioENPV);
            const borderColor = isRoot ? '#6c8cff' : (node.prob < 0.005 ? 'var(--t-border)' : ec);
            const opacity = Math.max(0.2, Math.min(1, node.prob * 5));

            return (
              <g key={'n' + ni} opacity={opacity}>
                <rect x={cx - bw / 2} y={y - bh / 2} width={bw} height={bh} rx={6} fill="var(--t-hover)" stroke={borderColor} strokeWidth={isRoot ? 2 : 1} />
                {isRoot ? (
                  <>
                    <text x={cx} y={y - 10} textAnchor="middle" fontSize={11} fill="#6c8cff" fontWeight="bold">Portfolio</text>
                    <text x={cx} y={y + 4} textAnchor="middle" fontSize={9} fill="var(--t-muted)">P: 100%</text>
                    <text x={cx} y={y + 16} textAnchor="middle" fontSize={9} fill={ec} fontWeight={600}>{fmtM(node.portfolioENPV)}</text>
                  </>
                ) : (
                  <>
                    <text x={cx} y={y - 6} textAnchor="middle" fontSize={8} fill="var(--t-muted)">P: {node.prob < 0.001 ? '<0.1%' : fmtPct(node.prob)}</text>
                    <text x={cx} y={y + 7} textAnchor="middle" fontSize={9} fill={ec} fontWeight={600}>{fmtM(node.portfolioENPV)}</text>
                    {isLeaf && <text x={cx} y={y + 17} textAnchor="middle" fontSize={7} fill="var(--t-muted)">{node.failedProjects.size} project{node.failedProjects.size !== 1 ? 's' : ''} stopped</text>}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Portfolio Timeline — horizontal 18-month timeline of upcoming decisions and investments
const PortfolioTimelineTab = ({ projects, decisionTrees }) => {
  const now = DATA.portfolio.analysisDate ? (() => {
    const p = DATA.portfolio.analysisDate.split('-');
    return parseFloat(p[0]) + (parseInt(p[1]) - 1) / 12;
  })() : new Date().getFullYear() + new Date().getMonth() / 12;
  const horizon = 1.5; // 18 months
  const endYear = now + horizon;

  // Collect all upcoming gate decisions within the 18-month window
  const events = [];
  decisionTrees.forEach(tree => {
    tree.nodes.forEach(node => {
      if (node.endYear >= now && node.endYear <= endYear) {
        events.push({
          year: node.endYear,
          project: tree.projectName,
          projectId: tree.projectId,
          phase: node.phase,
          pos: node.successProbability,
          devCost: node.developmentCost,
          cumDevCost: node.cumulativeDevCost,
        });
      }
    });
  });
  events.sort((a, b) => a.year - b.year);

  // Build month labels
  const months = [];
  const startMonth = Math.floor(now * 12);
  for (let m = startMonth; m <= Math.ceil(endYear * 12); m++) {
    const yr = Math.floor(m / 12);
    const mo = m % 12;
    months.push({ year: yr + mo / 12, label: MONTHS[mo] + ' ' + yr, isJan: mo === 0 });
  }

  // Group events by project for swim-lane layout
  const projectIds = [...new Set(events.map(e => e.projectId))];
  const laneMap = {};
  projectIds.forEach((pid, i) => { laneMap[pid] = i; });

  // Layout
  const padL = 160, padR = 40, padT = 80, laneH = 56;
  const svgW = 1200;
  const timelineW = svgW - padL - padR;
  const svgH = padT + projectIds.length * laneH + 40;

  const xScale = (yr) => padL + ((yr - now) / horizon) * timelineW;

  // Total investment in window
  const totalInvest = events.reduce((s, e) => s + e.devCost, 0);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ ...card, marginBottom: 16 }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 4px 0' }}>Portfolio Timeline</h3>
        <div style={sub_}>
          Upcoming gate decisions over the next 18 months — {events.length} decisions across {projectIds.length} projects.
          Total investment needed: ${Math.round(totalInvest)}M
        </div>
      </div>
      <div style={{ ...card, overflowX: 'auto', padding: 0 }}>
        <svg width={svgW} height={svgH} style={{ display: 'block', background: 'var(--t-bg)' }}>
          {/* Month grid lines and labels */}
          {months.map((m, i) => {
            const x = xScale(m.year);
            if (x < padL || x > svgW - padR) return null;
            return (
              <g key={'m' + i}>
                <line x1={x} y1={padT - 20} x2={x} y2={svgH - 20} stroke="var(--t-border)" strokeWidth={m.isJan ? 1.5 : 0.5} strokeDasharray={m.isJan ? '' : '3 3'} />
                <text x={x} y={padT - 28} textAnchor="middle" fontSize={9} fill={m.isJan ? 'var(--t-text)' : 'var(--t-muted)'} fontWeight={m.isJan ? 700 : 400}>{m.label}</text>
              </g>
            );
          })}

          {/* "Today" marker */}
          <line x1={padL} y1={padT - 20} x2={padL} y2={svgH - 20} stroke="var(--t-accent)" strokeWidth={2} />
          <text x={padL + 4} y={padT - 28} fontSize={9} fill="var(--t-accent)" fontWeight={700}>Today</text>

          {/* Swim lanes per project */}
          {projectIds.map((pid, li) => {
            const y = padT + li * laneH;
            const projName = events.find(e => e.projectId === pid)?.project || pid;
            const projEvents = events.filter(e => e.projectId === pid);
            return (
              <g key={'lane' + pid}>
                {/* Lane background */}
                <rect x={0} y={y} width={svgW} height={laneH} fill={li % 2 === 0 ? 'var(--t-hover)' : 'transparent'} opacity={0.3} />
                {/* Project name */}
                <text x={padL - 10} y={y + laneH / 2 + 4} textAnchor="end" fontSize={11} fill="var(--t-text)" fontWeight={600}>{projName}</text>

                {/* Horizontal line through lane */}
                <line x1={padL} y1={y + laneH / 2} x2={svgW - padR} y2={y + laneH / 2} stroke="var(--t-border)" strokeWidth={0.5} />

                {/* Decision events */}
                {projEvents.map((ev, ei) => {
                  const ex = xScale(ev.year);
                  const ey = y + laneH / 2;
                  const pc = PHASE_COLORS[ev.phase] || '#8b92a8';
                  return (
                    <g key={'ev' + pid + ei}>
                      {/* Diamond marker */}
                      <polygon points={`${ex},${ey - 10} ${ex + 10},${ey} ${ex},${ey + 10} ${ex - 10},${ey}`} fill={pc} stroke="var(--t-bg)" strokeWidth={1.5} />
                      {/* Phase label */}
                      <text x={ex} y={ey - 14} textAnchor="middle" fontSize={9} fill={pc} fontWeight={700}>{ev.phase}</text>
                      {/* Cost below */}
                      <text x={ex} y={ey + 22} textAnchor="middle" fontSize={8} fill="var(--t-muted)">${ev.devCost}M</text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Legend */}
          <text x={svgW - padR} y={16} textAnchor="end" fontSize={9} fill="var(--t-muted)">Diamond = gate decision | Below = phase investment cost</text>
        </svg>
      </div>
    </div>
  );
};

// ProjectDetail view
const ProjectDetail = ({ projectId, onBack, projects, decisionTrees, timeSeries, showDropdown, onChangeProject }) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return <div style={{ padding: '20px', color: 'var(--t-muted)' }}>Project not found</div>;

  const tree = decisionTrees.find(t => t.projectId === projectId);
  const kpiData = DATA.simulation.projectKPIs.find(k => k.projectId === projectId);

  let cumCF = 0;
  const cashFlowData = timeSeries.years.map((yr, i) => {
    const projDevCosts = timeSeries.devCostByProject[project.name] ? timeSeries.devCostByProject[project.name][i] : 0;
    const projRevenue = timeSeries.revenueByProject[project.name] ? timeSeries.revenueByProject[project.name][i] : 0;
    const cogs = projRevenue * (project.commercial?.cogsPercent || 0.05);
    const ms = projRevenue * (project.commercial?.marketingAndSalesPercent || 0.08);
    const net = projRevenue - projDevCosts - cogs - ms;
    cumCF += net;
    return { year: yr, revenue: projRevenue, devCosts: -projDevCosts, cogs: -cogs, ms: -ms, net, cumCF };
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--t-bg)', paddingBottom: 12, borderBottom: '1px solid var(--t-border)', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          {onBack && <button onClick={onBack} style={{ background: 'var(--t-border)', color: 'var(--t-text)', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
            ← Back
          </button>}
          {showDropdown && (
            <select value={projectId} onChange={e => onChangeProject && onChangeProject(e.target.value)} style={{ padding: '8px 14px', background: 'var(--t-hover)', border: '1px solid var(--t-border)', borderRadius: 8, color: 'var(--t-text)', fontSize: 14 }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ color: 'var(--t-text)', margin: 0 }}>{project.name}</h2>
          <PhaseBadge phase={project.attributes.currentPhase} />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--t-muted)', flexWrap: 'wrap' }}>
          <span><strong style={{ color: 'var(--t-text)' }}>TA:</strong> {project.attributes.therapeuticArea}</span>
          <span><strong style={{ color: 'var(--t-text)' }}>Modality:</strong> {project.attributes.modality}</span>
          <span><strong style={{ color: 'var(--t-text)' }}>Source:</strong> {project.attributes.source}</span>
          <span><strong style={{ color: 'var(--t-text)' }}>Indication:</strong> {project.attributes.indication}</span>
          <span><strong style={{ color: 'var(--t-text)' }}>MoA:</strong> {project.attributes.modeOfAction}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <KPICard label="eNPV" value={fmtM(kpiData.expectedNPV)} />
        <KPICard label="eNPV+" value={fmtM(kpiData.npvPositive)} />
        <KPICard label="eNPV-" value={fmtM(kpiData.npvNegative)} />
        <KPICard label="P(Launch)" value={fmtPct(kpiData.probabilityOfLaunch)} />
        <KPICard label="Expected Launch" value={decToDate(kpiData.expectedLaunchYear)} />
        <KPICard label="Peak Revenue" value={fmtM(kpiData.peakRevenue)} />
        <KPICard label="RA Dev Cost" value={fmtM(kpiData.costToLaunch)} />
        <KPICard label="Nominal Dev Cost" value={fmtM(kpiData.nominalCostToLaunch)} />
        <KPICard label="ROI" value={kpiData.roi.toFixed(1) + 'x'} />
        <KPICard label="PI" value={kpiData.productivityIndex.toFixed(1)} />
      </div>

      <div style={{ ...card, marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Development Phases & Commercial Parameters</h3>
        <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--t-text)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--t-border)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)' }}>Phase</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)' }}>Start Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)' }}>Cost</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--t-muted)' }}>POS</th>
              </tr>
            </thead>
            <tbody>
              {project.phases.map((ph, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--t-border)' }}>
                  <td style={{ padding: '12px' }}><PhaseBadge phase={ph.name} /></td>
                  <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{fmtDate(ph.startDate)}</td>
                  <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{ph.isActual ? 'Actual' : 'Planned'}</td>
                  <td style={{ padding: '12px', color: 'var(--t-muted)' }}>{ph.durationMonths} mo</td>
                  <td style={{ padding: '12px', color: 'var(--t-muted)' }}>${ph.cost}M</td>
                  <td style={{ padding: '12px', color: '#34d399' }}>{fmtPct(ph.probabilityOfSuccess)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: '2px solid var(--t-border)', paddingTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '12px' }}>
            <div><strong style={{ color: 'var(--t-text)' }}>Peak Sales:</strong> <span style={{ color: '#34d399' }}>${project.commercial.peakYearSales}M</span></div>
            <div><strong style={{ color: 'var(--t-text)' }}>Time to Peak:</strong> <span style={{ color: '#34d399' }}>{project.commercial.timeToPeakYears} yrs</span></div>
            <div><strong style={{ color: 'var(--t-text)' }}>COGS%:</strong> <span style={{ color: '#34d399' }}>{fmtPct(project.commercial.cogsPercent)}</span></div>
            <div><strong style={{ color: 'var(--t-text)' }}>M&S%:</strong> <span style={{ color: '#34d399' }}>{fmtPct(project.commercial.marketingAndSalesPercent)}</span></div>
            <div><strong style={{ color: 'var(--t-text)' }}>LOE Year:</strong> <span style={{ color: '#34d399' }}>{project.commercial.lossOfExclusivityYear}</span></div>
          </div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Expected Cash Flow</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
            <XAxis dataKey="year" stroke="var(--t-muted)" />
            <YAxis yAxisId="left" stroke="var(--t-muted)" />
            <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" />
            <Tooltip contentStyle={ttStyle} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#34d399" name="Revenue" />
            <Bar yAxisId="left" dataKey="devCosts" fill="#f87171" name="Dev Costs" />
            <Bar yAxisId="left" dataKey="cogs" fill="#fb923c" name="COGS" />
            <Bar yAxisId="left" dataKey="ms" fill="#fbbf24" name="M&S" />
            <Line yAxisId="left" dataKey="net" stroke="#6c8cff" strokeWidth={2} dot={false} name="Net CF" />
            <Line yAxisId="right" dataKey="cumCF" stroke="#a78bfa" strokeWidth={2} dot={false} name="Cumulative CF" strokeDasharray="5 3" />
            <ReferenceLine yAxisId="left" y={0} stroke="var(--t-muted)" strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginBottom: 24 }}>
        <PLTable rows={buildProjectPL(project.name, timeSeries, project)} title={`${project.name} P&L Statement`} />
      </div>

      {tree && (() => {
        const detKpi = DATA.simulation.projectKPIs.find(k => k.projectId === projectId);
        const detLaunchNPV = detKpi?.npvPositive || 0;
        const detENPVs = new Array(tree.nodes.length).fill(0);
        for (let ii = tree.nodes.length - 1; ii >= 0; ii--) {
          const nn = tree.nodes[ii];
          const sv = ii === tree.nodes.length - 1 ? detLaunchNPV : detENPVs[ii + 1];
          const fv = nn.failureOutcome?.npv || -nn.cumulativeDevCost;
          detENPVs[ii] = nn.successProbability * sv + nn.failureProbability * fv;
        }
        const detXS = 170;
        const detSvgW = Math.max(800, (tree.nodes.length + 2) * detXS);
        return (
        <div style={{ ...card }}>
          <h3 style={{ color: 'var(--t-text)', margin: '0 0 16px 0' }}>Decision Tree</h3>
          <div style={{ overflowX: 'auto' }}>
            <svg width={detSvgW + 40} height={320} style={{ background: 'var(--t-bg)', display: 'block' }}>
              <g transform="translate(70, 130)">
                {/* START box */}
                <rect x={-50} y={-30} width={100} height={60} rx={8} fill="var(--t-hover)" stroke="#6c8cff" strokeWidth={2} />
                <text x={0} y={-10} textAnchor="middle" fontSize={12} fill="#6c8cff" fontWeight="bold">START</text>
                <text x={0} y={6} textAnchor="middle" fontSize={9} fill="var(--t-muted)">P(here) = 100%</text>
                <text x={0} y={20} textAnchor="middle" fontSize={9} fill="#6c8cff">eNPV: {fmtM(detENPVs[0])}</text>
                {tree.nodes.map((node, i) => {
                  const x = (i + 1) * detXS;
                  const pc = PHASE_COLORS[node.phase] || '#8b92a8';
                  return (
                    <g key={i}>
                      <line x1={i * detXS + 50} y1={0} x2={x - 55} y2={0} stroke="var(--t-border)" strokeWidth={2} />
                      <polygon points={`${x - 55},${-4} ${x - 48},0 ${x - 55},4`} fill="var(--t-border)" />
                      <text x={(i * detXS + 50 + x - 55) / 2} y={-8} textAnchor="middle" fontSize={9} fill="#34d399" fontWeight={600}>POS {fmtPct(node.successProbability)}</text>
                      <rect x={x - 55} y={-35} width={110} height={70} rx={8} fill="var(--t-hover)" stroke={pc} strokeWidth={2} />
                      <text x={x} y={-18} textAnchor="middle" fontSize={12} fill={pc} fontWeight="bold">{node.phase}</text>
                      <text x={x} y={-4} textAnchor="middle" fontSize={9} fill="var(--t-muted)">Cumul P: {fmtPct(node.cumulativeProbability)}</text>
                      <text x={x} y={10} textAnchor="middle" fontSize={9} fill="var(--t-muted)">Cost: ${node.developmentCost}M</text>
                      <text x={x} y={24} textAnchor="middle" fontSize={9} fill="#6c8cff">eNPV: {detENPVs[i] != null ? fmtM(detENPVs[i]) : '--'}</text>
                      {node.failureOutcome && node.failureProbability > 0 && (
                        <g>
                          <line x1={x} y1={35} x2={x} y2={60} stroke="rgba(248,113,113,0.5)" strokeWidth={1} />
                          <rect x={x - 42} y={60} width={84} height={38} rx={5} fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" strokeWidth={1} />
                          <text x={x} y={75} textAnchor="middle" fontSize={9} fill="#f87171" fontWeight={600}>Fail ({fmtPct(node.failureProbability)})</text>
                          <text x={x} y={90} textAnchor="middle" fontSize={8} fill="#f87171">NPV: {fmtM(node.failureOutcome.npv)}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
                {/* LAUNCH box */}
                {(() => { const lx = (tree.nodes.length + 1) * detXS; return (
                  <g>
                    <line x1={tree.nodes.length * detXS + 55} y1={0} x2={lx - 50} y2={0} stroke="var(--t-border)" strokeWidth={2} />
                    <rect x={lx - 50} y={-30} width={100} height={60} rx={8} fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth={2} />
                    <text x={lx} y={-10} textAnchor="middle" fontSize={12} fill="#34d399" fontWeight="bold">LAUNCH</text>
                    <text x={lx} y={6} textAnchor="middle" fontSize={9} fill="#34d399">P: {fmtPct(tree.probabilityOfLaunch)}</text>
                    <text x={lx} y={20} textAnchor="middle" fontSize={9} fill="#34d399">{decToDate(tree.expectedLaunchYear)}</text>
                  </g>
                ); })()}
              </g>
            </svg>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

// Main App
export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [detailProjectId, setDetailProjectId] = useState(DATA.portfolio.projects[0]?.id);
  const [mode, setMode] = useState('dark');
  const t = THEMES[mode];
  const tabs = ['Dashboard', 'Projects', 'Project Detail', 'Cash Flow', 'Revenue Analysis', 'P&L', 'Gantt', 'Pipeline', 'Decision Trees', 'Portfolio Decision Tree', 'Portfolio Timeline'];
  const projects = DATA.portfolio.projects;
  const kpis = DATA.simulation.projectKPIs;
  const timeSeries = DATA.simulation.timeSeries;
  const decisionTrees = DATA.simulation.decisionTrees;

  // Scroll to top when selecting a project — navigate to Project Detail tab
  const selectProject = (id) => {
    setDetailProjectId(id);
    setTab('Project Detail');
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  // Dynamically patch the module-level style objects so all components pick up theme
  card.background = t.bgCard; card.border = `1px solid ${t.border}`;
  sub_.color = t.textMuted;
  ttStyle.background = t.bgCard; ttStyle.border = `1px solid ${t.border}`;

  // CSS custom properties for theme — scoped to this component's container
  const cssVars = `
    .ppm-viewer-root {
      --t-bg: ${t.bg};
      --t-card: ${t.bgCard};
      --t-hover: ${t.bgHover};
      --t-border: ${t.border};
      --t-text: ${t.text};
      --t-muted: ${t.textMuted};
      --t-faint: ${t.textFaint};
      --t-svg-bg: ${t.svgBg};
      --t-node: ${t.nodeBox};
      --t-positive: ${t.positive};
      --t-negative: ${t.negative};
      --t-accent: ${t.accent};
    }
  `;

  return (
    <ThemeContext.Provider value={t}>
      <style>{cssVars}</style>
      <div className="ppm-viewer-root" style={{ background: t.bg, color: t.text, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: t.bg, borderBottom: `1px solid ${t.border}`, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0, color: t.text }}>{DATA.portfolio.name}</h1>
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer', color: t.text, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {mode === 'dark' ? '\u263E Dark' : '\u2600 Light'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tabs.map(tb => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                style={{
                  background: tab === tb ? 'var(--t-border)' : 'transparent',
                  color: tab === tb ? t.text : t.textMuted,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '14px'
                }}
              >
                {tb}
              </button>
            ))}
          </div>
        </div>

        <div>
          {tab === 'Dashboard' && <Dashboard kpis={kpis} projects={projects} timeSeries={timeSeries} launchDist={DATA.simulation.portfolioKPIs.launchDistribution} onSelectProject={selectProject} />}
          {tab === 'Projects' && <ProjectsTab projects={projects} kpis={kpis} onSelectProject={selectProject} />}
          {tab === 'Project Detail' && <ProjectDetail projectId={detailProjectId} projects={projects} decisionTrees={decisionTrees} timeSeries={timeSeries} showDropdown onChangeProject={(id) => { setDetailProjectId(id); setTimeout(() => window.scrollTo(0, 0), 0); }} />}
          {tab === 'Cash Flow' && <CashFlowTab timeSeries={timeSeries} />}
          {tab === 'Revenue Analysis' && <RevenueAnalysisTab revenueQuartiles={DATA.simulation.revenueQuartiles} />}
          {tab === 'P&L' && <PLStatementTab timeSeries={timeSeries} projects={projects} />}
          {tab === 'Gantt' && <GanttTab projects={projects} onSelectProject={selectProject} decisionTrees={DATA.simulation.decisionTrees} />}
          {tab === 'Pipeline' && <PipelineTab projects={projects} kpis={kpis} onSelectProject={selectProject} />}
          {tab === 'Decision Trees' && <DecisionTreesTab projects={projects} decisionTrees={decisionTrees} />}
          {tab === 'Portfolio Decision Tree' && <PortfolioDecisionTreeTab decisionTrees={decisionTrees} />}
          {tab === 'Portfolio Timeline' && <PortfolioTimelineTab projects={projects} decisionTrees={decisionTrees} />}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
