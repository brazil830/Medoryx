"""
Authoritative Mathematical Calculations & Engine for ResilHealth-India.
Complies strictly with Part J (J0 - J7) of the Master Specification.
"""

from datetime import date, timedelta
from typing import List, Dict, Any, Tuple, Optional
import math
from scipy import stats

from app.core.rules_config import (
    MIN_SHELF_LIFE_DAYS,
    FEFO_MIN_DAYS_AT_ARRIVAL,
    STATUS_RED_P_THRESHOLD,
    STATUS_AMBER_P_THRESHOLD,
    URGENCY_CRITICAL_P_THRESHOLD,
    URGENCY_HIGH_P_THRESHOLD,
    URGENCY_MEDIUM_P_THRESHOLD,
    MILP_MAX_ROAD_DISTANCE_KM,
    MILP_COST_FIXED_INR,
    MILP_COST_PER_KM_INR,
    DISPATCH_LAG_HOURS,
    TRANSPORT_SPEED_KMH,
    get_lead_time,
    get_safety_days,
    get_horizon_T,
    get_pack_size
)

def calculate_usable_stock(batches: List[Dict[str, Any]], current_date: date) -> int:
    """
    J0: usable_stock(f,k) = sum quantity over usable batches.
    A batch is usable when: expiry_date >= current_date + 7 days.
    """
    cutoff = current_date + timedelta(days=MIN_SHELF_LIFE_DAYS)
    usable_total = 0
    for b in batches:
        b_exp = b["expiry_date"]
        if isinstance(b_exp, str):
            b_exp = date.fromisoformat(b_exp)
        if b_exp >= cutoff:
            usable_total += int(b.get("quantity", 0))
    return usable_total

def calculate_at_risk_units(batch_qty: int, d: float, days_to_expiry: int) -> int:
    """
    J0: at_risk_units(batch) = max(0, qty - d * days_to_expiry)
    """
    projected_consumption = d * max(0, days_to_expiry)
    return max(0, int(math.floor(batch_qty - projected_consumption)))

def calculate_effective_stock(usable_stock: int, reserved: int, incoming: int) -> int:
    """
    J0: effective_stock = usable_stock - reserved + incoming
    """
    return usable_stock - reserved + incoming

def calculate_days_remaining(effective_stock: int, d: float) -> float:
    """
    J0: days_remaining = effective_stock / d
    """
    if d <= 0.0001:
        return 999.0
    return round(float(effective_stock) / float(d), 2)

def calculate_poisson_stockout_risk(effective_stock: int, d: float, lead_time_L: int = 5) -> float:
    """
    J2: Poisson Stock-Out Risk:
    lambda = d * L
    p_stockout = P(D > effective_stock) where D ~ Poisson(lambda)
    scipy.stats.poisson.sf(effective_stock, lambda)
    """
    lam = float(d) * float(lead_time_L)
    if lam <= 0:
        return 0.0
    if effective_stock < 0:
        return 1.0
    # sf is survival function: 1 - cdf(k) = P(X > k)
    p = float(stats.poisson.sf(effective_stock, lam))
    return round(min(1.0, max(0.0, p)), 4)

def determine_status(p_stockout: float, days_remaining: float, L: int = 5, T: int = 7) -> str:
    """
    J3: Status Thresholds:
    RED: p_stockout >= 0.70 OR days_remaining < L
    AMBER: (p_stockout >= 0.30 OR days_remaining < T) and not RED
    GREEN: otherwise
    """
    if p_stockout >= STATUS_RED_P_THRESHOLD or days_remaining < L:
        return "RED"
    if (p_stockout >= STATUS_AMBER_P_THRESHOLD or days_remaining < T):
        return "AMBER"
    return "GREEN"

def determine_urgency(
    p_stockout: float,
    days_remaining: float,
    T: int = 7,
    eta_days: float = 0.0,
    source_has_at_risk: bool = False,
    sink_days_remaining: float = 999.0
) -> str:
    """
    J4: Urgency Classification:
    CRITICAL: p >= 0.90 OR best transfer ETA later than projected stock-out (eta_days >= days_remaining)
    HIGH: 0.70 <= p < 0.90
    MEDIUM: 0.30 <= p < 0.70 OR days_remaining < T
    LOW: expiry-driven rebalancing only (source has at_risk_units > 0, sink has days_remaining < T + 3)
    """
    if p_stockout >= URGENCY_CRITICAL_P_THRESHOLD or (eta_days > 0 and eta_days >= days_remaining):
        return "CRITICAL"
    if p_stockout >= URGENCY_HIGH_P_THRESHOLD:
        return "HIGH"
    if p_stockout >= URGENCY_MEDIUM_P_THRESHOLD or days_remaining < T:
        return "MEDIUM"
    if source_has_at_risk and sink_days_remaining < (T + 3):
        return "LOW"
    return "LOW"

