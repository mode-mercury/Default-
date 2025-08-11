import argparse
import unicodedata
from PIL import Image, ImageOps
import pytesseract
from googletrans import Translator
from transliterate import translit, get_available_language_codes

# Additional mappings for various symbol sets
MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
}

# Ogham letters with Latin equivalents and traditional names
OGHAM_MAP = {
    'ᚁ': ('B', 'Beith'), 'ᚂ': ('L', 'Luis'), 'ᚃ': ('F', 'Fearn'),
    'ᚄ': ('S', 'Saille'), 'ᚅ': ('N', 'Nion'), 'ᚆ': ('H', 'Uath'),
    'ᚇ': ('D', 'Dair'), 'ᚈ': ('T', 'Tinne'), 'ᚉ': ('C', 'Coll'),
    'ᚊ': ('Q', 'Ceirt'), 'ᚋ': ('M', 'Muin'), 'ᚌ': ('G', 'Gort'),
    'ᚍ': ('NG', 'nGeadal'), 'ᚎ': ('Z', 'Straif'), 'ᚏ': ('R', 'Ruis'),
    'ᚐ': ('A', 'Ailm'), 'ᚑ': ('O', 'Onn'), 'ᚒ': ('U', 'Ur'),
    'ᚓ': ('E', 'Eadhadh'), 'ᚔ': ('I', 'Idad'),
}

# A small subset of Deseret alphabet mapping
DESERET_MAP = {
    '𐐀': 'EE', '𐐁': 'EE', '𐐂': 'AH', '𐐃': 'AH',
    '𐐄': 'O', '𐐅': 'O', '𐐆': 'OO', '𐐇': 'OO',
}

# Some alchemical symbols and their meanings
ALCHEMY_MAP = {
    '🜁': 'Air', '🜂': 'Fire', '🜃': 'Water', '🜄': 'Earth',
    '🜅': 'Arsenic', '🜆': 'Realgar', '🜇': 'Borax', '🜈': 'Sublimate',
}

# Basic IPA letters with description
IPA_MAP = {
    'ð': 'eth (voiced dental fricative)',
    'θ': 'theta (voiceless dental fricative)',
    'ʃ': 'esh (voiceless postalveolar fricative)',
    'ʒ': 'ezh (voiced postalveolar fricative)',
    'ŋ': 'eng (velar nasal)',
    'æ': 'ash (near-open front vowel)',
}

# Placeholder for a few common hobo sign approximations (not standardized)
HOBO_MAP = {
    '⚑': 'Safe place',
    '✔': 'Work available',
}


def get_extra_info(ch):
    """Return additional information about a character if available."""
    # Morse code for latin letters and digits
    if ch.upper() in MORSE_CODE:
        return f"Morse {MORSE_CODE[ch.upper()]}"
    # Ogham
    if ch in OGHAM_MAP:
        latin, name = OGHAM_MAP[ch]
        return f"Ogham {name} -> {latin}"
    # Deseret
    if ch in DESERET_MAP:
        return f"Deseret {DESERET_MAP[ch]}"
    # Alchemical symbol
    if ch in ALCHEMY_MAP:
        return f"Alchemy {ALCHEMY_MAP[ch]}"
    # IPA letters
    if ch in IPA_MAP:
        return f"IPA {IPA_MAP[ch]}"
    # Hobo sign approximation
    if ch in HOBO_MAP:
        return f"Hobo {HOBO_MAP[ch]}"
    return None

