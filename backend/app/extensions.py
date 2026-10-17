"""
Shared Flask extension instances.
Initialised lazily via init_app() inside the factory.
"""
from flask_pymongo import PyMongo
from flask_jwt_extended import JWTManager

mongo = PyMongo()
jwt = JWTManager()
