"""Runtime constants shared by backend configuration defaults.

Frontend mirrors these names in `frontend/src/app/domain/constants.ts`.
Keep the values aligned until a generated contract replaces this module.
"""

AUTH_SESSION_DAYS = 7
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * AUTH_SESSION_DAYS
INVITE_TOKEN_EXPIRE_HOURS = 24 * AUTH_SESSION_DAYS
RESET_TOKEN_EXPIRE_HOURS = 1
