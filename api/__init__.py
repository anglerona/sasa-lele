import os
from mongoengine import connect
from dotenv import load_dotenv

load_dotenv()
connect(host=os.getenv("MONGODB_URI"))
