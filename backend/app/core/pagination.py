from dataclasses import dataclass

from fastapi import Query

DEFAULT_PAGE_SIZE = 10
MAX_PAGE_SIZE = 100


@dataclass
class PaginationParams:
    limit: int
    page: int


def get_pagination(
    limit: int | None = None,
    page: int = 1,
    default_page_size: int = DEFAULT_PAGE_SIZE,
    max_page_size: int = MAX_PAGE_SIZE,
) -> tuple[int, int]:
    normalized_limit = default_page_size if limit is None else max(1, min(limit, max_page_size))
    normalized_offset = (max(page, 1) - 1) * normalized_limit
    return normalized_limit, normalized_offset


def pagination_params(
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    page: int = Query(default=1, ge=1, description="1-based page number"),
) -> PaginationParams:
    normalized_limit, _ = get_pagination(limit=limit, page=page)
    return PaginationParams(limit=normalized_limit, page=page)
