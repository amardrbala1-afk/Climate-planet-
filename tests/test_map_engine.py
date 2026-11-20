# Legacy entrypoint for older CI configurations.
# V7 supersedes the artificial manual-GCP test with the owner-provided .pgw.
from runpy import run_path
from pathlib import Path
run_path(str(Path(__file__).with_name('test_v7_georef.py')),run_name='__main__')
