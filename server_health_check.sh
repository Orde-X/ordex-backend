#!/usr/bin/env bash 
set -euo pipefail

LOG_FILE=$(mktemp /tmp/server_health.XXXXX)
readonly LOG_FILE

log_info() { echo "[INFO] $1" | tee -a "$LOG_FILE"; }
log_error() { echo "[ERROR] $1" | tee -a "$LOG_FILE" >&2; }

print_usage() {
    echo "Usage: $0 -f <server_list_file> -u <remote_user>"
}

cleanup() {
    echo "Cleaning up temporary log file: $LOG_FILE"
    rm -f "$LOG_FILE"
}

trap cleanup EXIT INT TERM

check_server() {
    local server="$1"
    local user="$2"
    log_info "--- Checking Server: $server ---"
    
    # Added StrictHostKeyChecking=no for automated environments
    ssh -n -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${user}@${server}" << 'EOF'
        echo "--- System Uptime ---"
        uptime
        echo "--- Disk Usage (Root /) ---"
        df -h / | awk 'NR==2 {print "Used: " $5 " (" $3 "/" $2 ")"}'
        echo "--- Memory Usage ---"
        free -m | awk 'NR==2 {printf "Used: %sMB / Total: %sMB (%.2f%%)\n", $3, $2, ($3/$2)*100}'
EOF
    log_info "--- Finished Check: $server ---"
}

main() {
    local server_file=""
    local remote_user=""

    while getopts "f:u:h" opt; do
        case "$opt" in
            f) server_file="$OPTARG" ;;
            u) remote_user="$OPTARG" ;;
            h) print_usage; exit 0 ;;
            *) print_usage; exit 1 ;;
        esac
    done

    if [[ -z "$server_file" || -z "$remote_user" ]]; then
        log_error "Missing required arguments."
        print_usage
        exit 1
    fi

    declare -a servers=()
    while IFS= read -r line || [[ -n "$line" ]]; do
        [[ -z "$line" || "$line" == \#* ]] && continue
        servers+=("$line")
    done < "$server_file"

    log_info "Found ${#servers[@]} servers. Starting health checks..."
    for server_host in "${servers[@]}"; do
        check_server "$server_host" "$remote_user"
    done
    log_info "All checks completed."
}

main "$@"