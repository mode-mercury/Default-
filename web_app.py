from flask import Flask, render_template, request
from PIL import Image
import pytesseract
from googletrans import Translator
from ocr_app import transform_image, get_char_info, transliterate_text
import base64
import io

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    char_info = []
    translation = None
    romanized = None
    img_data = None
    if request.method == 'POST':
        file = request.files.get('image')
        if file:
            img = Image.open(file.stream)
            # Build an args-like object
            class Args:
                invert = bool(request.form.get('invert'))
                mirror = bool(request.form.get('mirror'))
                flip_vertical = bool(request.form.get('flip_vertical'))
                rotate = int(request.form.get('rotate') or 0)
            args = Args()
            img = transform_image(img, args)
            lang = request.form.get('lang') or 'eng'
            result = pytesseract.image_to_string(img, lang=lang)
            char_info = get_char_info(result)
            if request.form.get('romanize'):
                romanized = transliterate_text(result, lang)
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            img_data = base64.b64encode(buf.getvalue()).decode('utf-8')
            translate_to = request.form.get('translate_to')
            if translate_to:
                translator = Translator()
                try:
                    translation = translator.translate(result, dest=translate_to).text
                except Exception as e:
                    translation = f"Translation failed: {e}"
    return render_template(
        'index.html',
        result=result,
        char_info=char_info,
        translation=translation,
        processed_image=img_data,
        romanized=romanized,
    )

if __name__ == '__main__':
    app.run(debug=True)
