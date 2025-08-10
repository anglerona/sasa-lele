#!/usr/bin/env python
# List all SKUs with name 'Print-Anya' and item_type 'print', showing user field
from ledger.models import SKU
for sku in SKU.objects(name="Print-Anya", item_type="print"):
    print(f"user={sku.user!r} name={sku.name!r} item_type={sku.item_type!r} id={sku.id}")
