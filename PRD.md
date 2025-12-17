# Product Requirements Document: Railier

## 1. Product Overview

**Railier** is a visual, drag-and-drop environment for building guardrails for LLMs. Think **Scratch for AI governance** - a no-code platform where anyone can visually design compliance rules, safety policies, and operational guardrails for AI systems.

### Core Concept
- **Scratch-like Interface**: Visual blocks that snap together to create logic flows
- **AI-Powered Block Generation**: Use LLMs to generate new blocks and suggest connections
- **Company Compliance Focus**: Build and enforce company policies, compliance rules, and operational guidelines
- **No-Code Visual Builder**: Compliance officers, legal teams, and domain experts can build guardrails without writing code

### Unique Value Proposition
- **Visual-First Design**: Drag blocks, connect them, see the logic flow instantly
- **AI-Assisted Creation**: Describe what you need in natural language, get ready-to-use blocks
- **Universal Guardrails**: Works for any company compliance need - HR policies, legal requirements, safety rules, data governance
- **Instant Deployment**: Build a guardrail, test it, deploy it - all in one interface

---

## 2. Problem Statement

### Current Challenges
1. **Compliance is Hard-Coded**: Every policy change requires engineering work and deployment cycles
2. **Non-Technical Teams Blocked**: Compliance officers and legal teams can't build or modify guardrails themselves
3. **LLMs Need Guardrails**: Companies want to use LLMs but need strict controls around what they can and cannot do
4. **Policy Documents Sit Idle**: Companies have 100s of pages of policies that aren't enforced in their AI systems
5. **Complex Logic is Inaccessible**: Building conditional rules requires programming knowledge

### Target Users
- **Primary**: Compliance officers, legal teams, policy managers
- **Secondary**: HR teams, risk managers, security teams
- **Tertiary**: AI/ML engineers, product managers
- **Target Companies**: Any company using or planning to use LLMs (from startups to enterprises)

---

## 3. Core Features

### 3.1 Visual Block Builder ⭐ (Core Feature)

**Scratch-Inspired Canvas**:
- Drag blocks from a palette onto a canvas
- Snap blocks together to create logic flows
- Visual connections show how rules flow together
- Color-coded blocks for different types (conditions, actions, data, logic)

**Block Types**:
- **Input Blocks**: User message, context data, conversation history
- **Condition Blocks**: Check if something is true/false (contains, equals, matches pattern)
- **Logic Blocks**: AND, OR, NOT gates to combine conditions
- **Action Blocks**: Block message, require approval, add warning, modify response, log event
- **Data Blocks**: Company policies, user roles, context variables
- **LLM Blocks**: Ask an LLM to evaluate something, generate a response

**Visual Features**:
- **Block Snapping**: Blocks magnetically snap together
- **Connection Lines**: Visual lines show data flow between blocks
- **Block Categories**: Organized palette (Logic, Conditions, Actions, Data, AI)
- **Zoom & Pan**: Navigate large rule flows easily
- **Minimap**: Overview of entire rule structure

**Block Configuration**:
- **Click to Edit**: Click any block to open configuration panel
- **Adjustable Parameters**: Change thresholds, keywords, conditions, actions
- **Live Preview**: See how changes affect the guardrail in real-time
- **Examples**:
  - Condition block: Change "contains 'salary'" to "contains 'compensation' OR 'salary'"
  - Threshold block: Adjust from "$10,000" to "$5,000"
  - Action block: Change "Block" to "Require Approval"
  - LLM block: Modify the prompt or change temperature settings
- **Validation**: Real-time validation ensures valid configurations
- **Reset Option**: Revert block to default settings if needed

### 3.2 AI-Powered Block Generation

**Natural Language to Blocks**:
- Describe what you want: "Block any requests about employee salaries unless the user is in HR"
- LLM generates the appropriate blocks and connections
- Preview the generated blocks before adding to canvas
- **Fully Adjustable**: All AI-generated blocks can be edited, reconfigured, or replaced
- Click any generated block to adjust parameters, thresholds, or logic
- Edit and refine the AI-generated structure to match your exact requirements

