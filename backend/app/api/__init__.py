from fastapi import APIRouter
from app.api.routes_health import router as health_router
from app.api.routes_summary import router as summary_router
from app.api.routes_countries import router as countries_router
from app.api.routes_india import router as india_router
from app.api.routes_trends import router as trends_router
from app.api.routes_analytics import router as analytics_router
from app.api.routes_data import router as data_router
from app.api.routes_prediction import router as prediction_router
from app.api.routes_metadata import router as metadata_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(summary_router)
api_router.include_router(countries_router)
api_router.include_router(india_router)
api_router.include_router(trends_router)
api_router.include_router(analytics_router)
api_router.include_router(data_router)
api_router.include_router(prediction_router)
api_router.include_router(metadata_router)

__all__ = ["api_router"]
