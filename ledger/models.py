import mongoengine as me
from django.contrib.auth.models import User

class Event(me.Document):
    user = me.StringField(required=True)  # store user id as string
    name = me.StringField(required=True)          # e.g., "Anime North 2025"
    start_date = me.DateField(required=False, null=True)
    end_date = me.DateField(required=False, null=True)
    meta = {"collection": "events", "indexes": ["user", "start_date", "end_date", "name"]}

class SKU(me.Document):
    user = me.StringField(required=True)  # store user id as string
    name = me.StringField(required=True, unique_with=["user", "item_type"])   # e.g., "Keychain-Gojo"
    item_type = me.StringField(required=True, choices=("print","keychain","sticker","other"))
    default_price = me.Decimal128Field(precision=2, default=0)
    default_cost = me.Decimal128Field(precision=2, default=0)
    meta = {"collection": "skus", "indexes": ["user", "item_type", "name"]}

class SaleLine(me.Document):
    user = me.StringField(required=True)  # store user id as string
    event = me.ReferenceField('Event', required=True, reverse_delete_rule=me.CASCADE)
    sku = me.ReferenceField('SKU', required=True, reverse_delete_rule=me.DENY)
    sale_date = me.DateField(required=True)
    units = me.IntField(min_value=1, required=True)
    price_unit = me.Decimal128Field(precision=2, required=True)   # entered
    cost_unit = me.Decimal128Field(precision=2, required=True)    # entered
    is_bundle = me.BooleanField(default=False)                     # entered (Y/N)
    bundle_id = me.StringField(required=False, null=True)          # bundle tracking
    bundle_size = me.IntField(required=False, null=True)           # number of items in bundle
    bundle_price = me.Decimal128Field(precision=2, required=False, null=True) # total price for bundle
    is_gift = me.BooleanField(default=False)                       # entered (Y/N)
    notes = me.StringField()
    meta = {
        "collection": "sale_lines",
        "indexes": [
            "user", "sale_date", "event", "sku",
            ("user", "event", "sale_date"),
            ("user", "event", "sku"),
            "bundle_id",
        ]
    }
