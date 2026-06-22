import importlib
import sys
import warnings
from datetime import timedelta


def import_without_deprecation_warnings(module_name: str):
    sys.modules.pop(module_name, None)
    with warnings.catch_warnings():
        warnings.simplefilter("error", DeprecationWarning)
        return importlib.import_module(module_name)


def test_pydantic_schemas_import_without_deprecation_warnings():
    import_without_deprecation_warnings("domains.identity.schemas")
    import_without_deprecation_warnings("domains.dataset.schemas")


def test_identity_token_expiry_uses_timezone_aware_datetime_without_warning():
    service = import_without_deprecation_warnings("domains.identity.service")

    with warnings.catch_warnings():
        warnings.simplefilter("error", DeprecationWarning)
        service.create_access_token({"sub": "warning-check"}, timedelta(minutes=1))
