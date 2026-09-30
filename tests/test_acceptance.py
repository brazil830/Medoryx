"""Re-export of acceptance tests for root /tests."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from tests.test_acceptance import *