**Smart Suggestions**:
- AI suggests relevant blocks as you build
- Recommends connections between existing blocks
- Identifies gaps in logic ("You might want to add error handling here")
- Suggests improvements ("This could be simplified by...")

**Policy Document Import**:
- Upload company policy documents (PDF, TXT, DOCX)
- LLM extracts rules and generates block structures
- Review and edit the extracted rules visually
- One-click to add policy rules to canvas

### 3.3 Connection System

**Visual Connections**:
- Drag from one block's output to another block's input
- Different connection types (data flow, conditional logic, sequence)
- Color-coded connections for clarity
- Connection validation (prevent invalid connections)

**Connection Logic**:
- **Sequential**: Execute blocks in order
- **Conditional**: Only execute if condition is met
- **Parallel**: Execute multiple branches simultaneously
- **Loop**: Repeat a set of blocks

### 3.4 Block Library

**Pre-Built Block Templates**:

**Compliance Blocks**:
- "Check User Role" - Verify user has specific permissions
- "Policy Lookup" - Check against company policy
- "Data Classification Check" - Verify data sensitivity level
- "Jurisdiction Check" - Ensure compliance with regional laws

**Safety Blocks**:
- "Toxicity Filter" - Block harmful content
- "PII Detection" - Identify and protect personal information
- "Jailbreak Detection" - Prevent prompt injection attacks
- "Hallucination Check" - Verify factual accuracy

**Business Logic Blocks**:
- "Rate Limit" - Throttle requests
- "Time-Based Rules" - Apply rules based on time/date
- "Cost Threshold" - Monitor and limit AI usage costs
- "Approval Workflow" - Route to human review

**Data Blocks**:
- "Load Policy Document" - Reference company policies
- "User Context" - Access user metadata
- "Conversation History" - Check previous messages
- "External API Call" - Fetch data from external systems

### 3.5 Testing & Simulation

**Test Runner**:
- Input test messages/scenarios
- See how they flow through your guardrail blocks
- Visual highlighting shows which blocks activated
- Step-by-step execution view

**Test Library**:
- Save common test cases
- Auto-generate edge case tests
- Batch testing mode (run 100s of tests)
- Pass/fail dashboard

**Live Simulation**:
- Real-time preview of guardrail behavior
- Test against actual LLM responses
- See exact decision paths and reasoning

### 3.6 Deployment & Monitoring

**One-Click Deployment**:
- Activate guardrail with a single button
- Version control (rollback to previous versions)
- A/B testing (test new version against old)
- Gradual rollout (10% → 50% → 100%)

**Real-Time Monitoring**:
- Dashboard showing guardrail activations
- Which blocks are triggering most often
- False positive/negative rates
- Performance metrics (latency, throughput)

**Alerts & Notifications**:
- Alert when guardrail triggers
- Daily/weekly summary reports
- Integration with Slack, Teams, email
- Custom notification rules

---

## 4. User Experience Flow

### Example: Building a "No Salary Information" Guardrail

1. **User opens blank canvas**
   - Clean workspace with block palette on the left

2. **User describes what they want**
   - Types: "Don't let the AI share employee salary information unless the user is in HR"
   - AI generates suggested blocks

3. **AI generates initial structure**:
   ```
   [User Message] → [Contains "salary"?] → [Check User Role]
                                              ├─ If HR → [Allow]
                                              └─ If Not HR → [Block & Explain]
   ```

4. **User refines and adjusts the blocks**
   - Drags blocks to adjust layout
   - **Clicks on "Contains salary?" block** to adjust the keyword matching
     - Changes to: "contains 'salary' OR 'compensation' OR 'pay'"
   - **Clicks on "Check User Role" block** to add more conditions
     - Adds: "or if user is the employee themselves"
   - **Adjusts the "Block & Explain" action block** to customize the message
     - Sets custom message: "This information is confidential. Please contact HR directly."
   - Adds logging block to track blocked attempts

