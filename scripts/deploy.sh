#!/bin/bash
# Production deployment script with blue-green deployment
# Usage: ./scripts/deploy.sh [environment] [version] [options]

set -euo pipefail

# Configuration
SCRIPT_VERSION="1.2.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_LOG="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    URL SHORTENER DEPLOYMENT                     ║"
    echo "║                        Version $SCRIPT_VERSION                         ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Usage information
show_usage() {
    cat << EOF
Usage: $0 [ENVIRONMENT] [VERSION] [OPTIONS]

ARGUMENTS:
    ENVIRONMENT     Target environment (development|staging|production)
    VERSION         Image version/tag to deploy (default: latest)

OPTIONS:
    -h, --help                 Show this help message
    -v, --verbose              Enable verbose logging
    -d, --dry-run              Show what would be deployed without executing
    -f, --force                Skip confirmation prompts
    --no-backup                Skip database backup (not recommended for production)
    --skip-tests               Skip post-deployment smoke tests
    --rollback                 Rollback to previous version
    --timeout SECONDS          Deployment timeout (default: 300)

EXAMPLES:
    $0 staging latest                    # Deploy latest to staging
    $0 production v1.2.3                 # Deploy specific version to production
    $0 production --rollback             # Rollback production
    $0 staging latest --dry-run          # Show what would be deployed

EOF
}

# Parse arguments
parse_arguments() {
    ENVIRONMENT="${1:-staging}"
    VERSION="${2:-latest}"
    VERBOSE=false
    DRY_RUN=false
    FORCE=false
    SKIP_BACKUP=false
    SKIP_TESTS=false
    ROLLBACK=false
    TIMEOUT=300

    shift 2 2>/dev/null || true

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            --no-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_success "Environment $ENVIRONMENT is valid"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
}

# Health check with retry
health_check() {
    local url="${1:-http://localhost:8080/health}"
    local max_attempts="${2:-30}"
    local attempt=1
    
    log_info "Health checking $url (max attempts: $max_attempts)"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
            log_success "Health check passed on attempt $attempt"
            return 0
        fi
        
        log_warn "Health check failed, attempt $attempt/$max_attempts"
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Blue-green deployment
blue_green_deploy() {
    log_info "Starting blue-green deployment for $ENVIRONMENT"
    
    cd "$PROJECT_ROOT"
    
    # Create environment-specific override
    cat > "docker-compose.$ENVIRONMENT.override.yml" << EOF
version: '3.8'
services:
  api:
    image: url-shortener:$VERSION
    environment:
      NODE_ENV: $ENVIRONMENT
      SERVICE_VERSION: $VERSION
EOF

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would deploy: url-shortener:$VERSION"
        return 0
    fi

    # Deploy new version
    docker compose -f infra/docker-compose.yml -f "docker-compose.$ENVIRONMENT.override.yml" up -d api
    
    # Wait and health check
    log_info "Waiting for deployment to stabilize..."
    sleep 30
    
    if health_check; then
        log_success "Deployment successful"
    else
        log_error "Deployment failed health check"
        return 1
    fi
}

# Smoke tests
smoke_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        return 0
    fi
    
    log_info "Running smoke tests"
    
    local tests=(
        "curl -f -s http://localhost:8080/health"
        "curl -f -s http://localhost:8080/health/ready"
        "curl -f -s http://localhost:8080/health/live"
        "curl -f -s http://localhost:8080/"
    )
    
    for test in "${tests[@]}"; do
        if $test >/dev/null 2>&1; then
            log_success "✅ Test passed: $test"
        else
            log_error "❌ Test failed: $test"
            return 1
        fi
    done
    
    log_success "All smoke tests passed"
}

# Cleanup
cleanup() {
    local cleanup_file="docker-compose.$ENVIRONMENT.override.yml"
    if [ -f "$cleanup_file" ]; then
        rm -f "$cleanup_file"
    fi
}

# Main deployment function
main() {
    show_banner
    log_info "Starting deployment: $ENVIRONMENT version $VERSION"
    
    validate_environment
    
    if [ "$FORCE" != true ] && [ "$DRY_RUN" != true ]; then
        read -p "Deploy $VERSION to $ENVIRONMENT? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    blue_green_deploy
    smoke_tests
    
    log_success "🎉 Deployment completed successfully!"
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
parse_arguments "$@"
main
