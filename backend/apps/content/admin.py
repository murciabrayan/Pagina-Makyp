from django.contrib import admin

from .models import GalleryImage, HelpItem, HeroSlide, SiteSettings, ValueProp


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("whatsapp_visible", "email", "actualizado")

    def has_add_permission(self, request):
        # es una sola fila: se edita, no se crea
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ("__str__", "visible", "orden")
    list_editable = ("visible", "orden")


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ("__str__", "visible", "orden")
    list_editable = ("visible", "orden")


@admin.register(HelpItem)
class HelpItemAdmin(admin.ModelAdmin):
    list_display = ("pregunta", "slug", "visible", "orden")
    list_editable = ("visible", "orden")


@admin.register(ValueProp)
class ValuePropAdmin(admin.ModelAdmin):
    list_display = ("titulo", "icono", "visible", "orden")
    list_editable = ("visible", "orden")
