import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from pathlib import Path

# 1. Add backend root to sys.path so we can import 'core' and 'domains'
# __file__ is backend/alembic/env.py, so we go up twice
backend_path = str(Path(__file__).parent.parent)
if backend_path not in sys.path:
    sys.path.append(backend_path)

# 2. Import project components
from core.database import Base
from core.config import settings

# 3. Import ALL domain models to ensure they are registered in metadata
from domains.dataset import models as _dataset
from domains.observability import models as _observability
from domains.identity import models as _identity
from domains.sales import models as _sales
from domains.finance import models as _finance
from domains.intelligence import models as _intelligence
from domains.inventory import models as _inventory
from domains.notification import models as _notification
from domains.reporting import models as _reporting
from domains.branches import models as _branches

# 4. Set target metadata
target_metadata = Base.metadata

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # Override URL from settings
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Configuration for connection
    configuration = config.get_section(config.config_ini_section, {})
    # Override URL with project settings
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
