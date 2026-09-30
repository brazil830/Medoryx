"""Re-export of rules configuration for root /rules package."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.core.rules_config import *
