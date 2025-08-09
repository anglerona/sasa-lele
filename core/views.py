from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from mongoengine.errors import DoesNotExist, ValidationError
from ledger.models import Event, SaleLine
from ledger.serializers import EventSerializer, SKUSerializer
from ledger.models import Event, SKU, SaleLine


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"ok": True, "service": "bookkeeper-api"})
    
class SKUDetail(APIView):
    def get(self, req, pk):
        try: obj = SKU.objects.get(id=pk)
        except (DoesNotExist, ValidationError):
            return Response({"detail":"Not found"}, status=404)
        return Response(SKUSerializer(obj).data)

    def patch(self, req, pk):
        try: obj = SKU.objects.get(id=pk)
        except (DoesNotExist, ValidationError):
            return Response({"detail":"Not found"}, status=404)
        # partial update allowed
        data = {**{ "name": obj.name, "item_type": obj.item_type,
                    "default_price": obj.default_price, "default_cost": obj.default_cost}, **req.data}
        s = SKUSerializer(obj, data=data)
        s.is_valid(raise_exception=True)
        # mongoengine: manually assign then save
        v = s.validated_data
        obj.name = v["name"]; obj.item_type = v["item_type"]
        obj.default_price = v.get("default_price")
        obj.default_cost = v.get("default_cost")
        obj.save()
        return Response(SKUSerializer(obj).data)

    def delete(self, req, pk):
        try: obj = SKU.objects.get(id=pk)
        except (DoesNotExist, ValidationError):
            return Response({"detail":"Not found"}, status=404)
        # optional: block if linked sales exist
        has_lines = SaleLine.objects(sku=obj).only('id').first() is not None
        if has_lines:
            return Response({"detail":"Cannot delete SKU with sales."}, status=400)
        obj.delete()
        return Response(status=204)
    

class EventDetail(APIView):
    def get(self, req, pk):
        try: ev = Event.objects.get(id=pk)
        except (DoesNotExist, ValidationError):
            return Response({"detail":"Not found"}, status=404)
        return Response(EventSerializer(ev).data)

    def patch(self, req, pk):
        try: ev = Event.objects.get(id=pk)
        except (DoesNotExist, ValidationError):
            return Response({"detail":"Not found"}, status=404)
        # allow partial: merge current + incoming
        data = { "name": ev.name, "start_date": ev.start_date, "end_date": ev.end_date, **req.data }
        s = EventSerializer(ev, data=data)
        s.is_valid(raise_exception=True)
        v = s.validated_data
        ev.name = v["name"]; ev.start_date = v["start_date"]; ev.end_date = v["end_date"]
        ev.save()
        return Response(EventSerializer(ev).data)

    def delete(self, request, pk, *args, **kwargs):
        # Sanity probe: ensure we're in THIS method
        # (uncomment while testing)
        # return Response({"hit": "delete"}, status=200)

        try:
            ev = Event.objects.get(id=pk)
        except (DoesNotExist, ValidationError):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # If there are sales, block unless ?force=1
        has_sales = SaleLine.objects(event=ev).only('id').first() is not None
        force = request.query_params.get("force", "").lower() in ("1", "true", "yes")

        if has_sales and not force:
            return Response(
                {"detail": "Cannot delete: sales exist for this event. Add ?force=1 to cascade."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if has_sales and force:
            SaleLine.objects(event=ev).delete()

        ev.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
