from rest_framework import serializers
from bson import ObjectId
from decimal import Decimal
from .models import Event, SKU, SaleLine

class ObjectIdField(serializers.Field):
    def to_representation(self, value):
        return str(value.id) if hasattr(value, "id") else str(value)

    def to_internal_value(self, data):
        from bson.errors import InvalidId
        if not data or str(data).strip() == "":
            raise serializers.ValidationError("This field is required and must be a valid ObjectId.")
        try:
            return ObjectId(str(data))
        except (InvalidId, TypeError, ValueError):
            raise serializers.ValidationError(f"'{data}' is not a valid ObjectId.")

class EventSerializer(serializers.Serializer):
    id = ObjectIdField(read_only=True)
    name = serializers.CharField()
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    user = serializers.CharField(read_only=True)
    def create(self, data):
        user = self.context.get('user')
        return Event(user=user, **data).save()

class SKUSerializer(serializers.Serializer):
    id = ObjectIdField(read_only=True)
    name = serializers.CharField()
    item_type = serializers.ChoiceField(choices=("print","keychain","sticker","other"))
    default_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    default_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    user = serializers.CharField(read_only=True)

    def create(self, data):
        user = self.context.get('user')
        return SKU(user=user, **data).save()

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['user'] = getattr(instance, 'user', None)
        return rep

class SaleLineSerializer(serializers.Serializer):
    def update(self, instance, validated_data):
        # Update event and sku if provided
        if "event_id" in validated_data:
            instance.event = Event.objects.get(id=validated_data.pop("event_id"))
        if "sku_id" in validated_data:
            instance.sku = SKU.objects.get(id=validated_data.pop("sku_id"))
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    id = ObjectIdField(read_only=True)
    event_id = ObjectIdField(write_only=True)
    sku_id = ObjectIdField(write_only=True)
    sale_date = serializers.DateField()
    units = serializers.IntegerField(min_value=1)
    price_unit = serializers.DecimalField(max_digits=10, decimal_places=2)
    cost_unit = serializers.DecimalField(max_digits=10, decimal_places=2)
    is_bundle = serializers.BooleanField(default=False)
    bundle_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    bundle_size = serializers.IntegerField(required=False, allow_null=True)
    bundle_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    is_gift = serializers.BooleanField(default=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    user = serializers.CharField(read_only=True)

    # derived (read-only)
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cogs = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    gross_margin_unit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    gross_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    def create(self, data):
        user = self.context.get('user')
        event = Event.objects.get(id=data.pop("event_id"))
        sku = SKU.objects.get(id=data.pop("sku_id"))
        return SaleLine(user=user, event=event, sku=sku, **data).save()

    def to_representation(self, instance):
        rep = {
            "id": str(instance.id),
            "event": {"id": str(instance.event.id), "name": instance.event.name},
            "sku": {"id": str(instance.sku.id), "name": instance.sku.name, "item_type": instance.sku.item_type},
            "sale_date": instance.sale_date.isoformat(),
            "units": instance.units,
            "price_unit": str(instance.price_unit),
            "cost_unit": str(instance.cost_unit),
            "is_bundle": instance.is_bundle,
            "bundle_id": getattr(instance, "bundle_id", None),
            "bundle_size": getattr(instance, "bundle_size", None),
            "bundle_price": str(getattr(instance, "bundle_price", "")) if getattr(instance, "bundle_price", None) is not None else None,
            "is_gift": getattr(instance, "is_gift", False),
            "notes": instance.notes or "",
        }
        price = Decimal(str(instance.price_unit))
        cost = Decimal(str(instance.cost_unit))
        units = Decimal(instance.units)
        revenue = units * price
        cogs = units * cost
        gross_margin_unit = price - cost
        gross_profit = revenue - cogs
        rep.update({
            "revenue": f"{revenue:.2f}",
            "cogs": f"{cogs:.2f}",
            "gross_margin_unit": f"{gross_margin_unit:.2f}",
            "gross_profit": f"{gross_profit:.2f}",
        })
        return rep
