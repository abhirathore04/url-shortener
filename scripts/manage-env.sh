#!/bin/bash
# Environment management script for URL Shortener
# Usage: ./scripts/manage-env.sh [command] [options]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Usage
show_usage() {
    cat << EOF
URL Shortener Environment Management

Usage: $0 COMMAND [OPTIONS]

COMMANDS:
    start [env]      Start environment (development|staging|production)
    stop             Stop all services
    restart [env]    Restart environment  
    status           Show service status and health
    logs [service]   View logs (optionally for specific service)
    shell [service]  Open shell in service container
    build            Build application images
    clean            Clean up containers and volumes
    backup           Create database backup
    test             Run health checks and tests
    monitor          Open monitoring dashboards

OPTIONS:
    -h, --help       Show this help
    -f, --follow     Follow logs
    --no-cache       Build without cache

EXAMPLES:
    $0 start staging          # Start staging environment
    $0 logs api -f            # Follow API logs
    $0 shell api              # Shell into API container
    $0 status                 # Show all service status

EOF
}

# Check Docker
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
}

# Start environment
start_env() {
    local env=${1:-development}
    log_info "Starting $env environment"
    
    cd "$PROJECT_ROOT"
    
    # Environment-specific configuration
    case $env in
        development)
            export NODE_ENV=development
            export LOG_LEVEL=debug
            ;;
        staging)
            export NODE_ENV=staging
            export LOG_LEVEL=info
            ;;
        production)
            export NODE_ENV=production
            export LOG_LEVEL=warn
            ;;
    esac
    
    docker compose -f infra/docker-compose.yml up -d
    
    log_info "Waiting for services to start..."
    sleep 15
    
    check_service_health
    log_success "Environment $env started"
    show_service_urls
}

# Stop environment  
stop_env() {
    log_info "Stopping all services"
    cd "$PROJECT_ROOT"
    docker compose -f infra/docker-compose.yml down
    log_success "Services stopped"
}

# Show status
show_status() {
    log_info "Service Status"
    echo "===================="
    
    cd "$PROJECT_ROOT"
    docker compose -f infra/docker-compose.yml ps --format table
    
    echo -e "\n${BLUE}Health Checks:${NC}"
    check_service_health
    
    echo -e "\n${BLUE}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || true
}

# Check service health
check_service_health() {
    local services=(
        "http://localhost:8080/health|API Service"
        "http://localhost:9090/api/v1/query?query=up|Prometheus"
        "http://localhost:3000/api/health|Grafana"
    )
    
    for service_info in "${services[@]}"; do
        local url=$(echo "$service_info" | cut -d'|' -f1)
        local name=$(echo "$service_info" | cut -d'|' -f2)
        
        if curl -f -s --max-time 5 "$url" >/dev/null 2>&1; then
            echo "✅ $name: Healthy"
        else
            echo "❌ $name: Unhealthy"
        fi
    done
}

# Show service URLs
show_service_urls() {
    echo -e "\n${BLUE}Service URLs:${NC}"
    echo "🌐 API:          http://localhost:8080"
    echo "🏥 Health:       http://localhost:8080/health"
    echo "📊 Metrics:      http://localhost:8080/metrics"
    echo "🗄️ MongoDB:       mongodb://localhost:27017"
    echo "🔍 Prometheus:   http://localhost:9090"
    echo "📈 Grafana:      http://localhost:3000 (admin/admin)"
    echo "🕵️ Jaeger:       http://localhost:16686"
    echo
}

# View logs
view_logs() {
    local service=${1:-""}
    local follow=${2:-false}
    
    cd "$PROJECT_ROOT"
    
    local args=("logs" "--tail=100")
    
    if [ "$follow" = true ]; then
        args+=("-f")
    fi
    
    if [ -n "$service" ]; then
        args+=("$service")
    fi
    
    docker compose -f infra/docker-compose.yml "${args[@]}"
}

