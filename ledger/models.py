import mongoengine as me

class Event(me.Document):
    name = me.StringField(required=True)          # e.g., "Anime North 2025"
    start_date = me.DateField(required=False, null=True)
    end_date = me.DateField(required=False, null=True)
    meta = {"collection": "events", "indexes": ["start_date", "end_date", "name"]}

class SKU(me.Document):
    name = me.StringField(required=True, unique_with="item_type")   # e.g., "Keychain-Gojo"
    item_type = me.StringField(required=True, choices=("print","keychain","sticker","other"))
    default_price = me.Decimal128Field(precision=2, default=0)
    default_cost = me.Decimal128Field(precision=2, default=0)
    meta = {"collection": "skus", "indexes": ["item_type", "name"]}

class SaleLine(me.Document):
    event = me.ReferenceField(Event, required=True, reverse_delete_rule=me.CASCADE)
    sku = me.ReferenceField(SKU, required=True, reverse_delete_rule=me.DENY)
    sale_date = me.DateField(required=True)
    units = me.IntField(min_value=1, required=True)
    price_unit = me.Decimal128Field(precision=2, required=True)   # entered
    cost_unit = me.Decimal128Field(precision=2, required=True)    # entered
    is_bundle = me.BooleanField(default=False)                     # entered (Y/N)
    is_gift = me.BooleanField(default=False)                       # entered (Y/N)
    notes = me.StringField()
    meta = {
        "collection": "sale_lines",
        "indexes": [
            "sale_date", "event", "sku",
            ("event", "sale_date"),
            ("event", "sku"),
        ]
    }
