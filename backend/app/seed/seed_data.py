"""
Deterministic Seed Data Generator (Seed 42) for ResilHealth-India.
Complies with Part O of the Master Specification.
Seeds 6 States, 18 Districts, 90+ Facilities, 10+ Drug SKUs, and exact Kanchipuram parameters.
"""

import random
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from app.models.models import (
    Facility, Drug, InventoryBatch, InventoryLedger, TransferRecommendation,
    AuditLog, FederatedRound, FieldSignal, DemoScenario
)
from app.core.rules_config import DEMO_DATE

# Seed for absolute reproducibility
RANDOM_SEED = 42

ROAD_DISTANCES_KANCHIPURAM = {
    ("PHC-Anakaputhur", "PHC-Chromepet"): 12.0,
    ("PHC-Chromepet", "PHC-Anakaputhur"): 12.0,
    ("PHC-Anakaputhur", "PHC-Pallavaram"): 8.5,
    ("PHC-Pallavaram", "PHC-Anakaputhur"): 8.5,
    ("PHC-Anakaputhur", "PHC-Tambaram"): 14.0,
    ("PHC-Tambaram", "PHC-Anakaputhur"): 14.0,
    ("PHC-Anakaputhur", "PHC-Sriperumbudur"): 28.0,
    ("PHC-Sriperumbudur", "PHC-Anakaputhur"): 28.0,
    ("PHC-Chromepet", "PHC-Pallavaram"): 4.5,
    ("PHC-Pallavaram", "PHC-Chromepet"): 4.5,
    ("PHC-Chromepet", "PHC-Tambaram"): 7.2,
    ("PHC-Tambaram", "PHC-Chromepet"): 7.2,
    ("PHC-Chromepet", "PHC-Sriperumbudur"): 31.0,
    ("PHC-Sriperumbudur", "PHC-Chromepet"): 31.0,
    ("PHC-Pallavaram", "PHC-Tambaram"): 9.0,
    ("PHC-Tambaram", "PHC-Pallavaram"): 9.0,
    ("PHC-Pallavaram", "PHC-Sriperumbudur"): 29.5,
    ("PHC-Sriperumbudur", "PHC-Pallavaram"): 29.5,
    ("PHC-Tambaram", "PHC-Sriperumbudur"): 25.0,
    ("PHC-Sriperumbudur", "PHC-Tambaram"): 25.0,
}

def get_kanchipuram_distance(code_a: str, code_b: str) -> float:
    if code_a == code_b:
        return 0.0
    key = (code_a, code_b)
    if key in ROAD_DISTANCES_KANCHIPURAM:
        return ROAD_DISTANCES_KANCHIPURAM[key]
    return 15.0