# Minimal Coptic transliteration map based on common scholarly convention
COP_TRANSLIT = {
    'Ⲁ': 'a', 'ⲁ': 'a',
    'Ⲃ': 'b', 'ⲃ': 'b',
    'Ⲅ': 'g', 'ⲅ': 'g',
    'Ⲇ': 'd', 'ⲇ': 'd',
    'Ⲉ': 'e', 'ⲉ': 'e',
    'Ⲋ': 's', 'ⲋ': 's',
    'Ⲍ': 'z', 'ⲍ': 'z',
    'Ⲏ': 'h', 'ⲏ': 'h',
    'Ⲑ': 'th', 'ⲑ': 'th',
    'Ⲓ': 'i', 'ⲓ': 'i',
    'Ⲕ': 'k', 'ⲕ': 'k',
    'Ⲗ': 'l', 'ⲗ': 'l',
    'Ⲙ': 'm', 'ⲙ': 'm',
    'Ⲛ': 'n', 'ⲛ': 'n',
    'Ⲝ': 'x', 'ⲝ': 'x',
    'Ⲟ': 'o', 'ⲟ': 'o',
    'Ⲡ': 'p', 'ⲡ': 'p',
    'Ⲣ': 'r', 'ⲣ': 'r',
    'Ⲥ': 's', 'ⲥ': 's',
    'Ⲧ': 't', 'ⲧ': 't',
    'Ⲩ': 'u', 'ⲩ': 'u',
    'Ⲫ': 'f', 'ⲫ': 'f',
    'Ⲭ': 'kh', 'ⲭ': 'kh',
    'Ⲯ': 'ps', 'ⲯ': 'ps',
    'Ⲱ': 'o', 'ⲱ': 'o',
}


def parse_args():
    parser = argparse.ArgumentParser(description="OCR with optional transformations")
    parser.add_argument('image', help='Path to the image file')
    parser.add_argument('--invert', action='store_true', help='Invert colors')
    parser.add_argument('--mirror', action='store_true', help='Mirror image horizontally')
    parser.add_argument('--flip-vertical', action='store_true', help='Flip image vertically')
    parser.add_argument('--rotate', type=int, choices=[90, 180, 270], default=0,
                        help='Rotate image by given degrees')
    parser.add_argument('--lang', default='eng', help='Tesseract language code (e.g. eng, rus, ell, heb)')
    parser.add_argument('--translate-to', dest='translate_to', default=None,
                        help='Translate OCR text to specified language code')
    parser.add_argument('--romanize', action='store_true',
                        help='Transliterate output to Latin if supported')
    return parser.parse_args()


def transform_image(image, args):
    if args.invert:
        image = ImageOps.invert(image.convert('RGB'))
    if args.mirror:
        image = ImageOps.mirror(image)
    if args.flip_vertical:
        image = ImageOps.flip(image)
    if args.rotate:
        image = image.rotate(args.rotate, expand=True)
    return image


def get_char_info(text):
    info = []
    for ch in text:
        if ch.strip():
            try:
                name = unicodedata.name(ch)
            except ValueError:
                name = 'UNKNOWN'
            extra = get_extra_info(ch)
            if extra:
                info.append(f"{ch} - {name} ({extra})")
            else:
                info.append(f"{ch} - {name}")
    return info


def transliterate_text(text, lang):
    """Return a Latin transliteration of text for specific languages."""
    if lang in get_available_language_codes():
        try:
            return translit(text, lang, reversed=True)
        except Exception:
            pass
    if lang.startswith('ru') or lang == 'cyrillic':
        try:
            return translit(text, 'ru', reversed=True)
        except Exception:
            pass
    if lang.startswith('ka'):
        try:
            return translit(text, 'ka', reversed=True)
        except Exception:
            pass
    if lang.startswith('cop'):
        return ''.join(COP_TRANSLIT.get(ch, ch) for ch in text)
    return text


def main():
    args = parse_args()
    img = Image.open(args.image)
    img = transform_image(img, args)

    text = pytesseract.image_to_string(img, lang=args.lang)
    print("OCR Result:")
    print(text)

    if args.romanize:
        romanized = transliterate_text(text, args.lang)
        if romanized != text:
            print("\nRomanized:")
            print(romanized)

    print("Character names:")
    for line in get_char_info(text):
        print(line)

    if args.translate_to:
        translator = Translator()
        try:
            translation = translator.translate(text, dest=args.translate_to)
            print(f"\nTranslation ({args.translate_to}):")
            print(translation.text)
        except Exception as e:
            print("Translation failed:", e)


if __name__ == '__main__':
    main()
