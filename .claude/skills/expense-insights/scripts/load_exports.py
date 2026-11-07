#!/usr/bin/env python3
"""Turn Personal Expense Manager JSON exports into analysis-ready CSVs.

Standard library only. Reads exports, never modifies them. Output defaults to a fresh temp
directory because the results are personal financial data and must not land in a git repo.

    python3 load_exports.py <folder-or-file> [...] [--profile PATH] [--out DIR]
"""
import argparse
import collections
import csv
import datetime as dt
import json
import re
import statistics
import tempfile
from pathlib import Path

STAMP = re.compile(r"expense_export_(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})")
REQUIRED = {"cycleStart", "cycleEnd", "expenses", "installments", "fixedCosts"}
RUNOFF_MONTHS = 12


def exported_at(path):
    m = STAMP.search(path.name)
    if m:
        y, mo, d, h, mi = map(int, m.groups())
        return dt.datetime(y, mo, d, h, mi)
    return dt.datetime.fromtimestamp(path.stat().st_mtime)


def rank(path):
    """Best snapshot of a cycle: final.json, then the newest export; old*.json only as a last resort."""
    stem = path.stem.lower()
    return (0 if stem.startswith("old") else 1, 1 if stem == "final" else 0, exported_at(path))


def discover(inputs):
    found, skipped = [], []
    for raw in inputs:
        p = Path(raw).expanduser()
        for f in sorted(p.rglob("*.json")) if p.is_dir() else [p]:
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
            except (OSError, ValueError) as err:
                skipped.append((f, f"unreadable: {err}"))
                continue
            if isinstance(data, dict) and REQUIRED <= data.keys():
                found.append((f, data))
            else:
                skipped.append((f, "not an expense export"))
    return found, skipped


def read_table(profile, heading):
    """Return {first cell: second cell} from the markdown table under '## <heading>' in the profile."""
    table = {}
    if not profile or not profile.exists():
        return table
    active, header_seen = False, False
    for line in profile.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            active, header_seen = line[3:].strip().lower() == heading.lower(), False
        elif active and line.startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if not header_seen:
                header_seen = True
            elif len(cells) >= 2 and not set(cells[0]) <= {"-", ":", " "}:
                table[cells[0]] = cells[1]
    return table


def money(rows):
    return sum((r.get("amount") or 0) for r in rows)


def r2(x):
    return round(x + 0.0, 2)


