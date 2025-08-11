#!/usr/bin/env python
# Script to generate mock SKUs, an event, and sales lines for the 'demo' user
from datetime import date
from random import choice, randint, uniform
from ledger.models import SKU, Event, SaleLine

USER = "demo"

# 1. Create SKUs for prints, keychains, stickers
sku_data = [
    {"name": "Print-Anya", "item_type": "print", "default_price": 20, "default_cost": 5},
    {"name": "Print-Loid", "item_type": "print", "default_price": 20, "default_cost": 5},
    {"name": "Keychain-Star", "item_type": "keychain", "default_price": 10, "default_cost": 2},
    {"name": "Keychain-Heart", "item_type": "keychain", "default_price": 10, "default_cost": 2},
    {"name": "Sticker-Smiley", "item_type": "sticker", "default_price": 3, "default_cost": 0.5},
    {"name": "Sticker-Cat", "item_type": "sticker", "default_price": 3, "default_cost": 0.5},
]

skus = []
for data in sku_data:
    sku, _ = SKU.objects.get_or_create(
        user=USER,
        name=data["name"],
        item_type=data["item_type"],
        defaults={
            "default_price": data["default_price"],
            "default_cost": data["default_cost"]
        }
    )
    skus.append(sku)
print(f"Created {len(skus)} SKUs for user '{USER}'")

# 2. Create an event called 'Birthday'
event, _ = Event.objects.get_or_create(user=USER, name="Birthday", defaults={"start_date": date.today()})
print(f"Created event: {event.name}")

# 3. Create mock sales lines (mix of single and bundle sales)
for i in range(50):
    sku = choice(skus)
    is_bundle = choice([True, False])
    units = randint(1, 3) if not is_bundle else randint(2, 4)
    price_unit = float(sku.default_price)
    cost_unit = float(sku.default_cost)
    bundle_id = None
    bundle_size = None
    bundle_price = None
    if is_bundle:
        bundle_id = f"BUNDLE-{i}"
        bundle_size = units
        bundle_price = round(uniform(10, 40), 2)
    SaleLine(
        user=USER,
        event=event,
        sku=sku,
        sale_date=date.today(),
        units=units,
        price_unit=price_unit,
        cost_unit=cost_unit,
        is_bundle=is_bundle,
        bundle_id=bundle_id,
        bundle_size=bundle_size,
        bundle_price=bundle_price,
        is_gift=False,
        notes="demo mock sale"
    ).save()
print("Created 50 mock sales lines for 'demo' user.")
