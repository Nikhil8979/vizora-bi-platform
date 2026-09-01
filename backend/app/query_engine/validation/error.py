from dataclasses import dataclass

@dataclass(frozen=True)
class QueryValidationError:
    code: str
    message: str
    path: str | None = None