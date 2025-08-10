#!/usr/bin/env python
# List all SKUs with user, name, item_type, and id for debugging uniqueness issues
from ledger.models import SKU
for sku in SKU.objects():
    print(f"user={sku.user!r} name={sku.name!r} item_type={sku.item_type!r} id={sku.id}")
