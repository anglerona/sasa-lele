from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date
from decimal import Decimal
from mongoengine.queryset.visitor import Q
from .models import Event, SKU, SaleLine
from .serializers import EventSerializer, SKUSerializer, SaleLineSerializer
from bson import ObjectId

class EventListCreate(APIView):
    def get(self, req): return Response(EventSerializer(Event.objects, many=True).data)
    def post(self, req):
        s = EventSerializer(data=req.data); s.is_valid(raise_exception=True)
        return Response(EventSerializer(s.save()).data, status=status.HTTP_201_CREATED)
    


class SKUListCreate(APIView):
    def get(self, req): return Response(SKUSerializer(SKU.objects, many=True).data)
    def post(self, req):
        s = SKUSerializer(data=req.data); s.is_valid(raise_exception=True)
        return Response(SKUSerializer(s.save()).data, status=status.HTTP_201_CREATED)

class SaleListCreate(APIView):
    def get(self, req):
        qs = SaleLine.objects
        if e := req.GET.get("event"):
            try:
                qs = qs.filter(event=ObjectId(e))
            except Exception:
                return Response([], status=200)
        if t := req.GET.get("type"): qs = qs.filter(sku__item_type=t)

        from calendar import monthrange
        y = req.GET.get("year")
        m = req.GET.get("month")
        if y and not m:
            y = int(y)
            qs = qs.filter(sale_date__gte=date(y,1,1), sale_date__lte=date(y,12,31))
        if y and m:
            y = int(y); m = int(m)
            last_day = monthrange(y, m)[1]
            qs = qs.filter(sale_date__gte=date(y,m,1), sale_date__lte=date(y,m,last_day))

        if b := req.GET.get("bundle"):
            qs = qs.filter(is_bundle=(b.lower() in ("1","true","yes","y")))
        qs = qs.order_by("-sale_date")
        return Response(SaleLineSerializer(qs, many=True).data)

    def post(self, req):
        s = SaleLineSerializer(data=req.data)
        s.is_valid(raise_exception=True)
        obj = s.save()
        return Response(SaleLineSerializer(obj).data, status=status.HTTP_201_CREATED)

# --- Analytics helpers ---
def _calc_row(sl: SaleLine):
    from decimal import Decimal
    price = Decimal(str(sl.price_unit)); cost = Decimal(str(sl.cost_unit)); units = Decimal(sl.units)
    revenue = units * price; cogs = units * cost; gp = revenue - cogs
    return {
        "sku": sl.sku, "event": sl.event, "item_type": sl.sku.item_type,
        "units": int(units), "revenue": float(revenue), "cogs": float(cogs), "gross_profit": float(gp)
    }

class AnalyticsTopBottom(APIView):
    # GET /api/analytics/top-bottom?event=<id>&k=gross_profit&limit=5
    def get(self, req):
        key = req.GET.get("k", "gross_profit")
        limit = int(req.GET.get("limit", "5"))
        qs = SaleLine.objects
        if e := req.GET.get("event"): qs = qs.filter(event=e)

        # roll up by SKU
        buckets = {}
        for sl in qs:
            row = _calc_row(sl)
            k = str(sl.sku.id)
            b = buckets.setdefault(k, {"sku_id": k, "sku_name": sl.sku.name, "item_type": sl.sku.item_type,
                                       "units":0, "revenue":0.0, "cogs":0.0, "gross_profit":0.0})
            for f in ("units","revenue","cogs","gross_profit"): b[f] += row[f]

        ranked = sorted(buckets.values(), key=lambda x: x.get(key, 0.0), reverse=True)
        top = ranked[:limit]
        bottom = ranked[-limit:][::-1] if ranked else []
        return Response({"top": top, "bottom": bottom})

class AnalyticsSummary(APIView):
    # GET /api/analytics/summary?group=sku|item_type|event|ym&event=<id>&year=2025
    def get(self, req):
        group = req.GET.get("group","item_type")
        qs = SaleLine.objects
        if e := req.GET.get("event"): qs = qs.filter(event=e)
        if y := req.GET.get("year"): qs = qs.filter(sale_date__year=int(y))

        buckets = {}
        for sl in qs:
            row = _calc_row(sl)
            if group == "sku":
                key, label = str(sl.sku.id), sl.sku.name
            elif group == "event":
                key, label = str(sl.event.id), sl.event.name
            elif group == "ym":
                key = f"{sl.sale_date.year:04d}-{sl.sale_date.month:02d}"
                label = key
            else:  # item_type
                key, label = sl.sku.item_type, sl.sku.item_type

            b = buckets.setdefault(key, {"key": key, "label": label, "units":0, "revenue":0.0, "cogs":0.0, "gross_profit":0.0})
            for f in ("units","revenue","cogs","gross_profit"): b[f] += row[f]

        return Response(sorted(buckets.values(), key=lambda x: x["label"]))
    
class AnalyticsHypo(APIView):
    """
    POST /api/analytics/hypo
    {
      "event": "<eventId>",                   # optional filter
      "rules": [
        { "match": {"is_bundle": true, "skus": ["id1","id2","id3"]}, "price_unit": "9.00" },
        { "match": {"item_type": "print"}, "price_unit": "8.00" }
      ]
    }
    """
    def post(self, req):
        event_id = req.data.get("event")
        rules = req.data.get("rules", [])
        qs = SaleLine.objects
        if event_id: qs = qs.filter(event=event_id)

        def apply_rules(sl):
            new_price = Decimal(str(sl.price_unit))
            for r in rules:
                m = r.get("match", {})
                ok = True
                if "is_bundle" in m and bool(m["is_bundle"]) != bool(sl.is_bundle): ok = False
                if "item_type" in m and m["item_type"] != sl.sku.item_type: ok = False
                if "skus" in m and str(sl.sku.id) not in m["skus"]: ok = False
                if ok and "price_unit" in r:
                    new_price = Decimal(str(r["price_unit"]))
            units = Decimal(sl.units)
            cost = Decimal(str(sl.cost_unit))
            revenue = units * new_price
            cogs = units * cost
            gp = revenue - cogs
            return {"units": int(units), "revenue": float(revenue), "cogs": float(cogs), "gross_profit": float(gp)}

        total = {"units":0, "revenue":0.0, "cogs":0.0, "gross_profit":0.0}
        by_sku = {}
        for sl in qs:
            row = apply_rules(sl)
            total = {k: total[k] + row[k] for k in total}
            k = str(sl.sku.id)
            b = by_sku.setdefault(k, {"sku_id": k, "sku_name": sl.sku.name, "item_type": sl.sku.item_type,
                                       "units":0,"revenue":0.0,"cogs":0.0,"gross_profit":0.0})
            for f in ("units","revenue","cogs","gross_profit"): b[f] += row[f]
        return Response({"total": total, "by_sku": list(by_sku.values())})

