from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_backend_auth_expiry_uses_named_runtime_constants():
    constants_path = ROOT / "core" / "runtime_constants.py"
    assert constants_path.exists(), "missing backend runtime constants module"

    constants = read("core/runtime_constants.py")
    config = read("core/config.py")

    assert "AUTH_SESSION_DAYS" in constants
    assert "ACCESS_TOKEN_EXPIRE_MINUTES" in constants
    assert "INVITE_TOKEN_EXPIRE_HOURS" in constants
    assert "RESET_TOKEN_EXPIRE_HOURS" in constants

    assert "from core.runtime_constants import" in config
    assert "60 * 24 * 7" not in config
    assert "24 * 7" not in config


def test_backend_roles_are_reused_from_identity_constants():
    constants_path = ROOT / "domains" / "identity" / "constants.py"
    assert constants_path.exists(), "missing identity constants module"

    constants = read("domains/identity/constants.py")
    assert "ROLE_ADMIN" in constants
    assert "ROLE_OWNER" in constants
    assert "ROLE_INVENTORY_MANAGER" in constants
    assert "ROLE_CASHIER" in constants
    assert "ADMIN_OWNER_ROLES" in constants
    assert "STORE_SCOPED_ROLES" in constants

    audited_sources = {
        "core/security.py": read("core/security.py"),
        "domains/identity/service.py": read("domains/identity/service.py"),
        "domains/identity/router.py": read("domains/identity/router.py"),
        "domains/inventory/router.py": read("domains/inventory/router.py"),
        "domains/reporting/router.py": read("domains/reporting/router.py"),
        "domains/notification/routes.py": read("domains/notification/routes.py"),
    }

    for file, source in audited_sources.items():
        assert "domains.identity.constants import" in source, f"{file} should import role constants"
        assert "['owner', 'admin']" not in source
        assert '["owner", "admin"]' not in source
        assert "('admin', 'owner')" not in source
        assert '("admin", "owner")' not in source
        assert '["cashier", "inventory_manager"]' not in source
        assert "['cashier', 'inventory_manager']" not in source


def test_stock_predictor_uses_central_model_config():
    constants_path = ROOT / "domains" / "intelligence" / "stock_predictor_config.py"
    assert constants_path.exists(), "missing stock predictor config module"

    predictor = read("domains/intelligence/stock_predictor.py")
    constants = read("domains/intelligence/stock_predictor_config.py")

    expected_names = [
        "STOCK_PREDICTOR_HORIZONS",
        "STOCK_FEATURE_COLUMNS",
        "STOCK_CATEGORICAL_FEATURES",
        "STOCK_HUBER_PARAMS",
        "STOCK_TWEEDIE_PARAMS",
        "DEFAULT_TRAINING_SAMPLE_LIMIT",
        "DEFAULT_SAFETY_STOCK_QUANTILE",
        "TRAIN_TEST_SPLIT_RATIO",
        "TARGET_CLIP_QUANTILE",
        "MIN_ERROR_BUFFER_SEGMENT_SIZE",
    ]
    for name in expected_names:
        assert name in constants
        assert name in predictor

    assert "HORIZONS = [7, 14, 21, 28]" not in predictor
    assert '"500000"' not in predictor
    assert '"0.85"' not in predictor
    assert "train_ratio: float = 0.8" not in predictor
    assert "quantile(0.9995)" not in predictor
    assert "len(group) >= 5" not in predictor
    assert "huber_params = dict(" not in predictor
    assert "tweedie_params = dict(" not in predictor
