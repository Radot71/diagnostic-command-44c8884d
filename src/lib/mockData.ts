import { Situation, DiagnosticReport, WizardData } from './types';

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
];

export const generateMockReport = (wizardData: WizardData, outputMode: 'snapshot' | 'rapid' | 'full'): DiagnosticReport => {
  const company = wizardData.companyBasics.companyName || 'Target Company';
  const situation = wizardData.situation?.title || 'General Assessment';

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
1. **Financial Position**: ${wizardData.runwayInputs.hasDebt ? `Debt of ${wizardData.runwayInputs.debtAmount} with ${wizardData.runwayInputs.debtMaturity} to maturity creates pressure on liquidity management.` : 'No significant debt constraints identified.'}

2. **Runway Assessment**: With ${wizardData.runwayInputs.cashOnHand} cash on hand and ${wizardData.runwayInputs.monthlyBurn} monthly burn, the current runway is approximately ${Math.floor(parseFloat(wizardData.runwayInputs.cashOnHand.replace(/[^0-9.]/g, '')) / parseFloat(wizardData.runwayInputs.monthlyBurn.replace(/[^0-9.]/g, '')) || 6)} months.

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
- Debt: ${wizardData.runwayInputs.hasDebt ? `${wizardData.runwayInputs.debtAmount} (${wizardData.runwayInputs.debtMaturity} to maturity)` : 'None'}

**Signals Identified**: ${wizardData.signalChecklist.signals.join(', ') || 'None selected'}

**Additional Notes**: ${wizardData.signalChecklist.notes || 'None provided'}`,
    rawJson: wizardData,
  };
};
