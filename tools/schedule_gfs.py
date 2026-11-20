#!/usr/bin/env python3
"""Climate Planet V7 strict NOAA GFS publisher.

Verify each *actual* rendered product and its catalog record. Fail the workflow
if any of the four expected maps is absent. This diagnoses missing rain without
changing meteorological values or inventing products.
"""
import argparse
import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASKS = [
    ('europe', 'z500', 24, None),
    ('europe', 't850', 24, None),
    ('levant', 't2m', 24, None),
    ('levant', 'rain', 6, 6),
]


def verify_product(root: Path, region: str, field: str, hour: int, date: str, cycle: str, accum: int | None):
    identity = f'gfs-{region}-{field}-{date}{cycle}-f{hour:03d}'
    catalog_path = root / 'data/map-products/catalog.json'
    if not catalog_path.is_file():
        raise ValueError(f'MISSING CATALOG: {catalog_path}')
    entries = json.loads(catalog_path.read_text(encoding='utf-8'))
    matched = [entry for entry in entries if entry.get('id') == identity]
    if len(matched) != 1:
        raise ValueError(f'CATALOG ERROR: {identity} found {len(matched)} times (expected 1)')
    entry = matched[0]
    if (entry.get('region'), entry.get('field'), entry.get('model')) != (region, field, 'GFS'):
        raise ValueError(f'INCORRECT FIELD METADATA for {identity}')
    if int(entry.get('forecastHour', -1)) != hour:
        raise ValueError(f'INCORRECT FORECAST HOUR for {identity}')
    if accum is not None and int(entry.get('accumHours', -1)) != accum:
        raise ValueError(f'INCORRECT ACCUMULATION DURATION for {identity}')
    expected = f'/images/maps/forecast/{identity}.png'
    if entry.get('image') != expected:
        raise ValueError(f'INCORRECT IMAGE PATH: {identity} -> {entry.get("image")!r}')
    file = root / 'site' / expected.lstrip('/')
    if not file.is_file() or file.stat().st_size < 200:
        raise ValueError(f'MISSING OR EMPTY PNG: {file}')
    with file.open('rb') as handle:
        if handle.read(8) != b'\x89PNG\r\n\x1a\n':
            raise ValueError(f'INVALID PNG SIGNATURE: {file}')
    print(f'PRODUCT VERIFIED: {identity} ({file.stat().st_size} bytes)', flush=True)
    return identity


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--date')
    p.add_argument('--cycle', choices=('00', '06', '12', '18'))
    p.add_argument('--dry-run', action='store_true')
    p.add_argument('--allow-partial', action='store_true', help='Ignored: all 4 maps are required for a successful run')
    args = p.parse_args()
    reference = datetime.now(timezone.utc) - timedelta(hours=5)
    cycle = args.cycle or f'{reference.hour // 6 * 6:02d}'
    date = args.date or reference.strftime('%Y%m%d')
    if args.allow_partial:
        print('NOTE: --allow-partial is disabled in strict V7 validation.', flush=True)
    errors = []
    for region, field, hour, accum in TASKS:
        cmd = [sys.executable, str(ROOT/'tools/publish_gfs.py'), '--date', date,
               '--cycle', cycle, '--region', region, '--field', field, '--forecast-hour', str(hour)]
        if accum:
            cmd += ['--accum-hours', str(accum)]
        if args.dry_run:
            cmd += ['--dry-run']
        label = f'{region} {field} f{hour:03d}'
        print(f'\n>>> {label} {date} {cycle}Z', flush=True)
        try:
            completed = subprocess.run(cmd, check=False, timeout=250, capture_output=True, text=True)
            if completed.stdout:
                print(completed.stdout, flush=True)
            if completed.stderr:
                print(completed.stderr, file=sys.stderr, flush=True)
            if completed.returncode != 0:
                raise ValueError(f'RENDERER FAILED with exit {completed.returncode} for {label}')
            if not args.dry_run:
                verify_product(ROOT, region, field, hour, date, cycle, accum)
        except (subprocess.TimeoutExpired, ValueError, OSError) as exc:
            errors.append((region, field, str(exc)))
            print(f'::error title=Missing forecast {label}::{exc}', file=sys.stderr, flush=True)
    if not args.dry_run:
        if not errors:
            subprocess.run([sys.executable, str(ROOT/'tools/prune_forecasts.py')], check=True)
            for region, field, hour, accum in TASKS:
                verify_product(ROOT, region, field, hour, date, cycle, accum)
        else:
            print('No pruning: retaining existing verified maps until all fields pass.', flush=True)
    print(f'ACTUAL MAPS VERIFIED: {len(TASKS)-len(errors)}/{len(TASKS)}; errors={errors}', flush=True)
    if errors:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