# Open shell
open_shell() {
    local service=${1:-api}
    
    cd "$PROJECT_ROOT"
    
    if ! docker compose -f infra/docker-compose.yml ps "$service" | grep -q "running"; then
        log_error "Service $service is not running"
        exit 1
    fi
    
    docker compose -f infra/docker-compose.yml exec "$service" /bin/sh
}

# Build images
build_images() {
    local no_cache=${1:-false}
    
    log_info "Building images"
    cd "$PROJECT_ROOT"
    
    local args=("build")
    if [ "$no_cache" = true ]; then
        args+=("--no-cache")
    fi
    
    docker compose -f infra/docker-compose.yml "${args[@]}"
    log_success "Build completed"
}

# Clean up
cleanup() {
    log_info "Cleaning up"
    cd "$PROJECT_ROOT"
    
    docker compose -f infra/docker-compose.yml down -v
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Create backup
create_backup() {
    log_info "Creating backup"
    
    local backup_dir="$PROJECT_ROOT/backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p "$backup_dir"
    
    cd "$PROJECT_ROOT"
    
    if docker compose -f infra/docker-compose.yml exec mongo mongodump --out /tmp/backup --quiet; then
        docker cp "$(docker compose -f infra/docker-compose.yml ps -q mongo):/tmp/backup" "$backup_dir/backup_$timestamp"
        log_success "Backup created: $backup_dir/backup_$timestamp"
    else
        log_error "Backup failed"
    fi
}

# Run tests
run_tests() {
    log_info "Running health checks"
    
    local tests=(
        "curl -f http://localhost:8080/health"
        "curl -f http://localhost:8080/health/ready"  
        "curl -f http://localhost:8080/health/live"
        "curl -f http://localhost:8080/"
    )
    
    local passed=0
    local total=${#tests[@]}
    
    for test in "${tests[@]}"; do
        if $test >/dev/null 2>&1; then
            echo "✅ $test"
            ((passed++))
        else
            echo "❌ $test"
        fi
    done
    
    if [ $passed -eq $total ]; then
        log_success "All tests passed ($passed/$total)"
    else
        log_error "Some tests failed ($passed/$total)"
    fi
}

# Open monitoring
open_monitoring() {
    log_info "Opening monitoring dashboards"
    
    echo "📊 Prometheus: http://localhost:9090"
    echo "📈 Grafana:    http://localhost:3000"
    echo "🕵️ Jaeger:     http://localhost:16686"
    
    # Try to open URLs (works on macOS/Linux with appropriate tools)
    command -v open >/dev/null && {
        open http://localhost:9090
        open http://localhost:3000  
        open http://localhost:16686
    } || command -v xdg-open >/dev/null && {
        xdg-open http://localhost:9090 >/dev/null 2>&1 &
        xdg-open http://localhost:3000 >/dev/null 2>&1 &
        xdg-open http://localhost:16686 >/dev/null 2>&1 &
    } || echo "💡 Tip: Open the URLs above in your browser"
}

# Main function
main() {
    local command=${1:-""}
    
    if [ -z "$command" ]; then
        show_usage
        exit 1
    fi
    
    case $command in
        help|-h|--help)
            show_usage
            ;;
        *)
            check_docker
            ;;
    esac
    
    case $command in
        start)
            start_env "${2:-development}"
            ;;
        stop)
            stop_env
            ;;
        restart)
            stop_env
            sleep 3
            start_env "${2:-development}"
            ;;
        status)
            show_status
            ;;
        logs)
            local follow=false
            if [ "${3:-}" = "-f" ]; then
                follow=true
            fi
            view_logs "${2:-}" "$follow"
            ;;
        shell)
            open_shell "${2:-api}"
            ;;
        build)
            local no_cache=false
            if [ "${2:-}" = "--no-cache" ]; then
                no_cache=true
            fi
            build_images "$no_cache"
            ;;
        clean)
            cleanup
            ;;
        backup)
            create_backup
            ;;
        test)
            run_tests
            ;;
        monitor)
            open_monitoring
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Make scripts executable and run
main "$@"
