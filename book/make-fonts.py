# Converts the system Inter fonts (.otf, CFF outlines) to TrueType in book/out/fonts/.
# Chromium embeds CFF fonts in PDFs as Type 3, which print less cleanly; TrueType embeds properly for KDP.
# Usage: python3 book/make-fonts.py
import os
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
SRC = '/usr/share/fonts/opentype/inter/'
DST = os.path.join(os.path.dirname(__file__), 'out', 'fonts')
os.makedirs(DST, exist_ok=True)
for name in ['Inter-Regular', 'Inter-SemiBold', 'Inter-Bold', 'InterDisplay-Regular', 'InterDisplay-SemiBold', 'InterDisplay-ExtraBold']:
    f = TTFont(SRC + name + '.otf')
    order, gs = f.getGlyphOrder(), f.getGlyphSet()
    f['loca'] = newTable('loca'); glyf = f['glyf'] = newTable('glyf'); glyf.glyphOrder = order; glyf.glyphs = {}
    for g in order:
        tp = TTGlyphPen(gs); gs[g].draw(Cu2QuPen(tp, 1.0, reverse_direction=True)); glyf[g] = tp.glyph()
    del f['CFF ']
    if 'VORG' in f: del f['VORG']
    f['maxp'] = maxp = newTable('maxp'); maxp.tableVersion = 0x00010000
    for k in ['maxTwilightPoints', 'maxStorage', 'maxFunctionDefs', 'maxInstructionDefs', 'maxStackElements', 'maxSizeOfInstructions', 'maxComponentElements', 'maxComponentDepth']: setattr(maxp, k, 0)
    maxp.maxZones = 1
    post = f['post']; post.formatType = 2.0; post.extraNames = []; post.mapping = {}; post.glyphOrder = order
    f['head'].glyphDataFormat = 0; f.sfntVersion = '\x00\x01\x00\x00'
    f.save(os.path.join(DST, name + '.ttf'))
    print('ok', name)
