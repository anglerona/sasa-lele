from django.core.management.base import BaseCommand
from datetime import date
from random import choice, randint, uniform
from ledger.models import SKU, Event, SaleLine

class Command(BaseCommand):
    help = 'Generate mock SKUs, an event, and sales lines for the demo user.'

    def handle(self, *args, **options):
        USER = "demo"
        # Create SKUs for prints, keychains, stickers
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
            sku = SKU.objects(user=USER, name=data["name"], item_type=data["item_type"]).first()
            if not sku:
                sku = SKU(
                    user=USER,
                    name=data["name"],
                    item_type=data["item_type"],
                    default_price=data["default_price"],
                    default_cost=data["default_cost"]
                )
                sku.save()
            skus.append(sku)
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(skus)} SKUs for user '{USER}'"))

        # Create events: Birthday and Anime North 2025
        birthday_event = Event.objects(user=USER, name="Birthday").first()
        if not birthday_event:
            birthday_event = Event(user=USER, name="Birthday", start_date=date.today())
            birthday_event.save()
        anime_event = Event.objects(user=USER, name="Anime North 2025").first()
        if not anime_event:
            anime_event = Event(user=USER, name="Anime North 2025", start_date=date(2025, 5, 23))
            anime_event.save()
        self.stdout.write(self.style.SUCCESS(f"Ensured events: {birthday_event.name}, {anime_event.name}"))


        # 5 Birthday sales (all gifts, $0 price, bundles have at least 2 items)
        num_birthday_bundles = 2
        birthday_bundle_sizes = [randint(2, 3) for _ in range(num_birthday_bundles)]
        birthday_bundle_idx = 0
        for b, bundle_size in enumerate(birthday_bundle_sizes):
            bundle_id = f"BIRTHDAY-BUNDLE-{b}"
            notes = f"demo mock sale (Birthday Bundle {b})"
            for j in range(bundle_size):
                sku = choice(skus)
                price_unit = round(float(sku.default_price), 2)
                cost_unit = round(float(sku.default_cost), 2)
                SaleLine(
                    user=USER,
                    event=birthday_event,
                    sku=sku,
                    sale_date=date.today(),
                    units=3,
                    price_unit=0.00,
                    cost_unit=cost_unit,
                    is_bundle=True,
                    bundle_id=bundle_id,
                    bundle_size=bundle_size,
                    bundle_price=0.00,
                    is_gift=True,
                    notes=notes
                ).save()
        # Add non-bundled birthday sales
        for i in range(5 - sum(birthday_bundle_sizes)):
            sku = choice(skus)
            cost_unit = round(float(sku.default_cost), 2)
            SaleLine(
                user=USER,
                event=birthday_event,
                sku=sku,
                sale_date=date.today(),
                units=randint(1, 3),
                price_unit=0.00,
                cost_unit=cost_unit,
                is_bundle=False,
                bundle_id=None,
                bundle_size=None,
                bundle_price=None,
                is_gift=True,
                notes="demo mock sale (Birthday)"
            ).save()

        # 10 Anime North 2025 bundles (each with 2-3 items)
        num_anime_bundles = 7
        anime_bundle_sizes = [randint(2, 3) for _ in range(num_anime_bundles)]
        for b, bundle_size in enumerate(anime_bundle_sizes):
            bundle_id = f"ANIME-BUNDLE-{b}"
            notes = f"demo mock sale (Anime North 2025 Bundle {b})"
            for j in range(bundle_size):
                sku = choice(skus)
                price_unit = round(float(sku.default_price), 2)
                cost_unit = round(float(sku.default_cost), 2)
                SaleLine(
                    user=USER,
                    event=anime_event,
                    sku=sku,
                    sale_date=date.today(),
                    units=3,
                    price_unit=price_unit,
                    cost_unit=cost_unit,
                    is_bundle=True,
                    bundle_id=bundle_id,
                    bundle_size=bundle_size,
                    bundle_price=round(price_unit * 3 * 0.9, 2),
                    is_gift=False,
                    notes=notes
                ).save()
        # Add non-bundled anime sales
        for i in range(25 - sum(anime_bundle_sizes)):
            sku = choice(skus)
            price_unit = round(float(sku.default_price), 2)
            cost_unit = round(float(sku.default_cost), 2)
            SaleLine(
                user=USER,
                event=anime_event,
                sku=sku,
                sale_date=date.today(),
                units=randint(1, 3),
                price_unit=price_unit,
                cost_unit=cost_unit,
                is_bundle=False,
                bundle_id=None,
                bundle_size=None,
                bundle_price=None,
                is_gift=False,
                notes="demo mock sale (Anime North 2025)"
            ).save()
        self.stdout.write(self.style.SUCCESS("Created 5 Birthday and 25 Anime North 2025 mock sales lines for 'demo' user."))
