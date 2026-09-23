from django.contrib import admin

from .models import Flower, FlowerColor, FlowerVariant, Ribbon, Wrapper


class FlowerVariantInline(admin.TabularInline):
    model = FlowerVariant
    extra = 0


@admin.register(Flower)
class FlowerAdmin(admin.ModelAdmin):
    list_display = ("label", "slug", "rol", "ancho", "alto", "visible", "orden")
    list_filter = ("rol", "visible")
    inlines = [FlowerVariantInline]


@admin.register(FlowerColor)
class FlowerColorAdmin(admin.ModelAdmin):
    list_display = ("label", "slug", "swatch", "visible", "orden")


@admin.register(Wrapper)
class WrapperAdmin(admin.ModelAdmin):
    list_display = ("label", "tamano", "capacidad", "visible", "orden")


@admin.register(Ribbon)
class RibbonAdmin(admin.ModelAdmin):
    list_display = ("label", "slug", "visible", "orden")
