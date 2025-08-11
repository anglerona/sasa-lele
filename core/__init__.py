import os
from mongoengine import connect, disconnect
from dotenv import load_dotenv

load_dotenv()
disconnect()  # Disconnect any previous default connection
connect(
	host=os.getenv("MONGODB_URI"),
	tls=True,
	tlsAllowInvalidCertificates=True  # Only for debugging! Remove in production if possible.
)