5. **User tests the guardrail**
   - Types test message: "What is John's salary?"
   - Sees visual flow showing block activations
   - Adjusts logic based on test results

6. **User deploys**
   - Clicks "Activate Guardrail"
   - Guardrail is now live and protecting the AI system

---

## 5. Technical Architecture
Use Turbo repo for monorepo management and pnpm for package management
### Frontend Stack
```javascript
- Canvas Engine: React Flow 
- UI Framework: React 19 + TypeScript
- Styling: TailwindCSS + shadcn/ui components
- State Management: Zustand
- Build Tool: Vite
- Block Rendering: Custom SVG-based components (Scratch-like aesthetic)
```

### Backend Stack
```python
- API Framework: FastAPI
- Rule Engine: Custom Python engine with block execution runtime
- Database: PostgreSQL (for rule storage, user data, audit logs)
- LLM Integration:
  - Primary: Ollama with Qwen or Llama models (local, privacy-first)
  - Fallback: Gemini API for complex reasoning
- Document Processing: PyMuPDF, python-docx for policy imports
```

### Block Execution Runtime
```python
class Block:
    id: str
    type: "input" | "condition" | "action" | "logic" | "data" | "llm"
    inputs: List[Connection]
    outputs: List[Connection]
    config: Dict[str, Any]  # Block-specific configuration

    def execute(self, context: Dict) -> BlockResult:
        # Execute block logic
        pass

class GuardrailRuntime:
    def evaluate(self, blocks: List[Block], input_data: Dict) -> Decision:
        # Execute blocks in dependency order
        # Return final decision + execution trace
        pass
```

### Deployment Options
- **Cloud SaaS**: Hosted version for quick start
- **On-Premise**: Docker deployment for data sensitivity
- **API-Only**: Integrate guardrail evaluation into existing systems

---

## 6. Key User Stories

### Story 1: HR Policy Enforcement
> "As an HR compliance officer, I want to prevent our AI chatbot from sharing salary information with unauthorized users, so we maintain confidentiality and comply with company policy."

**Implementation**:
- Create "Salary Information" guardrail
- Add condition: Message contains salary keywords
- Add check: User role is HR or Manager
- Add action: Block message and explain why

### Story 2: Data Privacy Protection
> "As a legal team member, I want to ensure our AI never shares customer PII outside approved channels, so we comply with GDPR and data protection laws."

**Implementation**:
- Create "PII Protection" guardrail
- Add PII detection block (email, phone, SSN)
- Add channel check (internal vs external)
- Add action: Redact PII or block entirely

### Story 3: Financial Information Control
> "As a compliance officer at a bank, I want to prevent our AI from providing investment advice unless the user is a licensed advisor, per SEC regulations."

**Implementation**:
- Create "Investment Advice" guardrail
- Add keyword detection (buy, sell, invest recommendations)
- Add license verification check
- Add action: Require human advisor approval

### Story 4: Brand Safety
> "As a marketing manager, I want to ensure our AI always follows brand voice guidelines and never makes promises we can't keep."

**Implementation**:
- Create "Brand Safety" guardrail
- Upload brand guidelines document
- AI extracts dos and don'ts into blocks
- Add LLM evaluation block for tone checking
- Add action: Flag for review if guidelines violated

### Story 5: Cost Control
> "As an operations manager, I want to limit expensive AI operations and require approval for high-cost requests."

**Implementation**:
- Create "Cost Control" guardrail
- Add estimated cost calculation block
- Add threshold condition (>$10)
- Add action: Route to manager approval queue

---

## 7. Success Metrics

