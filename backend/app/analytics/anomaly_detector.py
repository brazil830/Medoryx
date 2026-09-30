"""
Isolation Forest Anomaly Detection for ResilHealth-India.
Complies with Part M and Acceptance Test P9 of Master Specification.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.ensemble import IsolationForest

def evaluate_anomaly(
    issue_qty: int,
    history_issues: List[int],
    footfall: int = 120,
    is_weekend: bool = False,
    days_since_receipt: int = 5,
    outbreak_index: float = 0.0,
    demo_spike_active: bool = False
) -> Dict[str, Any]:
    """
    Evaluates whether an issue is an operational anomaly.
    Flag only if:
      - IsolationForest predicts outlier (-1)
      - AND issue_qty > 3 * 28-day median
      - AND no active outbreak explanation (outbreak_index < 3 and demo_spike_active is False)
    """
    if not history_issues:
        history_issues = [10] * 28

    arr = np.array(history_issues, dtype=float)
    mean_val = float(np.mean(arr))
    std_val = float(np.std(arr)) if np.std(arr) > 0.001 else 1.0
    median_val = float(np.median(arr))

    z_score = (issue_qty - mean_val) / std_val
    issue_footfall_ratio = issue_qty / max(1, footfall)

    # Train a calibrated IsolationForest on synthetic baseline pattern with realistic variance
    np.random.seed(42)
    baseline_features = []
    effective_std = std_val if std_val >= 1.0 else 1.5
    for _ in range(100):
        h_sample = max(1.0, float(np.random.normal(mean_val, effective_std)))
        b_z = (h_sample - mean_val) / effective_std
        b_ratio = h_sample / max(1, footfall)
        b_wknd = 1.0 if np.random.rand() < 0.28 else 0.0
        b_days = float(np.random.randint(1, 8))
        baseline_features.append([h_sample, b_z, b_ratio, b_wknd, b_days])

    X_train = np.array(baseline_features)
    clf = IsolationForest(contamination=0.02, random_state=42)
    clf.fit(X_train)

    curr_feature = np.array([[issue_qty, z_score, issue_footfall_ratio, 1.0 if is_weekend else 0.0, float(days_since_receipt)]])
    is_outlier_prediction = (clf.predict(curr_feature)[0] == -1 or clf.decision_function(curr_feature)[0] < 0.0)

    is_high_volume = (issue_qty > (3 * median_val))
    has_outbreak_explanation = (outbreak_index >= 3.0 or demo_spike_active)

    should_flag = (is_outlier_prediction and is_high_volume and not has_outbreak_explanation)

    severity = "NONE"
    if should_flag:
        if z_score >= 4.0:
            severity = "CRITICAL"
        elif z_score >= 2.5:
            severity = "HIGH"
        else:
            severity = "ADVISORY"

    return {
        "is_flagged": should_flag,
        "severity": severity,
        "z_score": round(z_score, 2),
        "median_28d": round(median_val, 2),
        "ratio_to_median": round(issue_qty / max(1, median_val), 2),
        "outbreak_explained": has_outbreak_explanation,
        "model_label": "IsolationForest (Contamination 0.02)"
    }
