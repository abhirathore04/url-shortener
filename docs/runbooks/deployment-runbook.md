# Deployment Runbook - URL Shortener

## Overview

This runbook provides step-by-step procedures for deploying the URL Shortener service to different environments.

## Prerequisites

- [ ] Docker and Docker Compose installed
- [ ] Access to container registry
- [ ] Environment secrets configured
- [ ] Database backups current (production only)

## Environments

### Development Environment
- **Purpose:** Local development and testing
- **Infrastructure:** Local Docker containers
- **URL:** http://localhost:8080

### Staging Environment  
- **Purpose:** Pre-production testing
- **Infrastructure:** Staging server
- **URL:** https://staging.urlshortener.dev

### Production Environment
- **Purpose:** Live service
- **Infrastructure:** Production cluster
- **URL:** https://api.urlshortener.com

## Standard Deployment Process

### 1. Pre-Deployment Checklist

- [ ] All tests passing in CI/CD
- [ ] Security scans completed without critical issues
- [ ] Database migrations reviewed and tested
- [ ] Rollback plan prepared
- [ ] Stakeholders notified (production only)

### 2. Deployment Steps

#### Using Deployment Script (Recommended)