### Hackathon/MVP Goals
1. **Usability**: Non-technical user can build a working guardrail in <5 minutes
2. **AI Generation**: Successfully generate blocks from natural language 80%+ of the time
3. **Visual Clarity**: User can understand a guardrail flow just by looking at it
4. **Performance**: <100ms evaluation time for typical guardrail

### Post-Launch Targets (6 months)
- **Adoption**: 100+ companies using Railier
- **Guardrails Created**: 1,000+ active guardrails in production
- **User Satisfaction**: >4.5/5 rating from compliance teams
- **Time Savings**: 90% reduction in time to deploy new compliance rules (days → minutes)

---

## 8. Competitive Landscape

### Current Alternatives

| Solution | Approach | Pros | Cons |
|----------|----------|------|------|
| **Guardrails AI** | Code-based validators | Powerful, flexible | Requires programming |
| **NeMo Guardrails** | Policy language | Structured, versioned | Steep learning curve |
| **Custom Code** | Engineers build guardrails | Fully customizable | Slow, expensive, non-scalable |
| **LLM Prompting** | Instructions in prompts | Easy to start | Unreliable, not auditable |

### Railier's Differentiation
- **Only visual-first tool**: No code required, truly accessible to non-technical teams
- **AI-assisted building**: Generate guardrails from natural language
- **Universal application**: Not limited to one domain or use case
- **Instant deployment**: No code deployment or engineering bottleneck

---

## 9. Development Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] Visual canvas with block palette
- [ ] 10 essential block types (conditions, actions, logic)
- [ ] Basic drag-and-drop functionality
- [ ] Simple connection system
- [ ] Test runner with visual execution trace
- [ ] Save/load guardrails

### Phase 2: AI Features (Weeks 5-8)
- [ ] Natural language to blocks generation
- [ ] Policy document import and extraction
- [ ] AI block suggestions
- [ ] Smart connection recommendations
- [ ] Block library with 20+ pre-built templates

### Phase 3: Production Ready (Weeks 9-12)
- [ ] Deployment management (versioning, rollback)
- [ ] Real-time monitoring dashboard
- [ ] Alerts and notifications
- [ ] User authentication and permissions
- [ ] API for external integrations
- [ ] Documentation and tutorials

### Phase 4: Scale (Months 4-6)
- [ ] Collaborative editing (multiple users)
- [ ] Advanced analytics
- [ ] Custom block creation (for power users)
- [ ] Enterprise features (SSO, audit logs)
- [ ] Marketplace for community-built guardrails

---

## 10. Hackathon Scope

### Must-Have for Demo
- [x] Visual canvas with drag-and-drop blocks
- [x] 5-7 core block types (input, condition, action, logic)
- [x] Connection system (drag to connect blocks)
- [x] AI-powered block generation (simple version)
- [x] Test runner showing execution flow
- [x] One complete example: "Salary Information Protection"

### Nice-to-Have
- [ ] Policy document import
- [ ] Block library with templates
- [ ] Monitoring dashboard
- [ ] Multiple guardrail examples

### Out of Scope
- Deployment infrastructure
- User authentication
- Real-time collaboration
- Mobile version

---

## 11. Demo Flow (5 minutes)

**Opening**: "We built Scratch for AI governance"

1. **Show the problem (30s)**:
   - Company has policy: Don't share salary info
   - Traditional approach: Engineers code it, takes weeks
   - Railier approach: Compliance officer builds it visually, takes minutes

2. **Build a guardrail live (2m)**:
   - Start with blank canvas
   - Say: "Block salary questions unless user is in HR"
   - AI generates initial block structure
   - **Click a block to adjust parameters** (e.g., add "compensation" to keyword list)
   - Drag blocks to refine layout
   - Add additional logic visually
   - Show Scratch-like snapping and connections

3. **Test it (1m)**:
   - Type test message: "What's Sarah's salary?"
   - Show visual flow lighting up as it evaluates
   - Show it blocks the message with explanation
   - Test with HR user - shows it allows the request

