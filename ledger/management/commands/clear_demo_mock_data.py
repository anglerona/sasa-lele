from django.core.management.base import BaseCommand
from ledger.models import SKU, Event, SaleLine

class Command(BaseCommand):
    help = 'Delete all mock SKUs, events, and sales lines for the demo user.'

    def handle(self, *args, **options):
        USER = "demo"
        sale_count = SaleLine.objects(user=USER).delete()
        event_count = Event.objects(user=USER).delete()
        sku_count = SKU.objects(user=USER).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {sale_count} sales lines, {event_count} events, and {sku_count} SKUs for user '{USER}'."))
