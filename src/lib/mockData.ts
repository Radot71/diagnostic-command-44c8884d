import { Situation, DiagnosticReport, WizardData } from './types';
import { calcRunwayMonths } from './currencyUtils';

export const situations: Situation[] = [
  // Distress
  {
    id: 'liquidity-crisis',
    title: 'Liquidity Crisis',
    description: 'Immediate cash shortfall threatening operations within 30-90 days',
    category: 'distress',
    urgency: 'critical',
    icon: 'AlertTriangle',
  },
  {
    id: 'covenant-breach',
    title: 'Covenant Breach',
    description: 'Pending or actual violation of debt covenants requiring lender negotiation',
    category: 'distress',
    urgency: 'high',
    icon: 'FileWarning',
  },
  {
    id: 'turnaround-assessment',
    title: 'Turnaround Assessment',
    description: 'Evaluation of operational and financial restructuring options',
    category: 'distress',
    urgency: 'medium',
    icon: 'RefreshCw',
  },
  // Transaction
  {
    id: 'acquisition-diligence',
    title: 'Acquisition Due Diligence',
    description: 'Pre-LOI or confirmatory diligence on target company',
    category: 'transaction',
    urgency: 'high',
    icon: 'Search',
  },
  {
    id: 'exit-preparation',
    title: 'Exit Preparation',
    description: 'Preparing portfolio company for sale process',
    category: 'transaction',
    urgency: 'medium',
    icon: 'TrendingUp',
  },
  {
    id: 'carve-out',
    title: 'Carve-Out Analysis',
    description: 'Evaluating spin-off or divestiture of business unit',
    category: 'transaction',
    urgency: 'medium',
    icon: 'Scissors',
  },
  // Growth
  {
    id: 'market-expansion',
    title: 'Market Expansion',
    description: 'Evaluating geographic or segment expansion opportunity',
    category: 'growth',
    urgency: 'low',
    icon: 'Globe',
  },
  {
    id: 'product-launch',
    title: 'Product Launch Assessment',
    description: 'Go/no-go analysis for new product or service line',
    category: 'growth',
    urgency: 'medium',
    icon: 'Rocket',
  },
  // Governance
  {
    id: 'ceo-succession',
    title: 'CEO Succession',
    description: 'Planned or emergency leadership transition',
    category: 'governance',
    urgency: 'high',
    icon: 'Users',
  },
  {
    id: 'board-effectiveness',
    title: 'Board Effectiveness Review',
    description: 'Assessment of board composition and governance practices',
    category: 'governance',
    urgency: 'low',
    icon: 'Building2',
  },
];

export const signalOptions = [
  'Revenue declining YoY',
  'Key customer concentration >30%',
  'Management turnover in last 12 months',
  'Delayed financial reporting',
  'Supplier payment extensions requested',
  'Headcount reductions announced',
  'Market share erosion',
  'Regulatory pressure increasing',
  'Technology platform outdated',
  'Working capital squeeze',
];

