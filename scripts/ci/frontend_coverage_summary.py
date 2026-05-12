#!/usr/bin/env python3
"""
Read Vitest / v8 json-summary coverage (coverage-summary.json) and append a GitHub Actions job summary.

The summary file is a single JSON object split across many lines; the first line alone is not valid JSON.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import unittest
from pathlib import Path
from typing import Any


def load_total_block(summary_path: Path) -> dict[str, Any]:
    """Return the ``total`` object from a Vitest json-summary file."""
    text = summary_path.read_text(encoding="utf-8")
    data = json.loads(text)
    total = data.get("total")
    if not isinstance(total, dict):
        raise ValueError("coverage summary JSON has no object 'total'")
    return total


def render_markdown_table(total: dict[str, Any]) -> str:
    keys = ("lines", "statements", "functions", "branches")
    lines_out = [
        "## Frontend coverage (Vitest / v8)\n",
        "\n",
        "| Metric | Covered | Total | Skipped | % |\n",
        "| --- | ---: | ---: | ---: | ---: |\n",
    ]
    for k in keys:
        block = total.get(k)
        if not isinstance(block, dict):
            continue
        pct = block.get("pct")
        covered = block.get("covered")
        skipped = block.get("skipped", 0)
        total_n = block.get("total")
        pct_s = f"{pct:.2f}" if isinstance(pct, (int, float)) else str(pct)
        lines_out.append(
            f"| {k} | {covered if covered is not None else '—'} | "
            f"{total_n if total_n is not None else '—'} | {skipped} | {pct_s} |\n"
        )
    lines_out.append("\n")
    return "".join(lines_out)


def write_job_summary(markdown: str) -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as out:
        out.write(markdown)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "summary_json",
        type=Path,
        help="Path to coverage-summary.json (e.g. frontend/coverage/EE/coverage-summary.json)",
    )
    args = parser.parse_args(argv)
    path = args.summary_json
    if not path.is_file():
        print(f"coverage summary file not found: {path}", file=sys.stderr)
        return 1
    total = load_total_block(path)
    write_job_summary(render_markdown_table(total))
    return 0


class TestFrontendCoverageSummary(unittest.TestCase):
    """Regression: full-file parse (Vitest writes multi-line JSON; line 1 is not a complete document)."""

    def test_load_total_requires_full_document(self) -> None:
        import tempfile

        bad = '{"total": {"lines": {"total": 1, "covered": 0, "skipped": 0, "pct": 0}}\n'
        good = (
            '{"total": {"lines": {"total": 1, "covered": 0, "skipped": 0, "pct": 0}},'
            '"other.ts": {"lines": {"total": 2, "covered": 1, "skipped": 0, "pct": 50}}}\n'
        )
        with tempfile.TemporaryDirectory() as tmp:
            p_bad = Path(tmp) / "bad.json"
            p_bad.write_text(bad, encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError):
                load_total_block(p_bad)

            p_good = Path(tmp) / "good.json"
            p_good.write_text(good, encoding="utf-8")
            total = load_total_block(p_good)
            self.assertIn("lines", total)
            self.assertEqual(total["lines"]["total"], 1)

    def test_render_contains_metrics(self) -> None:
        total = {
            "lines": {"total": 10, "covered": 5, "skipped": 0, "pct": 50.0},
            "statements": {"total": 12, "covered": 6, "skipped": 0, "pct": 50.0},
        }
        md = render_markdown_table(total)
        self.assertIn("lines", md)
        self.assertIn("50.00", md)


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--test":
        unittest.main(module=__name__, argv=[sys.argv[0], "-v", *sys.argv[2:]], exit=True)
    raise SystemExit(main())
