# Extension Icons

Place icon files here:
- icon-16.png (16x16 pixels)
- icon-48.png (48x48 pixels)  
- icon-128.png (128x128 pixels)

For now, you can use the SVG icons from hub/public/ and convert them to PNG, or create simple placeholder icons.

To create icons from SVG:
```bash
# Using ImageMagick
convert -background none -resize 16x16 hub/public/icon-192.svg assets/icons/icon-16.png
convert -background none -resize 48x48 hub/public/icon-192.svg assets/icons/icon-48.png
convert -background none -resize 128x128 hub/public/icon-192.svg assets/icons/icon-128.png

# Or using sips (macOS)
sips -z 16 16 hub/public/icon-192.svg --out assets/icons/icon-16.png
```
