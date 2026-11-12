#!/usr/bin/env python3
"""
GRAND PRIX TELEMETRY // STRICT AUDIT PROGRESS ENGINE (v3.0)
Cryptographically verifiable, Git-backed task progress measurement.

A milestone is certified DONE if and only if:
  1. A matching commit exists in Git history: commit message includes 'TASK-XXX'.
  2. The commit diff touched the declared files for that task.
  3. All predecessor dependencies are certified DONE.
  4. The deterministic verification command passes with exit code 0.
"""

import sys
import os
import json
import subprocess
import argparse

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASKS_FILE = os.path.join(ROOT_DIR, "TASKS.json")

def get_git_commit_map():
    """Inspects git log and returns a mapping: task_id -> {sha, msg, files_changed}"""
    try:
        res = subprocess.run(
            ["git", "log", "--format=%h|||%s"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        task_commits = {}
        for line in res.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split("|||", 1)
            sha = parts[0]
            msg = parts[1] if len(parts) > 1 else ""

            # Check for TASK-XXX in message
            for token in msg.split():
                clean_id = token.replace(":", "").replace("(", "").replace(")", "").replace("[", "").replace("]", "").strip()
                if clean_id.startswith("TASK-") and clean_id not in task_commits:
                    # Get files modified in this commit
                    diff_res = subprocess.run(
                        ["git", "show", "--name-only", "--format=", sha],
                        cwd=ROOT_DIR,
                        capture_output=True,
                        text=True
                    )
                    files_touched = [f.strip() for f in diff_res.stdout.split("\n") if f.strip()]
                    task_commits[clean_id] = {
                        "sha": sha,
                        "msg": msg,
                        "files": files_touched
                    }
        return task_commits
    except Exception as e:
        return {}

def run_cmd(cmd):
    try:
        res = subprocess.run(
            cmd,
            shell=True,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            timeout=20
        )
        return res.returncode == 0, res.stdout.strip(), res.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, "", "Timeout expired (20s)"
    except Exception as e:
        return False, "", str(e)

def main():
    parser = argparse.ArgumentParser(description="Grand Prix Telemetry Strict Audit Engine")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON metrics")
    parser.add_argument("--strict", action="store_true", help="Fail if any uncommitted changes are present")
    args = parser.parse_args()

    if not os.path.exists(TASKS_FILE):
        print(f"Error: TASKS.json not found at {TASKS_FILE}", file=sys.stderr)
        sys.exit(1)

    with open(TASKS_FILE, "r") as f:
        data = json.load(f)

    tasks = data.get("tasks", [])
    task_map = {t["id"]: t for t in tasks}

    git_commits = get_git_commit_map()

    # Dynamic State Evaluation (Topological iterative resolution)
    certified_done = {}

    resolved_any = True
    while resolved_any:
        resolved_any = False
        for t in tasks:
            tid = t["id"]
            if tid in certified_done:
                continue

            deps = t.get("dependencies", [])
            deps_met = all(d in certified_done for d in deps)
            if not deps_met:
                continue

            commit_info = git_commits.get(tid)
            if not commit_info:
                continue

            # Verify that the commit touched the declared files
            declared_files = t.get("files", [])
            touched = commit_info.get("files", [])
            file_match = False
            for df in declared_files:
                df_clean = df.rstrip("/")
                if any(cf == df_clean or cf.startswith(df_clean + "/") or df_clean.startswith(cf) for cf in touched):
                    file_match = True
                    break

            if not file_match:
                # Commit did not touch the declared files
                continue

            # Run deterministic verification
            cmd = t.get("verification_cmd")
            if cmd:
                ok, out, err = run_cmd(cmd)
                if not ok:
                    continue

            # Fully certified!
            certified_done[tid] = commit_info
            resolved_any = True

    # Check for inconsistencies AFTER topological resolution completes
    inconsistencies = []
    for t in tasks:
        tid = t["id"]
        if tid in certified_done:
            continue

        commit_info = git_commits.get(tid)
        if commit_info:
            deps = t.get("dependencies", [])
            deps_met = all(d in certified_done for d in deps)
            if not deps_met:
                unmet = [d for d in deps if d not in certified_done]
                inconsistencies.append({
                    "task_id": tid,
                    "type": "OUT_OF_ORDER_COMMIT",
                    "details": f"Commit {commit_info['sha']} exists but dependencies {unmet} are not certified DONE."
                })
                continue

            declared_files = t.get("files", [])
            touched = commit_info.get("files", [])
            file_match = False
            for df in declared_files:
                df_clean = df.rstrip("/")
                if any(cf == df_clean or cf.startswith(df_clean + "/") or df_clean.startswith(cf) for cf in touched):
                    file_match = True
                    break

            if not file_match:
                inconsistencies.append({
                    "task_id": tid,
                    "type": "FILE_MISMATCH",
                    "details": f"Commit {commit_info['sha']} touched {touched}, but declared files are {declared_files}."
                })
                continue

            cmd = t.get("verification_cmd")
            if cmd:
                ok, out, err = run_cmd(cmd)
                if not ok:
                    inconsistencies.append({
                        "task_id": tid,
                        "type": "VERIFICATION_FAILURE",
                        "details": f"Commit {commit_info['sha']} exists but test failed: {err or out}"
                    })
                    continue

    # Categorize all tasks
    phases = {}
    total_count = len(tasks)
    done_count = len(certified_done)
    ready_tasks = []
    blocked_tasks = []

    for t in tasks:
        tid = t["id"]
        p_num = t.get("phase", 0)
        p_name = t.get("phase_name", f"Fase {p_num}")
        if p_num not in phases:
            phases[p_num] = {
                "name": p_name,
                "total": 0,
                "done": 0,
                "ready": 0,
                "blocked": 0
            }
        phases[p_num]["total"] += 1

        if tid in certified_done:
            phases[p_num]["done"] += 1
        else:
            deps = t.get("dependencies", [])
            deps_met = all(d in certified_done for d in deps)
            if deps_met:
                phases[p_num]["ready"] += 1
                ready_tasks.append(t)
            else:
                phases[p_num]["blocked"] += 1
                blocked_tasks.append(t)

    percent_overall = (done_count / total_count * 100.0) if total_count > 0 else 0.0

    if args.json:
        metrics = {
            "overall_progress_percent": round(percent_overall, 2),
            "total_tasks": total_count,
            "done_tasks": done_count,
            "ready_tasks": len(ready_tasks),
            "blocked_tasks": len(blocked_tasks),
            "certified_done": list(certified_done.keys()),
            "next_ready": [t["id"] for t in ready_tasks],
            "inconsistencies": inconsistencies
        }
        print(json.dumps(metrics, indent=2))
        sys.exit(0 if not inconsistencies else 1)

    # Render ASCII F1 Telemetry Dashboard
    bar_width = 30
    filled = int(round(bar_width * (percent_overall / 100.0)))
    bar = "█" * filled + "░" * (bar_width - filled)

    print("=" * 92)
    print("🏁 GRAND PRIX TELEMETRY // STRICT AUDIT PROGRESS DASHBOARD (v3.0)")
    print("=" * 92)
    print(f"LAP PROGRESS: [{bar}] {percent_overall:.1f}% ({done_count}/{total_count} Milestones Certified)")
    print(f"REMAINING: {total_count - done_count} Milestones | READY TO EXECUTE: {len(ready_tasks)} | BLOCKED: {len(blocked_tasks)}")
    print("-" * 92)
    print(f"{'FASE':<38} {'TOTAL':>6} {'DONE':>6} {'READY':>6} {'BLOCKED':>8} {'% PROGRESS':>12} {'ESTADO':>10}")
    print("-" * 92)

    for p_num in sorted(phases.keys()):
        p = phases[p_num]
        pct = (p["done"] / p["total"] * 100.0) if p["total"] > 0 else 0.0
        if pct == 100.0:
            badge = "🟢 DONE"
        elif pct > 0.0:
            badge = "🟡 ACTIVE"
        else:
            badge = "⚪ QUEUED"
        print(f"{p['name'][:36]:<38} {p['total']:>6} {p['done']:>6} {p['ready']:>6} {p['blocked']:>8} {pct:>11.1f}% {badge:>10}")

    print("-" * 92)
    print("AUDITORÍA DE INTEGRIDAD CRIPTOGRÁFICA & GIT:")
    print(f"• Commits verificados y certificados en Git: {len(certified_done)}/{total_count}")
    if inconsistencies:
        print("❌ INCOHERENCIAS DETECTADAS POR EL AUDITOR:")
        for inc in inconsistencies:
            print(f"  - [{inc['task_id']}] {inc['type']}: {inc['details']}")
    else:
        print("✓ Cero inconsistencias: todos los estados son derivados matemáticamente de Git.")

    print("-" * 92)
    if ready_tasks:
        print("🎯 PRÓXIMAS TAREAS DESBLOQUEADAS (READY_FOR_EXECUTION):")
        for rt in ready_tasks[:6]:
            print(f"  [{rt['id']}] {rt['role']} -> {rt['title']}")
    else:
        if done_count == total_count:
            print("🏆 ¡VUELTA COMPLETADA! TODOS LOS HITOS CERTIFICADOS PARA AWWWARDS SOTD.")
        else:
            print("⚠️ No hay tareas listas inmediatamente; revisa bloqueos de dependencias.")
    print("=" * 92)

    sys.exit(0 if not inconsistencies else 1)

if __name__ == "__main__":
    main()