def seed_database(db: Session):
    random.seed(RANDOM_SEED)

    # 1. Clean existing records
    db.query(FieldSignal).delete()
    db.query(FederatedRound).delete()
    db.query(AuditLog).delete()
    db.query(TransferRecommendation).delete()
    db.query(InventoryLedger).delete()
    db.query(InventoryBatch).delete()
    db.query(Drug).delete()
    db.query(Facility).delete()
    db.query(DemoScenario).delete()
    db.commit()

    # 2. Seed Drugs (10 SKUs)
    drugs_data = [
        {"id": "DRUG-AL-01", "code": "AL-10", "name": "Artemether-Lumefantrine", "category": "Essential Anti-Malarial", "unit": "treatment pack", "pack_size": 10, "safety_days": 2, "min_shelf_life_days": 7},
        {"id": "DRUG-PCM-01", "code": "PCM-500", "name": "Paracetamol 500mg", "category": "Analgesic / Antipyretic", "unit": "blister strip", "pack_size": 20, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-ORS-01", "code": "ORS-S", "name": "Oral Rehydration Salts (ORS)", "category": "Electrolyte Solution", "unit": "sachet", "pack_size": 25, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-AMO-01", "code": "AMO-500", "name": "Amoxicillin 500mg", "category": "Antibiotic", "unit": "strip", "pack_size": 10, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-AZI-01", "code": "AZI-500", "name": "Azithromycin 500mg", "category": "Antibiotic", "unit": "strip", "pack_size": 6, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-CIP-01", "code": "CIP-500", "name": "Ciprofloxacin 500mg", "category": "Fluoroquinolone Antibiotic", "unit": "strip", "pack_size": 10, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-MET-01", "code": "MET-500", "name": "Metformin 500mg", "category": "Anti-Diabetic", "unit": "strip", "pack_size": 20, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-AML-01", "code": "AML-5", "name": "Amlodipine 5mg", "category": "Antihypertensive", "unit": "strip", "pack_size": 30, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-INS-01", "code": "INS-REG", "name": "Human Insulin Regular 40IU", "category": "Cold-Chain Endocrine", "unit": "vial", "pack_size": 5, "safety_days": 7, "min_shelf_life_days": 7},
        {"id": "DRUG-DEX-01", "code": "DEX-5", "name": "Dextrose 5% IV 500ml", "category": "Intravenous Fluid", "unit": "bottle", "pack_size": 10, "safety_days": 7, "min_shelf_life_days": 7},
    ]

    for d in drugs_data:
        db.add(Drug(**d))
    db.commit()

    # 3. Seed Facilities
    # States: Tamil Nadu, Kerala, Maharashtra, Uttar Pradesh, Assam, Rajasthan
    facilities_list = []

    # KANCHIPURAM (Tamil Nadu) - Master Test District
    kanchipuram_facilities = [
        {"id": "FAC-TN-KAN-001", "code": "PHC-Anakaputhur", "name": "PHC Anakaputhur", "facility_type": "PHC", "state": "Tamil Nadu", "district": "Kanchipuram", "latitude": 12.9738, "longitude": 80.1215, "lead_time_days": 5, "footfall_daily": 140},
        {"id": "FAC-TN-KAN-002", "code": "PHC-Chromepet", "name": "PHC Chromepet", "facility_type": "PHC", "state": "Tamil Nadu", "district": "Kanchipuram", "latitude": 12.9516, "longitude": 80.1462, "lead_time_days": 5, "footfall_daily": 110},
        {"id": "FAC-TN-KAN-003", "code": "PHC-Pallavaram", "name": "PHC Pallavaram", "facility_type": "PHC", "state": "Tamil Nadu", "district": "Kanchipuram", "latitude": 12.9675, "longitude": 80.1491, "lead_time_days": 5, "footfall_daily": 130},
        {"id": "FAC-TN-KAN-004", "code": "PHC-Tambaram", "name": "PHC Tambaram", "facility_type": "PHC", "state": "Tamil Nadu", "district": "Kanchipuram", "latitude": 12.9249, "longitude": 80.1000, "lead_time_days": 5, "footfall_daily": 160},
        {"id": "FAC-TN-KAN-005", "code": "PHC-Sriperumbudur", "name": "PHC Sriperumbudur", "facility_type": "PHC", "state": "Tamil Nadu", "district": "Kanchipuram", "latitude": 12.9699, "longitude": 79.9490, "lead_time_days": 5, "footfall_daily": 125},
    ]
    facilities_list.extend(kanchipuram_facilities)

    # Other districts & states to reach 90+ facilities across 6 states & 18 districts
    state_districts = {
        "Tamil Nadu": [
            ("Chennai", 13.0827, 80.2707),
            ("Chengalpattu", 12.6819, 79.9888),
        ],
        "Kerala": [
            ("Ernakulam", 9.9816, 76.2999),
            ("Thiruvananthapuram", 8.5241, 76.9366),
            ("Wayanad", 11.6854, 76.1320),
        ],
        "Maharashtra": [
            ("Pune", 18.5204, 73.8567),
            ("Mumbai Suburban", 19.0760, 72.8777),
            ("Nashik", 19.9975, 73.7898),
        ],
        "Uttar Pradesh": [
            ("Lucknow", 26.8467, 80.9462),
            ("Varanasi", 25.3176, 82.9739),
            ("Gorakhpur", 26.7606, 83.3732),
        ],
        "Assam": [
            ("Kamrup Metropolitan", 26.1445, 91.7362),
            ("Dibrugarh", 27.4728, 94.9120),
            ("Cachar", 24.8333, 92.8000),
        ],
        "Rajasthan": [
            ("Jaipur", 26.9124, 75.7873),
            ("Jodhpur", 26.2389, 73.0243),
            ("Udaipur", 24.5854, 73.7125),
        ],
    }

    DISTRICT_ABBRS = {
        "Chennai": "CHN",
        "Chengalpattu": "CGP",
        "Ernakulam": "EKM",
        "Thiruvananthapuram": "TVM",
        "Wayanad": "WYD",
        "Pune": "PUN",
        "Mumbai Suburban": "MUM",
        "Nashik": "NSK",
        "Lucknow": "LKO",
        "Varanasi": "VNS",
        "Gorakhpur": "GKP",
        "Kamrup Metropolitan": "KMR",
        "Dibrugarh": "DBR",
        "Cachar": "CCH",
        "Jaipur": "JPR",
        "Jodhpur": "JDH",
        "Udaipur": "UDZ",
    }

    fac_idx = 6
    for st, districts in state_districts.items():
        st_abbr = "".join([part[0] for part in st.split()]).upper() if len(st.split()) > 1 else st[:2].upper()
        for dist_name, base_lat, base_lon in districts:
            dist_abbr = DISTRICT_ABBRS.get(dist_name, dist_name[:3].upper())
            for i in range(1, 6):  # 5 facilities per district
                fac_code = f"PHC-{st_abbr}-{dist_abbr}-{i:02d}"
                lat_jitter = base_lat + random.uniform(-0.10, 0.10)
                lon_jitter = base_lon + random.uniform(-0.10, 0.10)
                fac_type = "CHC" if i == 5 else "PHC"
                facilities_list.append({
                    "id": f"FAC-{fac_idx:04d}",
                    "code": fac_code,
                    "name": f"{fac_type} {dist_name} Sector-{i}",
                    "facility_type": fac_type,
                    "state": st,
                    "district": dist_name,
                    "latitude": round(lat_jitter, 5),
                    "longitude": round(lon_jitter, 5),
                    "lead_time_days": random.choice([4, 5, 6]),
                    "footfall_daily": random.randint(80, 200)
                })
                fac_idx += 1

    for f_data in facilities_list:
        db.add(Facility(**f_data))
    db.commit()

    # 4. Seed Batches and Baseline Stock
    # Part O Specifics for Kanchipuram:
    # O4: Anakaputhur: opening usable stock = 250 units AL
    # O5: Chromepet: stock = 221 units AL (Batch B240715 = 200 units exp in 60d; Batch B250101 = 21 units exp in 300d)
    # Pallavaram: stock = 180 units AL, Tambaram: 210 units AL, Sriperumbudur: 190 units AL

    base_date = DEMO_DATE

    # Chromepet batches
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-002",
        drug_id="DRUG-AL-01",
        batch_number="B240715",
        quantity=200,
        expiry_date=base_date + timedelta(days=60),
        is_verified=True
    ))
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-002",
        drug_id="DRUG-AL-01",
        batch_number="B250101",
        quantity=21,
        expiry_date=base_date + timedelta(days=300),
        is_verified=True
    ))

    # Anakaputhur batches (250 units AL)
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-001",
        drug_id="DRUG-AL-01",
        batch_number="B240601",
        quantity=250,
        expiry_date=base_date + timedelta(days=180),
        is_verified=True
    ))

    # Pallavaram (180 units AL, plus 400 PCM)
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-003",
        drug_id="DRUG-AL-01",
        batch_number="B240801",
        quantity=180,
        expiry_date=base_date + timedelta(days=120),
        is_verified=True
    ))
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-003",
        drug_id="DRUG-PCM-01",
        batch_number="B240901",
        quantity=400,
        expiry_date=base_date + timedelta(days=240),
        is_verified=True
    ))

    # Tambaram (210 units AL)
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-004",
        drug_id="DRUG-AL-01",
        batch_number="B240810",
        quantity=210,
        expiry_date=base_date + timedelta(days=150),
        is_verified=True
    ))

    # Sriperumbudur (190 units AL)
    db.add(InventoryBatch(
        facility_id="FAC-TN-KAN-005",
        drug_id="DRUG-AL-01",
        batch_number="B240820",
        quantity=190,
        expiry_date=base_date + timedelta(days=210),
        is_verified=True
    ))

    # Add other drugs to Kanchipuram facilities to ensure comprehensive stocks
    for fac_id in ["FAC-TN-KAN-001", "FAC-TN-KAN-002", "FAC-TN-KAN-004", "FAC-TN-KAN-005"]:
        db.add(InventoryBatch(
            facility_id=fac_id,
            drug_id="DRUG-PCM-01",
            batch_number=f"B2409-{fac_id[-3:]}",
            quantity=random.randint(300, 600),
            expiry_date=base_date + timedelta(days=random.randint(90, 360)),
            is_verified=True
        ))
        db.add(InventoryBatch(
            facility_id=fac_id,
            drug_id="DRUG-ORS-01",
            batch_number=f"B2409-ORS-{fac_id[-3:]}",
            quantity=random.randint(250, 500),
            expiry_date=base_date + timedelta(days=random.randint(120, 400)),
            is_verified=True
        ))

    # Seed batches for all other facilities across India
    other_facilities = [f for f in facilities_list if f["id"] not in ["FAC-TN-KAN-001", "FAC-TN-KAN-002", "FAC-TN-KAN-003", "FAC-TN-KAN-004", "FAC-TN-KAN-005"]]
    for fac in other_facilities:
        # Each facility gets AL and 2-3 other medicines
        db.add(InventoryBatch(
            facility_id=fac["id"],
            drug_id="DRUG-AL-01",
            batch_number=f"B24-AL-{fac['id'][-4:]}",
            quantity=random.randint(150, 350),
            expiry_date=base_date + timedelta(days=random.randint(45, 300)),
            is_verified=True
        ))
        db.add(InventoryBatch(
            facility_id=fac["id"],
            drug_id="DRUG-PCM-01",
            batch_number=f"B24-PCM-{fac['id'][-4:]}",
            quantity=random.randint(200, 500),
            expiry_date=base_date + timedelta(days=random.randint(60, 350)),
            is_verified=True
        ))
        db.add(InventoryBatch(
            facility_id=fac["id"],
            drug_id="DRUG-ORS-01",
            batch_number=f"B24-ORS-{fac['id'][-4:]}",
            quantity=random.randint(100, 300),
            expiry_date=base_date + timedelta(days=random.randint(60, 350)),
            is_verified=True
        ))

    db.commit()

    # 5. Seed Pre-run Federated Rounds (Part N: Rounds 1-5 pre-computed, Round 6 demo)
    rounds_data = [
        {"round_number": 1, "local_epochs": 3, "dp_noise": 1.12, "epsilon": 0.85, "delta": 1e-5, "global_loss": 0.428, "india_mae": 4.82, "brazil_mae": 5.12, "status": "COMPLETED"},
        {"round_number": 2, "local_epochs": 3, "dp_noise": 1.12, "epsilon": 1.25, "delta": 1e-5, "global_loss": 0.365, "india_mae": 4.15, "brazil_mae": 4.58, "status": "COMPLETED"},
        {"round_number": 3, "local_epochs": 3, "dp_noise": 1.12, "epsilon": 1.62, "delta": 1e-5, "global_loss": 0.312, "india_mae": 3.78, "brazil_mae": 4.05, "status": "COMPLETED"},
        {"round_number": 4, "local_epochs": 3, "dp_noise": 1.12, "epsilon": 1.90, "delta": 1e-5, "global_loss": 0.278, "india_mae": 3.42, "brazil_mae": 3.72, "status": "COMPLETED"},
        {"round_number": 5, "local_epochs": 3, "dp_noise": 1.12, "epsilon": 2.15, "delta": 1e-5, "global_loss": 0.245, "india_mae": 3.15, "brazil_mae": 3.40, "status": "COMPLETED"},
    ]
    for r in rounds_data:
        db.add(FederatedRound(**r))

    # 6. Seed Demo Scenario
    db.add(DemoScenario(
        id="default-scenario",
        active_scenario="BASELINE",
        outbreak_spike_active=False,
        offline_mode_active=False,
        fallback_vertex=False,
        fallback_gemini=False,
        server_vector_clock=100,
        last_reset_timestamp=datetime.utcnow()
    ))

    # 7. Initial Audit Log
    db.add(AuditLog(
        actor="SYSTEM_SEED",
        role="SYSTEM",
        scope="NATIONAL",
        action="DATABASE_SEEDED",
        reason="Deterministic baseline initialization (Seed 42)",
        payload_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        metadata_json={"facilities_count": len(facilities_list), "demo_date": base_date.isoformat()}
    ))

    db.commit()
    print(f"Database seeded successfully with {len(facilities_list)} facilities across 6 states.")

if __name__ == "__main__":
    from app.core.database import SessionLocal, init_db
    init_db()
    with SessionLocal() as db_session:
        seed_database(db_session)
