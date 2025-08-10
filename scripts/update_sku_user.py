from ledger.models import SKU

# Set all existing SKUs to user 'angelina'
for sku in SKU.objects(user__exists=False):
    sku.user = 'angelina'
    sku.save()
print('All SKUs updated with user=angelina')