def calculate_surplus(effective_stock: int, d: float, T: int) -> int:
    """
    J5: Surplus U_i = max(0, effective_stock_i - d_i * T_i)
    """
    committed = d * T
    return max(0, int(math.floor(effective_stock - committed)))

def calculate_deficit(effective_stock: int, d: float, T: int, pack_size_P: int = 10) -> int:
    """
    J5: Deficit R_j = max(0, d_j * T_j - effective_stock_j), rounded UP to multiple of P.
    """
    target = d * T
    raw_deficit = max(0, int(math.ceil(target - effective_stock)))
    if raw_deficit == 0:
        return 0
    # Round UP to multiple of P
    remainder = raw_deficit % pack_size_P
    if remainder != 0:
        return raw_deficit + (pack_size_P - remainder)
    return raw_deficit

def calculate_transport_cost(distance_km: float) -> float:
    """
    J6: Transport cost = INR 100 + 15 * distance_km
    """
    return round(MILP_COST_FIXED_INR + MILP_COST_PER_KM_INR * distance_km, 2)

def calculate_eta_hours(distance_km: float) -> float:
    """
    J6: ETA = 12h dispatch lag + distance / 30 km/h
    """
    travel_time = distance_km / TRANSPORT_SPEED_KMH
    return round(DISPATCH_LAG_HOURS + travel_time, 2)

def calculate_fefo_allocation(
    source_batches: List[Dict[str, Any]],
    transfer_qty: int,
    current_date: date,
    eta_days: float = 0.52
) -> Tuple[List[Dict[str, Any]], int]:
    """
    J7: FEFO batch allocation.
    Allocate earliest-expiring usable batch first.
    Batch must have >= 30 days remaining at expected arrival.
    Returns: (allocated_batches, remaining_unallocated_qty)
    """
    arrival_date = current_date + timedelta(days=int(math.ceil(eta_days)))
    min_exp_date = arrival_date + timedelta(days=FEFO_MIN_DAYS_AT_ARRIVAL)

    # Filter and sort batches by expiry ascending
    eligible = []
    for b in source_batches:
        b_exp = b["expiry_date"]
        if isinstance(b_exp, str):
            b_exp = date.fromisoformat(b_exp)
        if b_exp >= min_exp_date and b.get("quantity", 0) > 0:
            eligible.append({
                "batch_number": b["batch_number"],
                "expiry_date": b_exp,
                "available_qty": int(b["quantity"])
            })

    eligible.sort(key=lambda x: x["expiry_date"])

    allocated = []
    needed = transfer_qty
    order = 1

    for b in eligible:
        if needed <= 0:
            break
        take = min(needed, b["available_qty"])
        if take > 0:
            allocated.append({
                "batch_number": b["batch_number"],
                "quantity": take,
                "expiry_date": b["expiry_date"].isoformat(),
                "allocation_order": order
            })
            needed -= take
            order += 1

    return allocated, needed

