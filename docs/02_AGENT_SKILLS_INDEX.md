# Agent Skills Index (v0.1)

This index provides the authoritative mapping of functional domains to the specialized agent skills required to govern them.

| Domain | Governing Agent Skill | Instruction File (SKILL.md) |
|--------|-----------------------|-----------------------------|
| **Database Schema & Migrations** | `schema-first-builder` | `.agent/skills/schema-first-builder/SKILL.md` |
| **ToC Graph Modeling & Versioning** | `toc-graph-engine` | `.agent/skills/toc-graph-engine/SKILL.md` |
| **Tenant Isolation & RLS** | `rls-rbac-guardian` | `.agent/skills/rls-rbac-guardian/SKILL.md` |
| **Validation Gates & Metrics** | `gates-and-health-computation` | `.agent/skills/gates-and-health-computation/SKILL.md` |
| **Specification Compliance** | `spec-compliance-auditor` | `.agent/skills/spec-compliance-auditor/SKILL.md` |

## Consumption Rules
- AI agents MUST read the corresponding `SKILL.md` before performing any task in the mapped domain.
- Skill compliance checklists MUST be output at the start of any implementation phase.