export const demoScenarios: { name: string; data: WizardData }[] = [
  {
    name: 'Manufacturing Turnaround',
    data: {
      situation: situations.find(s => s.id === 'turnaround-assessment')!,
      companyBasics: {
        companyName: 'Precision Components Inc.',
        industry: 'Industrial Manufacturing',
        revenue: '$85M',
        employees: '320',
        founded: '1987',
      },
      runwayInputs: {
        cashOnHand: '$4.2M',
        monthlyBurn: '$650K',
        hasDebt: true,
        debtAmount: '$22M',
        debtMaturity: '18 months',
      },
      signalChecklist: {
        signals: ['Revenue declining YoY', 'Key customer concentration >30%', 'Technology platform outdated'],
        notes: 'Primary customer (35% of revenue) has signaled intent to dual-source. Legacy ERP system limiting operational visibility.',
      },
    },
  },
  {
    name: 'Tech Acquisition Target',
    data: {
      situation: situations.find(s => s.id === 'acquisition-diligence')!,
      companyBasics: {
        companyName: 'CloudScale Analytics',
        industry: 'Enterprise Software',
        revenue: '$42M ARR',
        employees: '185',
        founded: '2015',
      },
      runwayInputs: {
        cashOnHand: '$18M',
        monthlyBurn: '$1.2M',
        hasDebt: false,
        debtAmount: '',
        debtMaturity: '',
      },
      signalChecklist: {
        signals: ['Market share erosion', 'Management turnover in last 12 months'],
        notes: 'CTO departed 6 months ago. Strong product but facing pressure from well-funded competitors.',
      },
    },
  },
  {
    name: 'Retail Liquidity Crisis',
    data: {
      situation: situations.find(s => s.id === 'liquidity-crisis')!,
      companyBasics: {
        companyName: 'Heritage Home Goods',
        industry: 'Specialty Retail',
        revenue: '$125M',
        employees: '450',
        founded: '1972',
      },
      runwayInputs: {
        cashOnHand: '$2.8M',
        monthlyBurn: '$1.1M',
        hasDebt: true,
        debtAmount: '$35M',
        debtMaturity: '45 days',
      },
      signalChecklist: {
        signals: ['Revenue declining YoY', 'Supplier payment extensions requested', 'Working capital squeeze', 'Delayed financial reporting'],
        notes: 'ABL facility approaching borrowing base limit. Q4 performance significantly below plan. Landlord negotiations ongoing for 12 locations.',
      },
    },
  },
  {
    name: 'Covenant Breach Risk',
    data: {
      situation: situations.find(s => s.id === 'covenant-breach')!,
      companyBasics: {
        companyName: 'Cascade Manufacturing Corp.',
        industry: 'Industrial Distribution',
        revenue: '$110M',
        employees: '280',
        founded: '1994',
      },
      runwayInputs: {
        cashOnHand: '$3.2M',
        monthlyBurn: '$1.4M',
        hasDebt: true,
        debtAmount: '$42M',
        debtMaturity: '60 days',
      },
      signalChecklist: {
        signals: ['Revenue declining YoY', 'Supplier payment extensions requested', 'Working capital squeeze', 'Delayed financial reporting', 'Key customer concentration >30%'],
        notes: 'Borrowing base limit imminent. Senior secured lender has requested weekly cash reporting. Two key suppliers moved to COD terms.',
      },
    },
  },
  {
    name: 'Customer Concentration Collapse',
    data: {
      situation: situations.find(s => s.id === 'turnaround-assessment')!,
      companyBasics: {
        companyName: 'Apex Industrial Supply',
        industry: 'B2B Distribution',
        revenue: '$95M',
        employees: '210',
        founded: '2003',
      },
      runwayInputs: {
        cashOnHand: '$12M',
        monthlyBurn: '$1.5M',
        hasDebt: true,
        debtAmount: '$18M',
        debtMaturity: '14 months',
      },
      signalChecklist: {
        signals: ['Key customer concentration >30%', 'Revenue declining YoY', 'Market share erosion'],
        notes: 'Primary customer (35% of revenue) threatening dual-source. Competitor offering 12% discount to take share. Pipeline diversification behind plan.',
      },
    },
  },
  {
    name: 'Growth vs Profitability',
    data: {
      situation: situations.find(s => s.id === 'exit-preparation')!,
      companyBasics: {
        companyName: 'Velocity SaaS Inc.',
        industry: 'Enterprise Software',
        revenue: '$55M ARR',
        employees: '240',
        founded: '2017',
      },
      runwayInputs: {
        cashOnHand: '$25M',
        monthlyBurn: '$1.25M',
        hasDebt: false,
        debtAmount: '',
        debtMaturity: '',
      },
      signalChecklist: {
        signals: ['Market share erosion', 'Management turnover in last 12 months'],
        notes: 'Board split on growth investment vs. path to profitability. Series C investors expecting exit within 18 months. Burn rate stable but CAC increasing.',
      },
    },
  },
];
export const generateMockReport = (wizardData: WizardData, outputMode: 'snapshot' | 'rapid' | 'full'): DiagnosticReport => {
  const company = wizardData.companyBasics.companyName || 'Target Company';
  const situation = wizardData.situation?.title || 'General Assessment';
  const hasDebt = wizardData.runwayInputs.hasDebt;
  const isDistress = wizardData.situation?.urgency === 'critical' || wizardData.situation?.urgency === 'high';

  return {
    id: `RPT-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    outputMode,
    integrity: {
      completeness: 78,
      evidenceQuality: 65,
      confidence: 72,
      missingData: [
        'Historical monthly P&L (last 24 months)',
        'Customer concentration analysis',
        'Detailed aging schedule',
        'Management org chart',
        'Capex requirements forecast',
      ],
    },
    sections: {
      executiveBrief: `## Executive Brief: ${company}

### Situation Overview
${company} is facing a **${situation}** situation requiring immediate attention. Based on the diagnostic inputs provided, we have identified several critical factors that will shape the path forward.

### Key Findings
1. **Financial Position**: ${hasDebt ? `Debt of ${wizardData.runwayInputs.debtAmount} with ${wizardData.runwayInputs.debtMaturity} to maturity creates pressure on liquidity management.` : 'No significant debt constraints identified.'}

2. **Runway Assessment**: With ${wizardData.runwayInputs.cashOnHand} cash on hand and ${wizardData.runwayInputs.monthlyBurn} monthly burn, the current runway is approximately ${Math.floor(calcRunwayMonths(wizardData.runwayInputs.cashOnHand, wizardData.runwayInputs.monthlyBurn))} months.

3. **Signal Analysis**: ${wizardData.signalChecklist.signals.length} warning signals identified, indicating ${wizardData.signalChecklist.signals.length > 3 ? 'elevated' : 'moderate'} risk profile.

### Recommendation Summary
Immediate focus should be on stabilizing the financial position while developing strategic options for stakeholder consideration.`,

      valueLedger: `## Value Ledger: ${company}

### Asset Valuation Summary

| Category | Book Value | Estimated FMV | Recovery % |
|----------|------------|---------------|------------|
| Cash & Equivalents | ${wizardData.runwayInputs.cashOnHand} | ${wizardData.runwayInputs.cashOnHand} | 100% |
| Accounts Receivable | $12.4M | $10.8M | 87% |
| Inventory | $8.2M | $5.7M | 70% |
| PP&E | $15.6M | $9.4M | 60% |
| Intangibles | $4.8M | $1.2M | 25% |

### Liability Structure

| Obligation | Amount | Priority | Maturity |
|------------|--------|----------|----------|
| Senior Secured | ${wizardData.runwayInputs.debtAmount || 'N/A'} | 1st | ${wizardData.runwayInputs.debtMaturity || 'N/A'} |
| Trade Payables | $6.2M | Unsecured | Current |
| Accrued Liabilities | $2.8M | Various | Current |

### Value Creation Opportunities
- Working capital optimization: $2-4M potential release
- Cost structure rationalization: $3-5M annual savings potential
- Portfolio pruning: Non-core asset monetization opportunity`,

      scenarios: `## Scenario Analysis: ${company}

### Base Case
**Assumptions**: Current trajectory maintained, no strategic intervention
- 12-month cash position: Negative without intervention
- Key risks: Covenant breach, supplier credit tightening
- Probability: 40%

### Upside Case  
**Assumptions**: Successful operational restructuring, market conditions stabilize
- 12-month cash position: $5-8M positive
- Key enablers: Cost reduction execution, working capital improvement
- Probability: 25%

### Downside Case
**Assumptions**: Accelerated market deterioration, customer loss
- 12-month cash position: Critical by Month 6
- Key risks: Forced liquidation, significant value destruction
- Probability: 35%

### Scenario-Specific Actions
Each scenario requires distinct playbook activation. See Execution Plan for detailed workstreams.`,

      options: `## Strategic Options: ${company}

### Option 1: Operational Restructuring
**Description**: Comprehensive cost reduction and efficiency program
- Timeline: 6-12 months
- Investment Required: $2-3M
- Expected Outcome: Sustainable EBITDA improvement of 300-500 bps
- Risk Level: Medium

### Option 2: Strategic Sale Process
**Description**: Controlled auction to strategic or financial buyers
- Timeline: 4-6 months
- Investment Required: $500K-1M (advisory fees)
- Expected Outcome: Exit at 4-6x adjusted EBITDA
- Risk Level: Medium-High

### Option 3: Recapitalization
**Description**: New capital infusion with existing or new sponsors
- Timeline: 3-4 months
- Investment Required: Minimal direct cost
- Expected Outcome: Extended runway, potential governance changes
- Risk Level: High

### Option 4: Orderly Wind-Down
**Description**: Controlled liquidation to maximize recoveries
- Timeline: 6-9 months
- Investment Required: $1-2M (wind-down costs)
- Expected Outcome: 40-60% recovery for secured creditors
- Risk Level: Low (execution), High (value destruction)`,

      executionPlan: `## Execution Plan: ${company}

### Immediate Actions (Week 1-2)
- [ ] Establish cash management protocols
- [ ] Engage key stakeholder communication
- [ ] Secure professional advisors
- [ ] Initiate 13-week cash flow forecast

### Short-Term Workstreams (Week 3-8)
**Workstream 1: Financial Stabilization**
- Daily cash monitoring
- Supplier negotiation program
- Customer collection acceleration

**Workstream 2: Operational Assessment**
- Headcount optimization analysis
- Facility footprint review
- Procurement cost reduction

**Workstream 3: Strategic Alternatives**
- Preliminary buyer outreach
- Investment banker selection
- Data room preparation

### Key Milestones
| Milestone | Target Date | Owner | Status |
|-----------|-------------|-------|--------|
| 13-Week Forecast Complete | Week 2 | CFO | Pending |
| Advisor Engagement | Week 1 | Board | Pending |
| Stakeholder Presentation | Week 3 | CEO | Pending |
| Strategic Options Memo | Week 6 | Advisor | Pending |`,

      evidenceRegister: `## Evidence Register: ${company}

### Documents Received
| Document | Date Received | Quality | Notes |
|----------|---------------|---------|-------|
| Annual Financials FY23 | 2024-01-15 | Good | Audited |
| Monthly P&L (6 months) | 2024-01-18 | Fair | Management prepared |
| Cash Flow Forecast | 2024-01-20 | Fair | Assumptions need validation |

### Documents Pending
- [ ] Customer contracts (top 10)
- [ ] Supplier agreements (critical path)
- [ ] Lease abstracts
- [ ] Employment agreements (key personnel)
- [ ] Loan documentation package

### Evidence Quality Notes
${wizardData.signalChecklist.notes || 'No additional notes provided.'}

### Confidence Assessment
Based on available evidence, overall confidence in analysis is **${Math.round((78 + 65 + 72) / 3)}%**. Key gaps in customer and supplier documentation limit visibility into concentration risks and contractual obligations.`,

      // ROOM 2 — Pattern Analysis
      patternAnalysis: `### Historical Precedent 1: Mid-Market Industrial Downturn (2019–2020)
**What happened**: Manufacturing companies with similar revenue profiles ($75–120M) experienced margin compression of 300–500 bps when key customers dual-sourced.
**Time lag**: 6–12 months from signal to full revenue impact.
**Who suffered**: Single-customer-dependent suppliers with >25% concentration.

### Historical Precedent 2: Credit Tightening Cycle (2022–2023)
**What happened**: Companies with leverage >3.5x faced covenant pressure as SOFR rose 400+ bps. Refinancing windows narrowed sharply.
**Time lag**: 3–6 months from first covenant test failure to lender action.
**Who benefited**: Cash-rich acquirers who purchased distressed assets at 40–60% of replacement cost.

### Historical Precedent 3: Supply Chain Restructuring Wave (2020–2022)
**What happened**: Customers accelerated supplier diversification, reducing single-source dependency. Incumbents lost 15–30% of contracted volume within 12 months.
**Time lag**: 6–9 months from dual-source announcement to measurable revenue decline.
**Correlation vs Causation**: Customer diversification is a leading indicator, not a direct cause of financial distress — but it accelerates existing vulnerabilities.`,

      // ROOM 3 — Causal Impact Table (markdown)
      causalImpactTable: `| Business Type | Direction | Margin | Financing Pressure |
|---|---|---|---|
| U.S.-only | Headwind | Compressing | ${hasDebt ? 'High' : 'Moderate'} |
| Globally diversified | Mixed | Stable | Moderate |
| Exporter | Tailwind | Expanding | Low |
| Domestic consumer | Headwind | Compressing | ${isDistress ? 'High' : 'Moderate'} |
| Commodity-linked | Mixed | Stable | Moderate |`,

      // ROOM 4 — GCAS Narrative
      gcasNarrative: `**GCAS Score: LOW** — ${company} operates primarily in the domestic U.S. market with no meaningful international revenue, no emerging market exposure, and a weaker dollar would increase import costs without offsetting export gains. The company is fully exposed to U.S. macro conditions with no natural currency hedge.`,

      // Upgrade A+B — Segment Value Math
      segmentValueMath: `**U.S. Revenue Segment**: ${wizardData.companyBasics.revenue} fully domestic — EBITDA at risk from margin compression of 200–400 bps under base case.
**International Revenue**: None identified — no diversification benefit.
**Export Impact**: Negligible — company does not export.
**Commodity Cost Impact**: Raw material inputs estimated at 35–45% of COGS; commodity volatility creates ±$1.5–2.5M annual variance.

**Net EBITDA Range**: $6.2M–$9.8M (vs. trailing $11.4M) under stress scenario.
**Leverage Impact**: If debt is ${wizardData.runwayInputs.debtAmount || 'unknown'}, implied leverage moves from ~2.8x to 3.5–4.2x under stress, likely triggering covenant review.`,

      // Upgrade C — Course Correction narrative
      courseCorrection: `Three measurable 90-day actions have been identified to stabilize the position and preserve optionality. Each action targets a specific P&L or balance sheet lever with a named owner and measurable KPI.`,

      // Upgrade D — Checkpoint Rule
      checkpointRule: `**6-Month Decision Gate**: If by Month 6, EBITDA ≥ $8.5M annualized AND refinancing cost ≤ +150 bps over current facility → Stay course and reinvest in growth. If EBITDA < $7.0M OR refinancing cost > +250 bps → Prepare dual-track exit (controlled sale + recapitalization) or deeper operational restructuring.`,

      // SECTION 6 — Financing & Leverage narrative
      financingNarrative: `**Refi Cost Increase**: +75–200 bps over current facility rate, reflecting market spread widening and deteriorating credit profile.\n\n**Covenant Pressure**: ${hasDebt ? 'High — leverage covenant at risk of breach within 2 quarters if EBITDA continues to decline.' : 'Low — no material debt covenants in place.'}\n\n**Leverage Impact**: Current leverage ~2.8x could rise to 3.5–4.2x under bear case, with 4.8x+ in tail scenario.\n\n**Exit Multiple Impact**: Compression of -0.5x to -1.5x turns likely under distress signaling.`,

      // SECTION 8 — Critical Preconditions narrative
      preconditionsNarrative: `Five critical preconditions have been assessed. Customer concentration and covenant terms are the primary blockers requiring resolution before any GO decision can be issued.`,

      // SECTION 12 — Governor Decision narrative
      governorNarrative: `**Decision: ${isDistress ? 'NO-GO' : 'CAUTION'}**\n\nRisk Score: ${isDistress ? '8' : '6'}/10 | Confidence Score: ${isDistress ? '5' : '6'}/10\n\n1. ${hasDebt ? 'Covenant terms are at risk — leverage trajectory threatens breach within 2 quarters.' : 'Cash position adequate but declining.'}\n2. Customer concentration exceeds safe thresholds — single-customer dependency creates binary risk.\n3. ${isDistress ? 'Multiple critical preconditions are UNKNOWN, blocking GO decision.' : 'Operational metrics show directional improvement but insufficient magnitude.'}`,

      // SECTION 13 — Self-Test narrative
      selfTestNarrative: `**Most Uncertain Area**: Customer retention probability — dual-sourcing signal could accelerate faster than modeled.\n\n**Most Fragile Assumption**: That the primary customer (35% of revenue) maintains current volume through the restructuring period.\n\n**What Triggers NO-GO Tomorrow**: Notification of formal RFP from primary customer to competitive suppliers.\n\n**Single Mitigation**: Securing a 12-month volume commitment from the primary customer with pricing concession would materially improve the decision framework.`,
    },

    // ──── GCAS v2 STRUCTURED DATA ────

    gcas: {
      score: 'LOW',
      revenueOutsideUS: false,
      emergingMarketExposure: false,
      weakerDollarImpact: 'hurt',
      explanation: `${company} is a domestic-only operator with no international revenue or emerging market exposure. A weaker dollar increases input costs without export offset.`,
      riskWarning: 'Fully exposed to U.S. macro conditions. No natural currency or geographic hedge. Margin compression risk elevated in a weakening domestic demand environment.',
      ebitdaRiskRange: '$6.2M–$9.8M (vs. trailing $11.4M)',
      financingRisk: hasDebt ? 'Leverage could rise to 3.5–4.2x under stress, likely triggering covenant review' : 'Low — no significant debt',
      exitMultipleRisk: isDistress ? 'Multiple compression of 1.0–1.5x likely under forced timeline' : 'Moderate — 0.5–1.0x compression possible if margins deteriorate',
    },

    causalImpactRows: [
      { businessType: 'U.S.-only', direction: 'Headwind', marginDirection: 'Compressing', financingPressure: hasDebt ? 'High' : 'Moderate' },
      { businessType: 'Globally diversified', direction: 'Mixed', marginDirection: 'Stable', financingPressure: 'Moderate' },
      { businessType: 'Exporter', direction: 'Tailwind', marginDirection: 'Expanding', financingPressure: 'Low' },
      { businessType: 'Domestic consumer', direction: 'Headwind', marginDirection: 'Compressing', financingPressure: isDistress ? 'High' : 'Moderate' },
      { businessType: 'Commodity-linked', direction: 'Mixed', marginDirection: 'Stable', financingPressure: 'Moderate' },
    ],

    segmentBreakdown: {
      usRevenue: `${wizardData.companyBasics.revenue} (100% domestic)`,
      internationalRevenue: 'None identified',
      exportImpact: 'Negligible — no export revenue',
      commodityCost: '±$1.5–2.5M annual variance from raw material inputs',
      netEbitdaRange: '$6.2M–$9.8M (stress) vs. $11.4M trailing',
      leverageImpact: hasDebt ? `Implied leverage moves from ~2.8x to 3.5–4.2x under stress` : 'N/A — no debt',
    },

    courseCorrections: [
      {
        what: 'Implement 13-week rolling cash forecast with daily sweep protocols',
        why: 'Establishes real-time liquidity visibility and prevents surprise shortfalls',
        owner: 'CFO',
        timeline: '30 days',
        kpi: 'Forecast accuracy within ±10% of actual cash position by Week 4',
        scope: '100% of cash management operations',
      },
      {
        what: 'Execute supplier payment prioritization and negotiate extended terms with top-5 vendors',
        why: 'Preserves trade credit access and extends effective cash runway by 15–30 days',
        owner: 'COO',
        timeline: '60 days',
        kpi: 'Average DPO extended by 10+ days; zero critical supplier disruptions',
        scope: '65% of total procurement spend',
      },
      {
        what: 'Launch customer diversification pipeline targeting 3 new accounts in adjacent verticals',
        why: 'Reduces concentration risk and creates revenue optionality beyond top customer',
        owner: 'CRO',
        timeline: '90 days',
        kpi: 'Signed LOIs or pilot agreements with ≥2 new accounts representing $3M+ potential',
        scope: '35% revenue concentration at risk',
      },
    ],

    checkpointGate: {
      timeframe: '6 months',
      stayCondition: 'EBITDA ≥ $8.5M annualized AND refinancing cost ≤ +150 bps',
      exitCondition: 'EBITDA < $7.0M OR refinancing cost > +250 bps',
      metrics: [
        'Annualized EBITDA run-rate',
        'Refinancing spread over base rate',
        'Customer concentration ratio (top-1)',
        'Cash runway in months',
      ],
    },

    portfolioRecommendation: {
      action: isDistress ? 'Restructure' : 'Reposition',
      rationale: isDistress
        ? `${company} requires immediate operational restructuring to stabilize EBITDA, extend runway, and preserve lender relationships. Exit optionality depends on demonstrating margin recovery within 6 months.`
        : `${company} should reposition its revenue mix and cost structure to reduce concentration risk and improve margins. Strategic repositioning preserves long-term value while addressing near-term vulnerabilities.`,
      conditionalFollowOn: isDistress
        ? 'If EBITDA recovers to ≥$9M annualized within 6 months, reassess for controlled exit at improved multiples.'
        : undefined,
    },

    // SECTION 6 — Financing & Leverage (structured)
    financingLeverage: {
      refiCostIncreaseBps: hasDebt ? '+75–200 bps' : '+25–50 bps (facility renewal)',
      covenantPressure: hasDebt && isDistress ? 'High' : hasDebt ? 'Medium' : 'Low',
      leverageImpact: hasDebt ? 'Current ~2.8x → projected 3.5–4.2x (bear), 4.8x+ (tail)' : 'N/A — unlevered',
      exitMultipleTurnsImpact: isDistress ? '-1.0x to -1.5x compression' : '-0.5x to -1.0x compression',
    },

    // SECTION 7 — CFO-Grade Value Ledger (structured)
    valueLedgerSummary: {
      entries: [
        { item: 'Revenue Impact', base: '-2% to -5%', bear: '-8% to -12%', tail: '-15% to -20%' },
        { item: 'EBITDA Margin', base: '12.5%', bear: '9.8%', tail: '6.2%' },
        { item: 'Cash Flow from Ops', base: '$8.2M', bear: '$4.8M', tail: '$1.2M' },
        { item: 'Capex Requirements', base: '$3.5M', bear: '$2.8M', tail: '$1.5M (maintenance only)' },
        { item: 'Working Capital', base: '-$1.2M', bear: '-$3.5M', tail: '-$6.8M' },
        { item: 'Debt Service', base: hasDebt ? '$4.2M' : 'N/A', bear: hasDebt ? '$5.1M' : 'N/A', tail: hasDebt ? '$6.8M (incl. refi)' : 'N/A' },
      ],
      downsideAtRisk: isDistress ? '$18M–$28M equity value at risk' : '$8M–$15M equity value at risk',
      expectedDrawdownBand: isDistress ? '$12M–$22M drawdown' : '$5M–$12M drawdown',
      covenantBreachLikelihood: hasDebt && isDistress ? 'High' : hasDebt ? 'Medium' : 'Low',
      refiRiskLikelihood: hasDebt && isDistress ? 'High' : hasDebt ? 'Medium' : 'Low',
      exitMultipleCompressionRisk: isDistress ? 'High' : 'Medium',
    },

    // SECTION 8 — Critical Preconditions (structured)
    criticalPreconditions: [
      {
        name: 'Customer Concentration',
        status: wizardData.signalChecklist.signals.includes('Key customer concentration >30%') ? 'FAIL' : 'UNKNOWN',
        whyItMatters: 'Single-customer dependency >30% creates binary risk. Loss of top customer could trigger covenant breach and liquidity crisis.',
      },
      {
        name: 'Customer Overlap / Cross-Sell',
        status: 'UNKNOWN',
        whyItMatters: 'Without visibility into customer overlap, revenue synergy assumptions are unverified. Cross-sell potential may be overstated.',
      },
      {
        name: 'Covenant Terms',
        status: hasDebt ? (isDistress ? 'FAIL' : 'PASS') : 'PASS',
        whyItMatters: 'Covenant breach triggers acceleration rights, potential cross-defaults, and loss of operational flexibility.',
      },
      {
        name: 'Input-Cost Pass-Through',
        status: 'UNKNOWN',
        whyItMatters: 'If commodity cost increases cannot be passed to customers, margin compression accelerates faster than modeled.',
      },
      {
        name: 'Integration Capacity',
        status: wizardData.signalChecklist.signals.includes('Technology platform outdated') ? 'FAIL' : 'PASS',
        whyItMatters: 'Outdated systems limit ability to execute operational improvements and reduce cost of integration.',
      },
    ],

    // SECTION 12 — Governor Decision (structured)
    governorDecision: {
      call: isDistress ? 'NO-GO' : 'CAUTION',
      riskScore: isDistress ? 8 : 6,
      confidenceScore: isDistress ? 5 : 6,
      reasons: [
        hasDebt
          ? 'Covenant terms are at risk — leverage trajectory threatens breach within 2 quarters.'
          : 'Cash position adequate but declining trend requires monitoring.',
        'Customer concentration exceeds safe thresholds — single-customer dependency creates binary risk.',
        isDistress
          ? 'Multiple critical preconditions are UNKNOWN, blocking GO decision per strict contract rules.'
          : 'Operational metrics show directional improvement but insufficient magnitude for GO.',
      ],
    },

    // SECTION 13 — Self-Test (structured)
    selfTest: {
      mostUncertainArea: 'Customer retention probability — dual-sourcing signal could accelerate faster than modeled.',
      mostFragileAssumption: `That the primary customer (35% of revenue) maintains current volume through the restructuring period at ${company}.`,
      noGoTrigger: 'Notification of formal RFP from primary customer to competitive suppliers, or covenant breach notification from senior lender.',
      singleMitigation: 'Securing a 12-month volume commitment from the primary customer with pricing concession would materially improve the decision framework.',
    },

    inputSummary: `**Company**: ${wizardData.companyBasics.companyName || 'Not specified'}
**Industry**: ${wizardData.companyBasics.industry || 'Not specified'}
**Revenue**: ${wizardData.companyBasics.revenue || 'Not specified'}
**Employees**: ${wizardData.companyBasics.employees || 'Not specified'}
**Founded**: ${wizardData.companyBasics.founded || 'Not specified'}

**Situation**: ${wizardData.situation?.title || 'Not specified'}
**Urgency**: ${wizardData.situation?.urgency || 'Not specified'}

**Financial Position**:
- Cash on Hand: ${wizardData.runwayInputs.cashOnHand || 'Not specified'}
- Monthly Burn: ${wizardData.runwayInputs.monthlyBurn || 'Not specified'}
- Debt: ${hasDebt ? `${wizardData.runwayInputs.debtAmount} (${wizardData.runwayInputs.debtMaturity} to maturity)` : 'None'}

**Signals Identified**: ${wizardData.signalChecklist.signals.join(', ') || 'None selected'}

**Additional Notes**: ${wizardData.signalChecklist.notes || 'None provided'}`,
    rawJson: wizardData,
  };
};