def solve_milp(
    sources: List[Dict[str, Any]],
    sinks: List[Dict[str, Any]],
    distance_fn,
    pack_size_P: int = 10
) -> List[Dict[str, Any]]:
    """
    J6: MILP Redistribution using PuLP with CBC solver and greedy fallback.
    MIN SUM_j W_j * u_j + SUM_ij (a * dist_ij - b * expiry_bonus_i) * x_ij
    Constraints:
      SUM_j x_ij <= U_i
      SUM_i x_ij + u_j = R_j
      x_ij = 0 if distance > 40 km
      x_ij = P * y_ij, y_ij integer >= 0
    """
    import pulp

    if not sources or not sinks:
        return []

    urgency_weights = {
        "CRITICAL": 4000,
        "HIGH": 3000,
        "MEDIUM": 2000,
        "LOW": 1000
    }

    try:
        prob = pulp.LpProblem("Redistribution_MILP", pulp.LpMinimize)

        # Decision variables
        y = {}
        for s in sources:
            s_id = s["facility_id"]
            for d in sinks:
                d_id = d["facility_id"]
                dist = distance_fn(s_id, d_id)
                if dist <= MILP_MAX_ROAD_DISTANCE_KM:
                    y[(s_id, d_id)] = pulp.LpVariable(f"y_{s_id}_{d_id}", lowBound=0, cat=pulp.LpInteger)

        u = {}
        for d in sinks:
            d_id = d["facility_id"]
            u[d_id] = pulp.LpVariable(f"u_{d_id}", lowBound=0, cat=pulp.LpContinuous)

        # Objective
        cost_terms = []
        for d in sinks:
            d_id = d["facility_id"]
            weight = urgency_weights.get(d.get("urgency", "MEDIUM"), 2000)
            cost_terms.append(weight * u[d_id])

        for (s_id, d_id), y_var in y.items():
            dist = distance_fn(s_id, d_id)
            source = next(s for s in sources if s["facility_id"] == s_id)
            expiry_bonus = 10.0 if source.get("has_at_risk", False) else 0.0
            coeff = (1.0 * dist - expiry_bonus) * pack_size_P
            cost_terms.append(coeff * y_var)

        prob += pulp.lpSum(cost_terms)

        # Source constraints: sum_j x_ij <= U_i
        for s in sources:
            s_id = s["facility_id"]
            out_vars = [pack_size_P * y[(s_id, d["facility_id"])] for d in sinks if (s_id, d["facility_id"]) in y]
            if out_vars:
                prob += pulp.lpSum(out_vars) <= s["surplus"]

        # Sink constraints: sum_i x_ij + u_j = R_j
        for d in sinks:
            d_id = d["facility_id"]
            in_vars = [pack_size_P * y[(s["facility_id"], d_id)] for s in sources if (s["facility_id"], d_id) in y]
            prob += (pulp.lpSum(in_vars) + u[d_id]) == d["deficit"]

        # Solve with 4-second time limit
        solver = pulp.PULP_CBC_CMD(timeLimit=4, msg=False)
        prob.solve(solver)

        recommendations = []
        if pulp.LpStatus[prob.status] in ["Optimal", "Not Solved", "Undefined"]:
            for (s_id, d_id), y_var in y.items():
                val = pulp.value(y_var)
                if val and val > 0:
                    transfer_qty = int(round(val * pack_size_P))
                    dist = distance_fn(s_id, d_id)
                    recommendations.append({
                        "source_facility_id": s_id,
                        "destination_facility_id": d_id,
                        "quantity": transfer_qty,
                        "distance_km": dist,
                        "cost_inr": calculate_transport_cost(dist),
                        "eta_hours": calculate_eta_hours(dist),
                        "solver_status": "OPTIMAL_CBC"
                    })
            if recommendations:
                return recommendations

    except Exception:
        pass

    # Greedy Fallback
    return solve_greedy(sources, sinks, distance_fn, pack_size_P)

def solve_greedy(
    sources: List[Dict[str, Any]],
    sinks: List[Dict[str, Any]],
    distance_fn,
    pack_size_P: int = 10
) -> List[Dict[str, Any]]:
    """
    Greedy fallback heuristic:
    Sinks: sorted by urgency descending (CRITICAL -> HIGH -> MEDIUM -> LOW).
    Sources: sorted by distance ascending.
    """
    urgency_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
    sorted_sinks = sorted(sinks, key=lambda s: urgency_rank.get(s.get("urgency", "MEDIUM"), 0), reverse=True)
    
    source_avail = {s["facility_id"]: s["surplus"] for s in sources}
    recommendations = []

    for sink in sorted_sinks:
        needed = sink["deficit"]
        d_id = sink["facility_id"]
        
        # Sort sources by road distance ascending
        candidate_sources = [
            s for s in sources 
            if distance_fn(s["facility_id"], d_id) <= MILP_MAX_ROAD_DISTANCE_KM and source_avail.get(s["facility_id"], 0) >= pack_size_P
        ]
        candidate_sources.sort(key=lambda s: distance_fn(s["facility_id"], d_id))

        for src in candidate_sources:
            if needed <= 0:
                break
            s_id = src["facility_id"]
            avail = source_avail[s_id]
            max_packs = avail // pack_size_P
            needed_packs = math.ceil(needed / pack_size_P)
            allocated_packs = min(max_packs, needed_packs)
            allocated_qty = allocated_packs * pack_size_P

            if allocated_qty > 0:
                dist = distance_fn(s_id, d_id)
                recommendations.append({
                    "source_facility_id": s_id,
                    "destination_facility_id": d_id,
                    "quantity": allocated_qty,
                    "distance_km": dist,
                    "cost_inr": calculate_transport_cost(dist),
                    "eta_hours": calculate_eta_hours(dist),
                    "solver_status": "HEURISTIC_GREEDY"
                })
                source_avail[s_id] -= allocated_qty
                needed -= allocated_qty

    return recommendations
