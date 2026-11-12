#!/usr/bin/env python3
"""
GRAND PRIX TELEMETRY // AUTONOMOUS AGENT PROGRESS & AUDIT TELEMETRY ENGINE
Usage:
  python3 scripts/progress.py               # Render progress dashboard & verify DAG consistency
  python3 scripts/progress.py --verify-done # Also execute all verification commands of DONE tasks
  python3 scripts/progress.py --json        # Output raw machine-readable JSON metrics
"""

import sys
import os
import json
import subprocess
import argparse

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASKS_FILE = os.path.join(ROOT_DIR, "TASKS.json")

def get_git_commits():
    try:
        res = subprocess.run(
            ["git", "log", "--format=%h %s"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        commits = {}
        for line in res.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split(" ", 1)
            sha = parts[0]
            msg = parts[1] if len(parts) > 1 else ""
            commits[sha] = msg
        return commits
    except Exception:
        return {}

def run_cmd(cmd):
    try:
        res = subprocess.run(
            cmd,
            shell=True,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=15
        )
        return res.returncode == 0, res.stdout.strip(), res.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", "Timeout expired (15s)"
    except Exception as e:
        return False, "", str(e)

def main():
    parser = argparse.ArgumentParser(description="Grand Prix Telemetry Progress Engine")
    parser.add_argument("--verify-done", action="store_true", help="Run deterministic verification commands for completed tasks")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()

    if not os.path.exists(TASKS_FILE):
        print(f"Error: TASKS.json not found at {TASKS_FILE}", file=sys.stderr)
        sys.exit(1)

    with open(TASKS_FILE, "r") as f:
        data = json.load(f)

    tasks = data.get("tasks", [])
    task_map = {t["id"]: t for t in tasks}

    git_commits = get_git_commits()
    # Map task_id to matching commit SHAs
    task_commits = {}
    for sha, msg in git_commits.items():
        for t in tasks:
            if t["id"] in msg:
                task_commits[t["id"]] = sha

    # Phase aggregation
    phases = {}
    total_count = len(tasks)
    done_count = 0
    ready_count = 0
    blocked_count = 0
    in_progress_count = 0

    ready_tasks = []

    for t in tasks:
        p_num = t.get("phase", 0)
        p_name = t.get("phase_name", f"Fase {p_num}")
        if p_num not in phases:
            phases[p_num] = {
                "name": p_name,
                "total": 0,
                "done": 0,
                "ready": 0,
                "blocked": 0,
                "in_progress": 0
            }
        phases[p_num]["total"] += 1

        # Evaluate actual status based on dependencies
        deps = t.get("dependencies", [])
        deps_met = all(task_map.get(d, {}).get("status") == "DONE" for d in deps)

        cur_status = t.get("status", "BLOCKED")
        if cur_status == "DONE":
            phases[p_num]["done"] += 1
            done_count += 1
        elif cur_status == "IN_PROGRESS":
            phases[p_num]["in_progress"] += 1
            in_progress_count += 1
        else:
            if deps_met:
                phases[p_num]["ready"] += 1
                ready_count += 1
                ready_tasks.append(t)
            else:
                phases[p_num]["blocked"] += 1
                blocked_count += 1

    percent_overall = (done_count / total_count * 100.0) if total_count > 0 else 0.0

    # Verification of DONE tasks
    regressions = []
    if args.verify_done:
        for t in tasks:
            if t.get("status") == "DONE":
                cmd = t.get("verification_cmd")
                if cmd:
                    ok, out, err = run_cmd(cmd)
                    if not ok:
                        regressions.append({"id": t["id"], "cmd": cmd, "err": err or out})

    if args.json:
        metrics = {
            "overall_progress_percent": round(percent_overall, 2),
            "total_tasks": total_count,
            "done_tasks": done_count,
            "ready_tasks": ready_count,
            "blocked_tasks": blocked_count,
            "in_progress_tasks": in_progress_count,
            "phases": phases,
            "next_ready_tasks": [t["id"] for t in ready_tasks],
            "regressions": regressions
        }
        print(json.dumps(metrics, indent=2))
        sys.exit(0 if not regressions else 1)

    # Render ASCII F1 Telemetry Dashboard
    bar_width = 30
    filled = int(round(bar_width * (percent_overall / 100.0)))
    bar = "█" * filled + "░" * (bar_width - filled)

    print("=" * 88)
    print("🏁 GRAND PRIX TELEMETRY // AUTONOMOUS AGENT PROGRESS DASHBOARD")
    print("=" * 88)
    print(f"LAP PROGRESS: [{bar}] {percent_overall:.1f}% ({done_count}/{total_count} Tasks Completed)")
    print(f"REMAINING: {total_count - done_count} Tasks | IN PROGRESS: {in_progress_count} | READY TO PICK UP: {ready_count}")
    print("-" * 88)
    print(f"{'FASE':<32} {'TOTAL':>6} {'DONE':>6} {'READY':>6} {'BLOCKED':>8} {'% PROGRESS':>12} {'ESTADO':>10}")
    print("-" * 88)

    for p_num in sorted(phases.keys()):
        p = phases[p_num]
        pct = (p["done"] / p["total"] * 100.0) if p["total"] > 0 else 0.0
        if pct == 100.0:
            badge = "🟢 DONE"
        elif pct > 0.0:
            badge = "🟡 ACTIVE"
        else:
            badge = "⚪ QUEUED"
        print(f"{p['name'][:30]:<32} {p['total']:>6} {p['done']:>6} {p['ready']:>6} {p['blocked']:>8} {pct:>11.1f}% {badge:>10}")

    print("-" * 88)
    print("AUDITORÍA DE INTEGRIDAD GIT & TESTS:")
    matched_commits = sum(1 for t in tasks if t["id"] in task_commits)
    print(f"• Commits vinculados a tareas: {matched_commits} detectados en git log")

    if args.verify_done:
        if not regressions:
            print(f"• Suite de verificación determinista: ✓ {done_count}/{done_count} PASADOS (0 regresiones)")
        else:
            print(f"• Suite de verificación determinista: ❌ {len(regressions)} FALLAS DETECTADAS")
            for r in regressions:
                print(f"    - {r['id']}: {r['err']}")
    else:
        print("• Suite de verificación: (Usa --verify-done para ejecutar pruebas automáticas de regresión)")

    print("-" * 88)
    if ready_tasks:
        print("🎯 PRÓXIMAS TAREAS DESBLOQUEADAS (READY_FOR_EXECUTION):")
        for rt in ready_tasks[:5]:
            print(f"  [{rt['id']}] {rt['role']} -> {rt['title']}")
        if len(ready_tasks) > 5:
            print(f"  ... y {len(ready_tasks) - 5} tareas más listas para ser tomadas.")
    else:
        if done_count == total_count:
            print("🏆 ¡TODAS LAS TAREAS COMPLETADAS! SISTEMA 100% LISTO PARA AWWWARDS AUDIT.")
        else:
            print("⚠️ No hay tareas listas inmediatamente; revisa dependencias bloqueadas.")
    print("=" * 88)

    sys.exit(0 if not regressions else 1)

if __name__ == "__main__":
    main()
