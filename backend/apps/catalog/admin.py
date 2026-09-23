from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("titulo", "slug", "visible", "orden")
    list_editable = ("visible", "orden")
    prepopulated_fields = {"slug": ("titulo",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("nombre", "categoria", "precio", "disponible", "orden")
    list_editable = ("precio", "disponible", "orden")
    list_filter = ("categoria", "disponible")
    search_fields = ("nombre", "descripcion")
