import logging
import logging.handlers
import os
from config import LOG_DIR, LOG_LEVEL

# Create logs directory if it doesn't exist
os.makedirs(LOG_DIR, exist_ok=True)


import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "recommendations.log",
        }
    },
    "loggers": {
        "upstash_client": {"level": "INFO"},
        "tasks": {"level": "INFO"},
    }
}

logging.config.dictConfig(LOGGING_CONFIG)

def setup_logger(name, log_file="app.log"):
    """
    Setup logger with file and console handlers
    
    Args:
        name: Logger name
        log_file: Name of log file
    
    Returns:
        logger: Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL))
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # File handler - saves to file
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(LOG_DIR, log_file),
        maxBytes=10485760,  # 10MB
        backupCount=5       # Keep 5 backup files
    )
    file_handler.setLevel(getattr(logging, LOG_LEVEL))
    
    # Console handler - prints to terminal
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, LOG_LEVEL))
    
    # Formatter - how logs look
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Add formatter to handlers
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Create loggers for different parts of your system
app_logger = setup_logger("app", "app.log")
recommendation_logger = setup_logger("recommendations", "recommendations.log")
database_logger = setup_logger("database", "database.log")
error_logger = setup_logger("errors", "errors.log")
