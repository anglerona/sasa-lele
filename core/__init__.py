import os
from mongoengine import connect
from dotenv import load_dotenv

load_dotenv()
connect(
	host=os.getenv("MONGODB_URI"),
	tls=True,
	tlsAllowInvalidCertificates=True  # Only for debugging! Remove in production if possible.
)