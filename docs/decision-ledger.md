# Architecture Decision Ledger

This document tracks all architectural decisions made for the URL Shortener project.

## Decision Overview

| ADR | Date | Title | Status | Impact | Owner |
|-----|------|-------|--------|--------|-------|
| [ADR-0001](adr/ADR-0001-containerization.md) | 2025-08-21 | Containerization with Docker | Accepted | High | Team |
| [ADR-0002](adr/ADR-0002-database-choice.md) | 2025-08-21 | MongoDB as Primary Database | Accepted | High | Team |
| [ADR-0003](adr/ADR-0003-observability.md) | 2025-08-21 | Observability Stack Selection | Accepted | Medium | Team |
| [ADR-0004](adr/ADR-0004-ci-cd-pipeline.md) | 2025-08-21 | GitHub Actions CI/CD | Accepted | Medium | Team |

## Decision Categories

### Infrastructure & DevOps
- ADR-0001: Containerization Strategy
- ADR-0004: CI/CD Pipeline Selection

### Data & Storage  
- ADR-0002: Database Technology Choice

### Monitoring & Operations
- ADR-0003: Observability Stack

## Metrics Impact Tracking

| Metric | Baseline | Current | Target | Trend | Related ADRs |
|--------|----------|---------|--------|-------|-------------|
| Deployment Time | 30min | 5min | 3min | ↓ | ADR-0001, ADR-0004 |
| MTTR | Unknown | 10min | 5min | ↓ | ADR-0003 |
| Test Coverage | 0% | 75% | 85% | ↑ | ADR-0004 |
| Error Rate | Unknown | <1% | <0.5% | → | ADR-0002, ADR-0003 |

## Review Schedule

- **Monthly:** Review all Accepted ADRs for continued relevance
- **Quarterly:** Assess metrics impact and update targets
- **Annually:** Comprehensive architecture review

## Decision-Making Process

1. **Identify Decision Need:** When faced with significant architectural choice
2. **Research Options:** Investigate 2-3 viable alternatives  
3. **Create ADR:** Use template to document analysis
4. **Team Review:** Discuss with stakeholders and experts
5. **Decision:** Mark as Accepted/Rejected with rationale
6. **Implementation:** Execute decision with clear success metrics
7. **Monitor:** Track metrics and review effectiveness

## Contact

For questions about architectural decisions, contact the development team or create an issue in the project repository.
