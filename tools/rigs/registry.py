"""Read and update the static registry used by the game and the lab."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'assets/rigs/registry.js'
PREFIX = 'const EnemyRigData = '


def store(key, rig):
    data = json.loads(REGISTRY.read_text().removeprefix(PREFIX).strip().removesuffix(';'))
    data[key] = rig
    REGISTRY.write_text(PREFIX + json.dumps(data, indent=2) + ';\n')
