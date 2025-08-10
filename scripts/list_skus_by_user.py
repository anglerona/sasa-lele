from ledger.models import SKU

print("user\tname\titem_type\tid")
for sku in SKU.objects:
    print(f"{sku.user}\t{sku.name}\t{sku.item_type}\t{sku.id}")
