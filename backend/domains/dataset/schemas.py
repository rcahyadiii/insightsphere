from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class StoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    store_nbr: int
    city: str
    state: str
    type: str
    cluster: int
