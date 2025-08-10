#!/usr/bin/env python
# Delete all SKUs with user=None or user=""
from ledger.models import SKU
count = 0
for sku in SKU.objects(user=None):
    print(f"Deleting SKU with user=None: id={sku.id} name={sku.name!r} item_type={sku.item_type!r}")
    sku.delete()
    count += 1
for sku in SKU.objects(user=""):
    print(f"Deleting SKU with user='': id={sku.id} name={sku.name!r} item_type={sku.item_type!r}")
    sku.delete()
    count += 1
print(f"Deleted {count} SKUs with user=None or user=''!")