def write_csv(path, rows, fields):
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="+", help="export files, or folders to search recursively")
    ap.add_argument("--profile", type=Path, help="defaults to EXPENSE_PROFILE.md in the first input folder")
    ap.add_argument("--out", type=Path, help="output directory (default: a new temp directory)")
    args = ap.parse_args()

    profile = args.profile
    if profile is None:
        first = Path(args.inputs[0]).expanduser()
        profile = (first if first.is_dir() else first.parent) / "EXPENSE_PROFILE.md"
    rollups = read_table(profile, "Category rollups")
    pass_through = [k.lower() for k in read_table(profile, "Pass-through items")]

    def is_pass_through(row):
        text = (row.get("description") or "").lower()
        return any(k in text for k in pass_through)

    out = args.out or Path(tempfile.mkdtemp(prefix="expense-insights-"))
    out.mkdir(parents=True, exist_ok=True)

    found, skipped = discover(args.inputs)
    groups = collections.defaultdict(list)
    for f, data in found:
        groups[(data["cycleStart"], data["cycleEnd"])].append((f, data))

    chosen, superseded = [], []
    for key in sorted(groups):
        ordered = sorted(groups[key], key=lambda fd: rank(fd[0]), reverse=True)
        chosen.append(ordered[0])
        superseded += [(f, ordered[0][0]) for f, _ in ordered[1:]]

    cycles, txns, cat_totals, card_totals, notes = [], [], [], [], []
    seen_cat = collections.OrderedDict()
    fixed_hist = collections.defaultdict(dict)
    inst_hist = collections.defaultdict(list)

    for f, d in chosen:
        start, end = d["cycleStart"], d["cycleEnd"]
        days = (dt.date.fromisoformat(end) - dt.date.fromisoformat(start)).days
        ex, ins, fx = d["expenses"], d["installments"], d["fixedCosts"]
        cash = d.get("cashExpenses", [])
        income = d.get("expectedIncome") or 0
        stated = d.get("expectedSavings") or 0
        card, inst, fixed = money(ex), money(ins), money(fx)
        credits = sum(e["amount"] for e in ex if (e.get("amount") or 0) < 0)
        repaid = money([r for r in ex + ins if is_pass_through(r)])
        when = exported_at(f)
        is_open = when.date() < dt.date.fromisoformat(end)
        cycles.append({
            "cycle_start": start, "cycle_end": end, "days": days, "folder": f.parent.name,
            "source_file": f.name, "exported_on": when.date().isoformat(),
            "state": "open" if is_open else "closed", "income": income,
            "card_net": r2(card), "card_gross": r2(card - credits), "credits": r2(credits),
            "installments": r2(inst), "fixed": r2(fixed), "cash_logged": r2(money(cash)),
            "total_outflow": r2(card + inst + fixed), "net_saved": r2(income - card - inst - fixed),
            "pass_through": r2(repaid), "own_outflow": r2(card + inst + fixed - repaid),
            "net_saved_own": r2(income - card - inst - fixed + repaid),
            "stated_savings": stated, "app_remaining": r2(income - card - inst - fixed - stated),
            "card_rows": len(ex),
            "validated_pct": round(100 * sum(1 for e in ex if e.get("validated")) / len(ex)) if ex else 0,
            "card_net_per_day": r2(card / days) if days else "",
        })

        base = {"cycle_start": start, "cycle_end": end}
        by_cat = collections.defaultdict(lambda: [0.0, 0, 0.0])
        listed = set(d.get("categories", []))
        for i, e in enumerate(ex):
            cat = e.get("category") or ""
            by_cat[cat][0] += e.get("amount") or 0
            by_cat[cat][1] += 1
            by_cat[cat][2] += (e.get("amount") or 0) if is_pass_through(e) else 0
            seen_cat.setdefault(cat, [start, start])[1] = start
            if cat and cat not in listed:
                notes.append(f"{start}: row '{e.get('description')}' uses category '{cat}', absent from that file's list")
            txns.append({**base, "kind": "card", "row": i, "description": e.get("description", ""),
                         "amount": e.get("amount") or 0, "category": cat, "rollup": rollups.get(cat, cat),
                         "method": e.get("payment", ""), "remaining_months": "",
                         "validated": bool(e.get("validated")), "bank_import": bool(e.get("importKey")),
                         "pass_through": is_pass_through(e)})
        for i, r in enumerate(ins):
            txns.append({**base, "kind": "installment", "row": i, "description": r.get("description", ""),
                         "amount": r.get("amount") or 0, "category": "", "rollup": "",
                         "method": r.get("card", ""), "remaining_months": r.get("remainingMonths", 0),
                         "validated": bool(r.get("validated")), "bank_import": False,
                         "pass_through": is_pass_through(r)})
            inst_hist[r.get("description", "")].append((start, r.get("amount") or 0, r.get("remainingMonths") or 0, r.get("card", "")))
        for i, r in enumerate(fx):
            txns.append({**base, "kind": "fixed", "row": i, "description": r.get("description", ""),
                         "amount": r.get("amount") or 0, "category": "", "rollup": "", "method": "",
                         "remaining_months": "", "validated": bool(r.get("validated")), "bank_import": False,
                         "pass_through": False})
            fixed_hist[r.get("description", "")][start] = r.get("amount") or 0
        for i, r in enumerate(cash):
            cat = r.get("category") or ""
            txns.append({**base, "kind": "cash", "row": i, "description": r.get("description", ""),
                         "amount": r.get("amount") or 0, "category": cat, "rollup": rollups.get(cat, cat),
                         "method": r.get("paymentMethod", ""), "remaining_months": "",
                         "validated": "", "bank_import": False, "pass_through": False})
        for cat, (total, n, repaid_cat) in sorted(by_cat.items()):
            cat_totals.append({**base, "days": days, "category": cat, "rollup": rollups.get(cat, cat),
                               "amount": r2(total), "own_amount": r2(total - repaid_cat), "rows": n})

        methods = sorted({e.get("payment") or "" for e in ex} | {r.get("card") or "" for r in ins})
        for m in methods:
            spend = money([e for e in ex if e.get("payment") == m])
            monthly = money([r for r in ins if r.get("card") == m])
            mine = [r for r in ex + ins if (r.get("payment") or r.get("card")) == m]
            card_totals.append({**base, "card": m, "expenses": r2(spend), "installments": r2(monthly),
                                "total": r2(spend + monthly),
                                "validated_pct": round(100 * sum(1 for r in mine if r.get("validated")) / len(mine))})

    latest_start = cycles[-1]["cycle_start"] if cycles else ""
    recurring = []
    for name, hist in inst_hist.items():
        last = hist[-1]
        recurring.append({"description": name, "first_cycle": hist[0][0], "last_cycle": last[0],
                          "cycles_seen": len(hist), "latest_amount": last[1], "latest_remaining": last[2],
                          "method": last[3], "active": last[0] == latest_start,
                          "open_ended": last[2] == 0})
    recurring.sort(key=lambda r: (not r["active"], r["last_cycle"], r["description"]))

    active = [r for r in recurring if r["active"]]
    runoff = []
    for k in range(1, RUNOFF_MONTHS + 1):
        live = [r for r in active if r["open_ended"] or r["latest_remaining"] >= k]
        runoff.append({"months_ahead": k, "monthly_total": r2(sum(r["latest_amount"] for r in live)),
                       "items": len(live),
                       "ending_after_this_month": "; ".join(r["description"] for r in live
                                                            if not r["open_ended"] and r["latest_remaining"] == k)})

    txn_fields = ["cycle_start", "cycle_end", "kind", "row", "description", "amount", "category", "rollup",
                  "method", "remaining_months", "validated", "bank_import", "pass_through"]
    write_csv(out / "transactions.csv", txns, txn_fields)
    if cycles:
        write_csv(out / "cycles.csv", cycles, list(cycles[0]))
    write_csv(out / "categories_by_cycle.csv", cat_totals,
              ["cycle_start", "cycle_end", "days", "category", "rollup", "amount", "own_amount", "rows"])
    write_csv(out / "cards_by_cycle.csv", card_totals,
              ["cycle_start", "cycle_end", "card", "expenses", "installments", "total", "validated_pct"])
    if recurring:
        write_csv(out / "recurring.csv", recurring, list(recurring[0]))
    write_csv(out / "installment_runoff.csv", runoff,
              ["months_ahead", "monthly_total", "items", "ending_after_this_month"])

    q = ["# Data quality report", ""]
    q.append(f"Profile: {profile if profile.exists() else 'NOT FOUND - no rollups applied'}")
    q += ["", "## Cycles used", ""]
    q += [f"- {c['cycle_start']} to {c['cycle_end']} ({c['days']}d, {c['state']}): {c['folder']}/{c['source_file']}" for c in cycles]

    q += ["", "## Pass-through rows", ""]
    flagged = collections.Counter()
    for t in txns:
        if t["pass_through"]:
            flagged[t["description"]] += t["amount"]
    q += [f"- {name}: {total:.2f}" for name, total in flagged.items()] or ["- None"]

    q += ["", "## Cycle boundaries", ""]
    start_days = collections.Counter(c["cycle_start"][-2:] for c in cycles)
    usual = start_days.most_common(1)[0][0] if start_days else ""
    issues = []
    for a, b in zip(cycles, cycles[1:]):
        if b["cycle_start"] < a["cycle_end"]:
            issues.append(f"OVERLAP: {b['cycle_start']} starts before the previous cycle ends ({a['cycle_end']})")
        elif b["cycle_start"] > a["cycle_end"]:
            issues.append(f"GAP: nothing covers {a['cycle_end']} to {b['cycle_start']}")
    issues += [f"Unusual start day: {c['cycle_start']} (usual day is {usual})" for c in cycles if c["cycle_start"][-2:] != usual]
    issues += [f"OPEN: {c['cycle_start']} was exported on {c['exported_on']}, before it ended; totals are partial" for c in cycles if c["state"] == "open"]
    q += [f"- {i}" for i in issues] or ["- None"]

    q += ["", "## Fixed cost changes", ""]
    order = [c["cycle_start"] for c in cycles]
    changes = []
    for name, hist in fixed_hist.items():
        present = [s for s in order if s in hist]
        amounts = statistics.median(hist.values())
        changes.append(f"{name}: median {amounts:g}, latest {hist[present[-1]]:g}, seen {present[0]} to {present[-1]}")
        missing = [s for s in order[order.index(present[0]):order.index(present[-1]) + 1] if s not in hist]
        if missing:
            changes.append(f"  MISSING in {', '.join(missing)}")
        for a, b in zip(present, present[1:]):
            if hist[a] and abs(hist[b] - hist[a]) / hist[a] >= 0.25:
                changes.append(f"  STEP at {b}: {hist[a]:g} to {hist[b]:g}")
    q += [f"- {c}" if not c.startswith("  ") else f"  - {c.strip()}" for c in changes] or ["- None"]

    q += ["", "## Category lifespans", ""]
    q += [f"- {cat or '(blank)'}: {a} to {b}" + ("" if b == latest_start else "  (no longer used)")
          for cat, (a, b) in seen_cat.items()]

    q += ["", "## Row-level checks", ""]
    q += [f"- {n}" for n in notes] or ["- None"]

    q += ["", "## Files not used", ""]
    q += [f"- {f.parent.name}/{f.name}: superseded by {w.parent.name}/{w.name}" for f, w in superseded]
    q += [f"- {f.parent.name}/{f.name}: {why}" for f, why in skipped]
    if not superseded and not skipped:
        q.append("- None")
    (out / "data_quality.md").write_text("\n".join(q) + "\n", encoding="utf-8")

    print(f"{len(cycles)} cycles from {len(found)} exports -> {out}")


if __name__ == "__main__":
    main()
