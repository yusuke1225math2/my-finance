import json
from logging import config
from pathlib import Path

with open(Path(__file__).parent / '../config/log_conf.json', 'r', encoding='utf-8') as f:
    log_conf = json.load(f)
config.dictConfig(log_conf)