4. **Show AI assistance (1m)**:
   - Upload a company policy document (1-page sample)
   - AI extracts rules and generates blocks
   - Show how it becomes a visual guardrail instantly

5. **Closing - The vision (30s)**:
   - "Any company policy can become a visual guardrail"
   - "No code required, deployed in minutes not weeks"
   - "Scratch for AI - empowering non-technical teams to control AI safely"

---

## 12. Market Opportunity

### Target Market
- **Total Addressable Market**: Every company using LLMs
  - GPT-4 has 100M+ weekly active users across businesses
  - 92% of Fortune 500 companies using AI (2024)
  - Compliance software market: $78B globally

### Pain Point Validation
- 67% of companies cite "lack of control" as top barrier to LLM adoption
- Compliance teams wait average 3-6 weeks for policy changes to be implemented
- 80% of compliance officers have no programming experience
- Companies spending $500K-$5M/year on AI compliance and safety

### Initial Target Customers
1. **Mid-size Companies (100-1000 employees)**:
   - Using LLMs in customer service, internal tools
   - Have compliance requirements but limited engineering resources
   - Budget: $50K-$200K/year for governance tools

2. **Regulated Industries**:
   - Healthcare (HIPAA compliance)
   - Finance (SOC2, financial regulations)
   - Legal services (client confidentiality)
   - Government contractors (data protection)

### Why They'll Pay
- ✅ Deploy policy changes in minutes vs weeks (10x faster)
- ✅ Empower compliance teams directly (no engineering bottleneck)
- ✅ Visual auditability (show regulators exactly how AI is controlled)
- ✅ Reduce compliance costs by 60% (fewer specialized engineers needed)

---

## 13. Pricing (Post-MVP)

### SaaS Tiers
- **Starter**: $500/month
  - 10 active guardrails
  - 100K evaluations/month
  - Community support

- **Professional**: $2,000/month
  - Unlimited guardrails
  - 1M evaluations/month
  - Priority support
  - Advanced analytics

- **Enterprise**: Custom
  - Unlimited everything
  - On-premise deployment option
  - Custom integrations
  - Dedicated support

### Add-ons
- AI Block Generation: $0.001 per generation
- Policy Document Processing: $50 per document
- Premium Block Library: $200/month

---

## 14. Technical Considerations

### Block Execution Performance
- Target: <100ms per guardrail evaluation
- Parallel block execution where possible
- Caching for expensive operations (LLM calls, API requests)
- Connection to evaluation order optimization

### Scalability
- Handle 1000+ blocks in a single guardrail (complex enterprise policies)
- Support 100+ concurrent guardrail evaluations
- Real-time updates without page refresh

### LLM Integration Strategy
- **Local-first**: Use Ollama for block generation (privacy, cost)
- **Cloud fallback**: Claude API for complex reasoning
- **User choice**: Let users bring their own LLM API keys

### Data Privacy
- Policy documents stay encrypted at rest
- Option for on-premise deployment (no data leaves company)
- SOC2 Type II compliance
- GDPR compliant data handling

---

## Quick Start Checklist

### Before Development
- [ ] Review React Flow documentation
- [ ] Study Scratch's visual design language
- [ ] Set up Ollama locally with Qwen model
- [ ] Gather sample company policy documents for testing

### Day 1 Goals
- [ ] Basic canvas with block palette
- [ ] Drag-and-drop blocks onto canvas
- [ ] Simple connection system
- [ ] 3-5 core block types implemented

### Day 2 Goals
- [ ] AI block generation (basic)
- [ ] Test runner with visual execution
- [ ] Complete one demo scenario
- [ ] Polish UI for demo

---

**Document Version**: 3.0 (Visual Builder Edition)
**Last Updated**: 2025-12-16
**Vision**: Scratch for AI Governance
**Target**: Universal (any company using LLMs)
**Status**: Ready for Development
